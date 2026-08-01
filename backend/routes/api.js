import express from 'express';
import mongoose from 'mongoose';
import Candidate from '../models/Candidate.js';
import Session from '../models/Session.js';
import Answer from '../models/Answer.js';
import { fetchRepoMetadata } from '../services/githubService.js';
import { extractResumeText, uploadResume, validateResumeText } from '../services/uploadService.js';
import { summarizeAnswerQuality } from '../services/answerService.js';
import {
  generateCandidateAnalysis,
  generateFinalReport,
  generateQuestions
} from '../services/aiService.js';
import { sendLogToDiscord } from '../services/discordService.js';

const router = express.Router();

function asyncHandler(handler) {
  return (request, response, next) => Promise.resolve(handler(request, response, next)).catch(next);
}

function requireDatabase(response) {
  if (mongoose.connection.readyState !== 1) {
    response.status(503).json({ error: 'Database is not connected. Configure MONGODB_URI and restart the API.' });
    return false;
  }
  return true;
}

function candidateBasics(resumeText) {
  const email = resumeText.match(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/i)?.[0] || '';
  const firstLine = resumeText.split(/\r?\n/).map((line) => line.trim()).find(Boolean);
  const name = firstLine && !firstLine.includes('@') && firstLine.length < 100 ? firstLine : 'Candidate';
  return { name, email };
}

export function normalizeQuestionText(text, repoData, repoUrls) {
  const question = String(text || 'Explain a technical decision you made in a recent project.');
  const unsupportedGitPremise = /(?:lack|absence|no|not enough|insufficient)\s+(?:of\s+)?(?:evidence|proof).*\b(?:git|github|repository)\b|\b(?:git|github|repository)\b.*(?:lack|absence|no|not enough|insufficient)\s+(?:of\s+)?(?:evidence|proof)/i.test(question);
  if (!unsupportedGitPremise) return question;

  const firstRepoData = Array.isArray(repoData) ? repoData[0] : repoData;
  const repositoryName = firstRepoData?.repository?.name || 'this project';
  const hasRepoUrl = Array.isArray(repoUrls) ? repoUrls.length > 0 : !!repoUrls;
  const hasGithub = firstRepoData?.repository || firstRepoData?.evidence?.hosted_on_github;

  if (hasRepoUrl || hasGithub) {
    return `How did you use Git and GitHub while developing ${repositoryName}? Describe your version-control workflow, collaboration or review practices, and what you learned.`;
  }

  return 'If you have used Git or GitHub in your projects, describe your version-control workflow and how it supported your development process.';
}

function normalizeQuestions(questions, repoData, repoUrls) {
  return questions.map((question) => ({
    text: normalizeQuestionText(question.text, repoData, repoUrls),
    type: question.type,
    targets: question.targets || [],
    difficulty: question.difficulty
  }));
}

function requestedQuestionCount(value) {
  const count = value === undefined ? Number(process.env.QUESTION_COUNT || 6) : Number(value);
  return Number.isInteger(count) && count >= 3 && count <= 10 ? count : null;
}

function guardAnswerReviews(report, answerQuality) {
  const weakQuestions = new Map(
    (answerQuality.weak_questions || []).map(({ questionId, flags }) => [String(questionId), flags])
  );
  const sourceReviews = Array.isArray(report.answer_reviews) && report.answer_reviews.length > 0
    ? report.answer_reviews
    : [...weakQuestions.entries()].map(([questionId, flags]) => ({
      question_id: questionId,
      score: 0,
      strengths: [],
      gaps: [`This answer did not provide enough substance (${flags.join(', ')}).`],
      feedback: 'Use a specific example, explain your decisions, and describe the outcome.',
      evidence_quote: ''
    }));

  return sourceReviews.map((review) => {
    const questionId = String(review.question_id || review.questionId || '');
    const flags = weakQuestions.get(questionId);
    if (!flags) return { ...review, question_id: questionId };

    const isCompletelyWeak = answerQuality.substantive_count === 0;
    const existingGaps = Array.isArray(review.gaps) ? review.gaps : [];
    return {
      ...review,
      question_id: questionId,
      score: isCompletelyWeak ? 0 : Math.min(Number(review.score) || 0, 40),
      strengths: [],
      gaps: [`This answer did not provide enough substance (${flags.join(', ')}).`, ...existingGaps],
      feedback: 'Use a specific example, explain your decisions, and describe the outcome.',
      evidence_quote: ''
    };
  });
}

