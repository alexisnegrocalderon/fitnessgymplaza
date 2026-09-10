import { Resend } from "resend";
import { EVENT_DETAILS } from "../../shared/registration.js";
import {
  bookingConfirmedEmailHtml,
  invitationEmailHtml,
  magicLinkEmailHtml,
  planConfirmationEmailHtml,
  sessionCancelledEmailHtml,
  waitlistPromotedEmailHtml,
} from "./emailTemplate.js";

async function sendEmail(to: string, subject: string, html: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is required to send emails");
  }

  const from =
    process.env.RESEND_FROM_EMAIL ||
    "Plaza Fitness <invitaciones@plazafitness.cl>";
  const resend = new Resend(apiKey);

  const { error } = await resend.emails.send({ from, to, subject, html });
  if (error) {
    throw new Error(`Resend error: ${error.message}`);
  }
}

export async function sendInvitationEmail(to: string, fullName: string) {
  await sendEmail(
    to,
    `Tu lugar en la ${EVENT_DETAILS.name} está confirmado`,
    invitationEmailHtml(fullName)
  );
}

export async function sendPlanConfirmationEmail(
  to: string,
  fullName: string,
  planLabel: string,
  price: string
) {
  await sendEmail(
    to,
    `Tu plan ${planLabel} en Plaza Fitness está confirmado`,
    planConfirmationEmailHtml(fullName, planLabel, price)
  );
}

export async function sendMagicLinkEmail(
  to: string,
  fullName: string,
  magicLinkUrl: string
) {
  await sendEmail(
    to,
    "Tu acceso a Plaza Fitness",
    magicLinkEmailHtml(fullName, magicLinkUrl)
  );
}

export async function sendBookingConfirmedEmail(
  to: string,
  fullName: string,
  classLabel: string
) {
  await sendEmail(
    to,
    "Clase reservada — Plaza Fitness",
    bookingConfirmedEmailHtml(fullName, classLabel)
  );
}

export async function sendWaitlistPromotedEmail(
  to: string,
  fullName: string,
  classLabel: string
) {
  await sendEmail(
    to,
    "¡Entraste desde la lista de espera! — Plaza Fitness",
    waitlistPromotedEmailHtml(fullName, classLabel)
  );
}

export async function sendSessionCancelledEmail(
  to: string,
  fullName: string,
  classLabel: string
) {
  await sendEmail(
    to,
    "Clase cancelada — Plaza Fitness",
    sessionCancelledEmailHtml(fullName, classLabel)
  );
}
