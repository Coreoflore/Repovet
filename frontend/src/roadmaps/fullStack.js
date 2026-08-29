// DANGER: This file must be kept in sync with backend/roadmaps/fullStack.js
export const fullStackRoadmap = {
  "id": "full-stack-beginner",
  "title": "Full-Stack Developer Roadmap",
  "phases": [
    {
      "id": "frontend",
      "label": "Frontend",
      "colorRole": "frontend",
      "nodes": [
        { "id": "html", "label": "HTML", "type": "topic" },
        { "id": "css", "label": "CSS", "type": "topic" },
        { "id": "checkpoint-static-webpages", "label": "Static Webpages", "type": "checkpoint", "requires": ["html", "css"] },
        { "id": "javascript", "label": "JavaScript", "type": "topic" },
        { "id": "checkpoint-interactivity", "label": "Interactivity", "type": "checkpoint", "requires": ["javascript"] },
        { "id": "npm", "label": "npm", "type": "tool" },
        { "id": "git", "label": "Git", "type": "tool" },
        { "id": "github", "label": "GitHub", "type": "tool" },
        { "id": "checkpoint-external-packages", "label": "External Packages", "type": "checkpoint", "requires": ["npm", "git", "github"] },
        { "id": "react", "label": "React", "type": "topic", "optional": true, "note": "Feel free to skip and revisit after Backend" },
        { "id": "tailwind", "label": "Tailwind CSS", "type": "topic", "optional": true, "note": "Feel free to skip and revisit after Backend" },
        { "id": "checkpoint-collaborative-work", "label": "Collaborative Work", "type": "checkpoint", "requires": ["react", "tailwind"] },
        { "id": "checkpoint-frontend-apps", "label": "Frontend Apps", "type": "checkpoint", "isPhaseGate": true }
      ]
    },
    {
      "id": "backend",
      "label": "Backend",
      "colorRole": "backend",
      "nodes": [
        { "id": "nodejs", "label": "Node.js", "type": "topic", "note": "Any backend language works — Node.js is recommended since you already know JavaScript" },
        { "id": "checkpoint-cli-apps", "label": "CLI Apps", "type": "checkpoint", "requires": ["nodejs"] },
        { "id": "restful-apis", "label": "RESTful APIs", "type": "topic" },
        { "id": "checkpoint-crud-apps", "label": "Simple CRUD Apps", "type": "checkpoint", "requires": ["restful-apis"] },
        { "id": "redis", "label": "Redis", "type": "topic" },
        { "id": "jwt-auth", "label": "JWT Auth", "type": "topic" },
        { "id": "linux-basics", "label": "Linux Basics", "type": "topic" },
        { "id": "checkpoint-complete-app", "label": "Complete App", "type": "checkpoint", "requires": ["redis", "jwt-auth", "linux-basics"], "isPhaseGate": true }
      ]
    },
    {
      "id": "devops",
      "label": "DevOps / AWS",
      "colorRole": "devops",
      "nodes": [
        { "id": "aws-ec2", "label": "EC2", "type": "topic", "group": "aws-basics" },
        { "id": "aws-vpc", "label": "VPC", "type": "topic", "group": "aws-basics" },
        { "id": "aws-route53", "label": "Route53", "type": "topic", "group": "aws-basics" },
        { "id": "aws-ses", "label": "SES", "type": "topic", "group": "aws-basics" },
        { "id": "aws-s3", "label": "S3", "type": "topic", "group": "aws-basics" },
        { "id": "postgresql", "label": "PostgreSQL", "type": "topic" },
        { "id": "monit", "label": "Monit", "type": "tool" },
        { "id": "checkpoint-deployment", "label": "Deployment", "type": "checkpoint" },
        { "id": "github-actions", "label": "GitHub Actions", "type": "tool" },
        { "id": "checkpoint-monitoring", "label": "Monitoring", "type": "checkpoint", "requires": ["github-actions"] },
        { "id": "ansible", "label": "Ansible", "type": "tool" },
        { "id": "checkpoint-cicd", "label": "CI / CD", "type": "checkpoint", "requires": ["ansible"] },
        { "id": "terraform", "label": "Terraform", "type": "tool" },
        { "id": "checkpoint-automation", "label": "Automation", "type": "checkpoint", "requires": ["terraform"] },
        { "id": "checkpoint-infrastructure", "label": "Infrastructure", "type": "checkpoint", "isPhaseGate": true }
      ]
    }
  ]
};