export function guardReportAgainstWeakAnswers(report, answerQuality) {
  const gaps = Array.isArray(report.gaps) ? [...report.gaps] : [];
  const nextSteps = Array.isArray(report.next_steps) ? [...report.next_steps] : [];
  const answerReviews = guardAnswerReviews(report, answerQuality);

  const weakQuestions = new Map(
    (answerQuality.weak_questions || []).map(({ questionId, flags }) => [String(questionId), flags])
  );

  let weakCount = 0;
  let substantiveCount = 0;

  const processedReviews = answerReviews.map((review) => {
    const questionId = String(review.question_id || '');
    const isLocalWeak = weakQuestions.has(questionId);
    const score = Number(review.score) || 0;
    const isWeak = isLocalWeak || score < 40;

    if (isWeak) {
      weakCount++;
    } else {
      substantiveCount++;
    }

    return review;
  });

  const warning = `${weakCount} answer${weakCount === 1 ? '' : 's'} did not provide enough substance to verify the candidate's claims.`;

  if (substantiveCount === 0) {
    return {
      ...report,
      recommended_level: 'Insufficient evidence',
      strengths: [],
      gaps: [warning, ...gaps.filter((gap) => gap !== warning)],
      answer_reviews: processedReviews,
      next_steps: [
        'Strengthen each resume claim with a specific project example, your individual contribution, and measurable results.',
        'Practice answering each interview question with the situation, your decision, the trade-off you considered, and the outcome.',
        ...nextSteps.filter((step) => !String(step).startsWith('Strengthen each resume claim'))
      ]
    };
  }

  const updatedGaps = (weakCount > 0 && !gaps.includes(warning))
    ? [warning, ...gaps]
    : gaps;

  return { ...report, gaps: updatedGaps, next_steps: nextSteps, answer_reviews: processedReviews };
}

router.get('/health', (_request, response) => {
  response.json({ ok: true, database: mongoose.connection.readyState === 1 });
});



router.get('/sessions/:id', asyncHandler(async (request, response) => {
  if (!requireDatabase(response)) return;

  const { id } = request.params;
  if (!mongoose.isValidObjectId(id)) {
    response.status(400).json({ error: 'Invalid session ID.' });
    return;
  }

  const session = await Session.findById(id).lean();
  if (!session) {
    response.status(404).json({ error: 'Session not found.' });
    return;
  }

  const answers = await Answer.find({ sessionId: id }).lean();

  response.json({
    sessionId: session._id,
    targetRole: session.targetRole,
    repoUrls: session.repoUrls,
    questions: session.questions,
    finalReport: session.finalReport,
    status: session.status,
    answeredCount: answers.length,
    answers: answers.map(a => ({ questionId: a.questionId, answerText: a.answerText }))
  });
}));

router.post('/upload-resume', uploadResume, asyncHandler(async (request, response) => {
  const resumeText = await extractResumeText(request.file);
  const validation = validateResumeText(resumeText);
  if (!validation.valid) {
    response.status(400).json({ error: validation.reason });
    return;
  }

  response.json({ resumeText });
}));

