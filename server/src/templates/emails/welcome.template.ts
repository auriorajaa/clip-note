import { baseEmailTemplate } from "./base.template.js";

export const welcomeEmailTemplate = (name: string): string => {
  return baseEmailTemplate({
    title: `Welcome to Clip Note, ${name}!`,
    body: `
      We're excited to have you on board. Clip Note helps you capture, annotate, and organize video clips so nothing important slips through the cracks.
      <br /><br />
      Here's what you can do to get started:
      <br /><br />
      <ul style="margin: 0; padding-left: 20px; color: #4a4a4a; font-size: 14px; line-height: 1.8;">
        <li>Upload your first video clip</li>
        <li>Add timestamped notes and annotations</li>
        <li>Organize clips into collections</li>
      </ul>
      <br />
      If you have any questions along the way, feel free to reach out — we're happy to help.
    `,
    buttonText: "Get Started",
    buttonUrl: process.env.FRONTEND_URL || "http://localhost:3000",
  });
};
