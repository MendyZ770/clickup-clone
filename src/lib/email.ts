import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const FROM_EMAIL = process.env.FROM_EMAIL ?? "onboarding@resend.dev";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://clickup-clone-three.vercel.app";

const HTML_ENTITIES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => HTML_ENTITIES[char]);
}

function sanitizeHeader(value: string): string {
  return value.replace(/[\r\n]+/g, " ").trim();
}

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

  const inviteUrl = `${APP_URL}/invite/${encodeURIComponent(token)}`;
  const safeWorkspaceName = escapeHtml(workspaceName);
  const safeInviterName = escapeHtml(inviterName ?? "Un utilisateur");
  const safeInviteUrl = escapeHtml(inviteUrl);

  try {
    await resend.emails.send({
      from: `Done <${FROM_EMAIL}>`,
      to,
      subject: sanitizeHeader(
        `${inviterName ?? "Quelqu'un"} vous invite à rejoindre ${workspaceName} sur Done`
      ),
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #1a1a1a;">
          <h2 style="margin-bottom: 8px;">Invitation à rejoindre <strong>${safeWorkspaceName}</strong></h2>
          <p style="color: #555; line-height: 1.6;">
            ${safeInviterName} vous a invité à collaborer sur l'espace de travail <strong>${safeWorkspaceName}</strong>.
          </p>
          <div style="margin: 24px 0; text-align: center;">
            <a href="${safeInviteUrl}" style="display: inline-block; padding: 12px 24px; background: #a855f7; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">
              Accepter l'invitation
            </a>
          </div>
          <p style="font-size: 12px; color: #999;">
            Si le bouton ne fonctionne pas, copiez ce lien : <a href="${safeInviteUrl}">${safeInviteUrl}</a>
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

  const taskUrl = taskId ? `${APP_URL}/task/${encodeURIComponent(taskId)}` : undefined;
  const safeTitle = escapeHtml(title);
  const safeDescription = description ? escapeHtml(description) : null;
  const safeTaskTitle = taskTitle ? escapeHtml(taskTitle) : null;
  const safeTaskUrl = taskUrl ? escapeHtml(taskUrl) : undefined;

  try {
    await resend.emails.send({
      from: `Done <${FROM_EMAIL}>`,
      to,
      subject: sanitizeHeader(`Rappel : ${title}`),
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #1a1a1a;">
          <h2 style="margin-bottom: 8px;">${safeTitle}</h2>
          ${safeDescription ? `<p style="color: #555; line-height: 1.6;">${safeDescription}</p>` : ""}
          ${safeTaskTitle ? `<p style="color: #555;">Tâche : <strong>${safeTaskTitle}</strong></p>` : ""}
          ${safeTaskUrl ? `<div style="margin: 24px 0; text-align: center;"><a href="${safeTaskUrl}" style="display: inline-block; padding: 12px 24px; background: #a855f7; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">Voir la tâche</a></div>` : ""}
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

  const taskUrl = `${APP_URL}/task/${encodeURIComponent(taskId)}`;
  const safeTaskTitle = escapeHtml(taskTitle);
  const safeDueDate = escapeHtml(dueDate);
  const safeTaskUrl = escapeHtml(taskUrl);

  try {
    await resend.emails.send({
      from: `Done <${FROM_EMAIL}>`,
      to,
      subject: sanitizeHeader(`Échéance imminente : ${taskTitle}`),
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #1a1a1a;">
          <h2 style="margin-bottom: 8px;">⏰ Échéance imminente</h2>
          <p style="color: #555; line-height: 1.6;">
            La tâche <strong>${safeTaskTitle}</strong> arrive à échéance le <strong>${safeDueDate}</strong>.
          </p>
          <div style="margin: 24px 0; text-align: center;">
            <a href="${safeTaskUrl}" style="display: inline-block; padding: 12px 24px; background: #ef4444; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">
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
