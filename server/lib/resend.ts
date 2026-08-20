import { Resend } from "resend";
import { EVENT_DETAILS } from "../../shared/registration";
import { invitationEmailHtml } from "./emailTemplate";

export async function sendInvitationEmail(to: string, fullName: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is required to send invitation emails");
  }

  const from =
    process.env.RESEND_FROM_EMAIL ||
    "Plaza Fitness <invitaciones@plazafitness.cl>";
  const resend = new Resend(apiKey);

  const { error } = await resend.emails.send({
    from,
    to,
    subject: `Tu lugar en la ${EVENT_DETAILS.name} está confirmado`,
    html: invitationEmailHtml(fullName),
  });

  if (error) {
    throw new Error(`Resend error: ${error.message}`);
  }
}
