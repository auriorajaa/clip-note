import { baseEmailTemplate } from "./base.template.js";

export const verificationEmailTemplate = (verificationUrl: string): string => {
  return baseEmailTemplate({
    title: "Verify your email address",
    body: "Thanks for signing up! Please confirm your email address by clicking the button below. This link will expire in 24 hours.",
    buttonText: "Verify Email",
    buttonUrl: verificationUrl,
  });
};
