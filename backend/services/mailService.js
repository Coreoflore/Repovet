import nodemailer from 'nodemailer';

export async function sendContactEmail(name, email, message) {
  // Create a transporter using SMTP transport
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  // Verify connection configuration
  await transporter.verify();

  // Send mail with defined transport object
  const info = await transporter.sendMail({
    from: `"Repovet Contact Form" <${process.env.EMAIL_USER}>`,
    to: process.env.CONTACT_EMAIL || process.env.EMAIL_USER, // The developer's email to receive the message
    subject: `New Contact Request from ${name}`,
    text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
    html: `
      <h3>New Contact Request</h3>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Message:</strong></p>
      <p>${message.replace(/\n/g, '<br>')}</p>
    `,
  });

  return info;
}
