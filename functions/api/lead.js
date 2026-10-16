// POST /api/lead : "Transform now" / "Find your sixth gear" form.
// Emails the enquiry to LEADS_TO (default admin@codevantage.io), with Reply-To set to the visitor.
import { readSubmission, sendEmail, layout, rows, json, oneLine, DEFAULT_TO } from '../../lib/mail.js';

export async function onRequestPost({ request, env }) {
  const sub = await readSubmission(request, { needs: true });
  if (sub.spam) return json({ ok: true }); // quietly drop bots
  if (!sub.ok) return json({ ok: false, error: sub.error }, sub.status);
  const d = sub.data;
  try {
    await sendEmail(env, {
      to: [env.LEADS_TO || DEFAULT_TO],
      reply_to: d.email,
      subject: oneLine(`New enquiry: ${d.company} (${d.name})`),
      html: layout('New enquiry from sixthgear.ai',
        `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows({ Name: d.name, Email: d.email, Company: d.company, Needs: d.needs })}</table>
         <p style="margin:20px 0 0;font-size:13px;color:#8d8780">Hit reply to answer ${d.name.split(' ')[0].replace(/[<>&"']/g, '')} directly.</p>`),
      text: `New enquiry from sixthgear.ai\n\nName: ${d.name}\nEmail: ${d.email}\nCompany: ${d.company}\n\nNeeds:\n${d.needs}\n`,
    });
    return json({ ok: true });
  } catch (err) {
    console.error(err);
    return json({ ok: false, error: 'Could not send right now.' }, 502);
  }
}

export const onRequest = () => json({ ok: false, error: 'Use POST.' }, 405);