router.post('/sessions', asyncHandler(async (request, response) => {
  const { resumeText, repoUrls = [], repoUrl = '', targetRole, questionCount } = request.body || {};
  if (typeof resumeText !== 'string' || !resumeText.trim()) {
    response.status(400).json({ error: 'resumeText is required.' });
    return;
  }
  const resumeValidation = validateResumeText(resumeText);
  if (!resumeValidation.valid) {
    response.status(400).json({ error: resumeValidation.reason });
    return;
  }
  if (typeof targetRole !== 'string' || !targetRole.trim()) {
    response.status(400).json({ error: 'targetRole is required.' });
    return;
  }

  const count = requestedQuestionCount(questionCount);
  if (!count) {
    response.status(400).json({ error: 'questionCount must be an integer between 3 and 10.' });
    return;
  }
  if (!requireDatabase(response)) return;

  let normalizedRepoUrls = [];
  if (Array.isArray(repoUrls) && repoUrls.length > 0) {
    normalizedRepoUrls = repoUrls.map(url => typeof url === 'string' ? url.trim() : '').filter(Boolean);
  } else if (typeof repoUrl === 'string' && repoUrl.trim()) {
    normalizedRepoUrls = [repoUrl.trim()];
  }

  const repoDataList = await Promise.all(normalizedRepoUrls.map(url => fetchRepoMetadata(url)));
  const failedRepo = repoDataList.find(data => data && data.error);
  if (failedRepo) {
    response.status(400).json({ error: failedRepo.error });
    return;
  }

  const analysisResult = await generateCandidateAnalysis(resumeText, repoDataList, targetRole, normalizedRepoUrls);
  const questions = normalizeQuestions(await generateQuestions(analysisResult, count, repoDataList, normalizedRepoUrls, targetRole), repoDataList, normalizedRepoUrls);
  const candidate = await Candidate.create({ ...candidateBasics(resumeText), resumeText: resumeText.trim() });
  const session = await Session.create({
    candidateId: candidate._id,
    repoUrls: normalizedRepoUrls,
    targetRole: targetRole.trim(),
    repoData: repoDataList,
    analysisResult,
    questions,
    status: 'ready'
  });

  sendLogToDiscord(
    '🟢 Interview Session Initialized',
    `A new candidate screening session has been created.`,
    [
      { name: 'Target Role', value: targetRole.trim(), inline: true },
      { name: 'Questions count', value: `${questions.length}`, inline: true },
      { name: 'Repositories', value: `${normalizedRepoUrls.length || 'None'} linked`, inline: true }
    ],
    3066993
  );

  response.status(201).json({
    sessionId: session._id,
    questionCount: questions.length,
    questions,
    analysis: analysisResult
  });
}));

