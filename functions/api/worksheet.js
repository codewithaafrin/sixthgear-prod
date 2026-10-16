// POST /api/worksheet : "Get a free workshop" worksheet form.
// 1) Emails the visitor the worksheet PDF (attached, plus a download link), sent from MAIL_FROM.
// 2) Emails you (LEADS_TO) a lead notification.
import { readSubmission, sendEmail, layout, rows, json, esc, oneLine, DEFAULT_TO } from '../../lib/mail.js';

const PDF_PATH = '/assets/sixth-gear-ai-workshop-worksheet.pdf';
const PDF_NAME = 'Sixth-Gear-AI-Workshop-Worksheet.pdf';
const BOOK_URL = 'https://cal.com/aswin-kumar-kp/build-with-us';

export async function onRequestPost({ request, env }) {
  const sub = await readSubmission(request, { needs: false });
  if (sub.spam) return json({ ok: true });
  if (!sub.ok) return json({ ok: false, error: sub.error }, sub.status);
  const d = sub.data;
  const first = d.name.split(/\s+/)[0];
  const pdfUrl = new URL(PDF_PATH, request.url).toString();

  try {
    await sendEmail(env, {
      to: [d.email],
      reply_to: env.LEADS_TO || DEFAULT_TO,
      subject: 'Your Sixth Gear AI workshop worksheet',
      attachments: [{ filename: PDF_NAME, path: pdfUrl }],
      html: layout(`Here’s your worksheet, ${esc(first)}.`,
        `<p style="margin:0 0 14px;font-size:15px;line-height:1.6">Thanks for your interest in Sixth Gear. Your AI transformation workshop worksheet is attached. It walks you through four steps:</p>
         <ol style="margin:0 0 18px;padding-left:20px;font-size:15px;line-height:1.8">
           <li>Identify bottlenecks and map the workflow</li><li>Assess readiness and risks</li>
           <li>Build a case estimating costs and outcomes</li><li>Plan the pilot</li></ol>
         <p style="margin:0 0 22px;font-size:15px;line-height:1.6">Fill it in on your own, or bring it to a free workshop with our founder and we’ll work through it together.</p>
         <table role="presentation" cellpadding="0" cellspacing="0"><tr>
           <td style="background:#fe7802;border-radius:999px"><a href="${BOOK_URL}" style="display:inline-block;padding:12px 22px;color:#0e0c0a;font-weight:bold;font-size:15px;text-decoration:none">Book your free workshop</a></td>
           <td style="padding-left:14px"><a href="${pdfUrl}" style="color:#c95400;font-size:14px">Download the PDF</a></td></tr></table>`),
      text: `Hi ${first},\n\nThanks for your interest in Sixth Gear. Your AI transformation workshop worksheet is attached.\nDownload: ${pdfUrl}\n\nBook a free workshop with our founder: ${BOOK_URL}\n\nSixth Gear · sixthgear.ai`,
    });
  } catch (err) {
    console.error(err);
    return json({ ok: false, error: 'Could not send right now.' }, 502);
  }

  // Lead notification: a failure here shouldn't fail the visitor's request.
  try {
    await sendEmail(env, {
      to: [env.LEADS_TO || DEFAULT_TO],
      reply_to: d.email,
      subject: oneLine(`Worksheet sent: ${d.company} (${d.name})`),
      html: layout('Worksheet downloaded', `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows({ Name: d.name, Email: d.email, Company: d.company })}</table>`),
      text: `Worksheet sent to ${d.name} <${d.email}> at ${d.company}.`,
    });
  } catch (err) { console.error(err); }

  return json({ ok: true });
}

export const onRequest = () => json({ ok: false, error: 'Use POST.' }, 405);
