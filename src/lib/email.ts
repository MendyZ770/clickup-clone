import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const FROM_EMAIL = process.env.FROM_EMAIL ?? "onboarding@resend.dev";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://clickup-clone-three.vercel.app";

export async function sendInvitationEmail({
  to,
  workspaceName,
  inviterName,
  token,
}: {
  to: string;
  workspaceName: string;
  inviterName: string | null;
  token: string;
}) {
  if (!resend) {
    console.warn("[EMAIL] Resend not configured — skipping invitation email");
    return;
  }

  const inviteUrl = `${APP_URL}/invite/${token}`;

  try {
    await resend.emails.send({
      from: `Done <${FROM_EMAIL}>`,
      to,
      subject: `${inviterName ?? "Quelqu'un"} vous invite à rejoindre ${workspaceName} sur Done`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #1a1a1a;">
          <h2 style="margin-bottom: 8px;">Invitation à rejoindre <strong>${workspaceName}</strong></h2>
          <p style="color: #555; line-height: 1.6;">
            ${inviterName ?? "Un utilisateur"} vous a invité à collaborer sur l'espace de travail <strong>${workspaceName}</strong>.
          </p>
          <div style="margin: 24px 0; text-align: center;">
            <a href="${inviteUrl}" style="display: inline-block; padding: 12px 24px; background: #a855f7; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">
              Accepter l'invitation
            </a>
          </div>
          <p style="font-size: 12px; color: #999;">
            Si le bouton ne fonctionne pas, copiez ce lien : <a href="${inviteUrl}">${inviteUrl}</a>
          </p>
        </div>
      `,
    });
  } catch (err) {
    console.error("[EMAIL] Failed to send invitation email:", err);
  }
}

export async function sendReminderEmail({
  to,
  title,
  description,
  taskTitle,
  taskId,
}: {
  to: string;
  title: string;
  description?: string | null;
  taskTitle?: string | null;
  taskId?: string | null;
}) {
  if (!resend) {
    console.warn("[EMAIL] Resend not configured — skipping reminder email");
    return;
  }

  const taskUrl = taskId ? `${APP_URL}/task/${taskId}` : undefined;

  try {
    await resend.emails.send({
      from: `Done <${FROM_EMAIL}>`,
      to,
      subject: `Rappel : ${title}`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #1a1a1a;">
          <h2 style="margin-bottom: 8px;">${title}</h2>
          ${description ? `<p style="color: #555; line-height: 1.6;">${description}</p>` : ""}
          ${taskTitle ? `<p style="color: #555;">Tâche : <strong>${taskTitle}</strong></p>` : ""}
          ${taskUrl ? `<div style="margin: 24px 0; text-align: center;"><a href="${taskUrl}" style="display: inline-block; padding: 12px 24px; background: #a855f7; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">Voir la tâche</a></div>` : ""}
        </div>
      `,
    });
  } catch (err) {
    console.error("[EMAIL] Failed to send reminder email:", err);
  }
}

export async function sendDueDateReminderEmail({
  to,
  taskTitle,
  dueDate,
  taskId,
}: {
  to: string;
  taskTitle: string;
  dueDate: string;
  taskId: string;
}) {
  if (!resend) {
    console.warn("[EMAIL] Resend not configured — skipping due date email");
    return;
  }

  const taskUrl = `${APP_URL}/task/${taskId}`;

  try {
    await resend.emails.send({
      from: `Done <${FROM_EMAIL}>`,
      to,
      subject: `Échéance imminente : ${taskTitle}`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #1a1a1a;">
          <h2 style="margin-bottom: 8px;">⏰ Échéance imminente</h2>
          <p style="color: #555; line-height: 1.6;">
            La tâche <strong>${taskTitle}</strong> arrive à échéance le <strong>${dueDate}</strong>.
          </p>
          <div style="margin: 24px 0; text-align: center;">
            <a href="${taskUrl}" style="display: inline-block; padding: 12px 24px; background: #ef4444; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">
              Voir la tâche
            </a>
          </div>
        </div>
      `,
    });
  } catch (err) {
    console.error("[EMAIL] Failed to send due date email:", err);
  }
}