router.post('/sessions/:id/answer', asyncHandler(async (request, response) => {
  if (!requireDatabase(response)) return;

  const { id } = request.params;
  const { questionId, answerText } = request.body || {};
  if (!mongoose.isValidObjectId(id)) {
    response.status(400).json({ error: 'Invalid session ID.' });
    return;
  }
  if (questionId === undefined || questionId === null || questionId === '' || typeof answerText !== 'string' || !answerText.trim()) {
    response.status(400).json({ error: 'questionId and answerText are required.' });
    return;
  }

  const session = await Session.findById(id).select('_id questions').lean();
  if (!session) {
    response.status(404).json({ error: 'Session not found.' });
    return;
  }

  const questionIndex = Number(questionId);
  if (!Number.isInteger(questionIndex) || questionIndex < 0 || questionIndex >= session.questions.length) {
    response.status(400).json({ error: 'questionId does not refer to a question in this session.' });
    return;
  }

  const answer = await Answer.findOneAndUpdate(
    { sessionId: id, questionId: String(questionIndex) },
    { $set: { answerText: answerText.trim(), timestamp: new Date() } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  sendLogToDiscord(
    '💬 Answer Submitted',
    `Candidate submitted an answer to Question ${questionIndex + 1}.`,
    [
      { name: 'Session ID', value: id, inline: true },
      { name: 'Progress', value: `${questionIndex + 1} of ${session.questions.length}`, inline: true }
    ],
    15105570
  );

  response.status(201).json({ answerId: answer._id, saved: true });
}));

router.delete('/sessions/:id', asyncHandler(async (request, response) => {
  if (!requireDatabase(response)) return;

  const { id } = request.params;
  if (!mongoose.isValidObjectId(id)) {
    response.status(400).json({ error: 'Invalid session ID.' });
    return;
  }

  const session = await Session.findById(id).select('candidateId').lean();
  if (!session) {
    response.status(404).json({ error: 'Session not found.' });
    return;
  }

  await Promise.all([
    Answer.deleteMany({ sessionId: id }),
    Session.deleteOne({ _id: id }),
    Candidate.deleteOne({ _id: session.candidateId })
  ]);

  response.json({ deleted: true });
}));

router.post('/sessions/:id/report', asyncHandler(async (request, response) => {
  if (!requireDatabase(response)) return;

  const { id } = request.params;
  if (!mongoose.isValidObjectId(id)) {
    response.status(400).json({ error: 'Invalid session ID.' });
    return;
  }

  const session = await Session.findById(id).lean();
  if (!session) {
    response.status(404).json({ error: 'Session not found.' });
    return;
  }

  const [candidate, answers] = await Promise.all([
    Candidate.findById(session.candidateId).lean(),
    Answer.find({ sessionId: id }).sort({ timestamp: 1 }).lean()
  ]);

  if (answers.length < session.questions.length) {
    response.status(400).json({ error: `Answer all ${session.questions.length} questions before requesting the report.` });
    return;
  }

  const answerPayload = answers.map(({ questionId, answerText, timestamp }) => ({ questionId, answerText, timestamp }));
  const answerQuality = summarizeAnswerQuality(answerPayload);

  const generatedReport = await generateFinalReport(
    {
      targetRole: session.targetRole,
      repoUrls: session.repoUrls,
      repoData: session.repoData,
      analysisResult: session.analysisResult,
      questions: session.questions,
      answerQuality,
      candidate: {
        name: candidate?.name,
        email: candidate?.email,
        resumeText: candidate?.resumeText
      }
    },
    answerPayload
  );
  const report = {
    ...guardReportAgainstWeakAnswers(generatedReport, answerQuality),
    answer_quality: answerQuality
  };

  await Session.findByIdAndUpdate(id, { finalReport: report, status: 'completed' });

  sendLogToDiscord(
    '🏆 Interview Session Completed',
    `Candidate finished the assessment and a hiring report was generated.`,
    [
      { name: 'Target Role', value: session.targetRole || 'Engineer', inline: true },
      { name: 'Recommended Level', value: report.recommended_level || 'N/A', inline: true },
      { name: 'Evidence Score', value: `${answerQuality.substantive_count} of ${answerQuality.answered_count} answers verified`, inline: true }
    ],
    3447003
  );

  response.json(report);
}));

router.post('/contact', asyncHandler(async (request, response) => {
  const { name, email, message } = request.body || {};

  if (!name || !name.trim()) {
    response.status(400).json({ error: 'Name is required.' });
    return;
  }
  if (!email || !email.trim() || !/^[\w.+-]+@[\w-]+(?:\.[\w-]+)+$/.test(email)) {
    response.status(400).json({ error: 'Valid email is required.' });
    return;
  }
  if (!message || !message.trim()) {
    response.status(400).json({ error: 'Message is required.' });
    return;
  }

  try {
    const { sendContactEmail } = await import('../services/mailService.js');
    await sendContactEmail(name.trim(), email.trim(), message.trim());
    response.status(200).json({ success: true, message: 'Message sent successfully.' });
  } catch (error) {
    console.error('Failed to send contact email:', error);
    sendLogToDiscord(
      '📧 Contact Form Email Failed',
      `Failed to send email from ${name} (${email}).`,
      [
        { name: 'Error', value: error.message, inline: true }
      ],
      15158332
    );
    // Respond with success to not let the user know if email sending fails internally,
    // or we can respond with error. Responding with 500 is standard.
    response.status(500).json({ error: 'Failed to send message. Please try again later.' });
  }
}));

export default router;
