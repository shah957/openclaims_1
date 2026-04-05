import { Resend } from "resend";

export type NotificationType =
  | "claim_received"
  | "claim_auto_approved"
  | "claim_rejected"
  | "claim_flagged"
  | "review_decision";

type SendNotificationInput = {
  type: NotificationType;
  claimId: string;
  email?: string;
  payload?: Record<string, unknown>;
};

function buildNotificationContent(input: SendNotificationInput) {
  switch (input.type) {
    case "claim_received":
      return {
        subject: `OpenClaims Ops: claim ${input.claimId} received`,
        text: `Claim ${input.claimId} has been received and is now processing.`,
      };
    case "claim_auto_approved":
      return {
        subject: `OpenClaims Ops: claim ${input.claimId} approved`,
        text: `Claim ${input.claimId} was auto-approved.`,
      };
    case "claim_rejected":
      return {
        subject: `OpenClaims Ops: claim ${input.claimId} rejected`,
        text: `Claim ${input.claimId} was rejected during processing.`,
      };
    case "claim_flagged":
      return {
        subject: `OpenClaims Ops: claim ${input.claimId} flagged`,
        text: `Claim ${input.claimId} needs manual review.`,
      };
    case "review_decision":
      return {
        subject: `OpenClaims Ops: claim ${input.claimId} reviewed`,
        text: `Claim ${input.claimId} received a manual review decision.`,
      };
    default:
      return {
        subject: `OpenClaims Ops notification`,
        text: `Claim ${input.claimId} was updated.`,
      };
  }
}

export async function sendNotification(input: SendNotificationInput) {
  const content = buildNotificationContent(input);

  if (
    !process.env.RESEND_API_KEY ||
    !process.env.RESEND_FROM_EMAIL ||
    !input.email
  ) {
    console.log("[notifications:fallback]", {
      ...input,
      ...content,
    });

    return {
      delivered: false,
      fallback: true,
    };
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL,
    to: input.email,
    subject: content.subject,
    text: content.text,
  });

  return {
    delivered: true,
    fallback: false,
  };
}
