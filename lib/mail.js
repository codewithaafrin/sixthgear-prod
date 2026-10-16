// Shared helpers for the form endpoints in /functions/api.
// Email is sent through Resend's free plan (https://resend.com): 3,000 emails/month, 100/day.
// Required environment variable: RESEND_API_KEY
// Optional: MAIL_FROM (default "Sixth Gear <admin@codevantage.io>"), LEADS_TO (default "admin@codevantage.io")

export const DEFAULT_FROM = 'Sixth Gear <admin@codevantage.io>';
export const DEFAULT_TO = 'admin@codevantage.io';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
}

export const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clean = (v, max) => String(v == null ? '' : v).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').trim().slice(0, max);
// Keep header-bound values (subject, names) on one line.
export const oneLine = (s) => s.replace(/[\r\n]+/g, ' ');

/**
 * Parse and validate a submission. Returns { ok, data } or { ok:false, status, error }.
 * Spam protection: a hidden "website" field real people never fill in, and a minimum time
 * between opening the form and submitting it.
 */
export async function readSubmission(request, { needs }) {
  if (!(request.headers.get('content-type') || '').includes('application/json')) return { ok: false, status: 415, error: 'Send JSON.' };
  let b;
  try { b = await request.json(); } catch { return { ok: false, status: 400, error: 'Invalid JSON.' }; }
  if (clean(b.website, 200)) return { ok: false, status: 200, spam: true };
  const elapsed = Number(b.t);
  if (!Number.isFinite(elapsed) || elapsed < 2500) return { ok: false, status: 200, spam: true };
  const data = {
    name: oneLine(clean(b.name, 80)),
    email: oneLine(clean(b.email, 120)),
    company: oneLine(clean(b.company, 120)),
    needs: needs ? clean(b.needs, 1000) : '',
  };
  if (data.name.length < 2) return { ok: false, status: 422, error: 'Please enter your name.' };
  if (!EMAIL_RE.test(data.email)) return { ok: false, status: 422, error: 'Please enter a valid email.' };
  if (!data.company) return { ok: false, status: 422, error: 'Please enter your company.' };
  if (needs && data.needs.length < 10) return { ok: false, status: 422, error: 'Please tell us a little more.' };
  return { ok: true, data };
}

export async function sendEmail(env, message) {
  if (!env.RESEND_API_KEY) throw new Error('RESEND_API_KEY is not set');
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: env.MAIL_FROM || DEFAULT_FROM, ...message }),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
  return res.json();
}

/** Branded, email-client-safe HTML wrapper (tables + inline styles). */
export function layout(title, bodyHtml) {
  return `<!doctype html><html><body style="margin:0;background:#f4f0ea;font-family:Helvetica,Arial,sans-serif;color:#1a1512">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f0ea;padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden">
<tr><td style="background:#0e0c0a;padding:22px 28px;color:#f2ece4;font-size:13px;letter-spacing:4px;font-weight:bold">SIXTH GEAR<span style="color:#fe7802">&nbsp;&#9679;</span></td></tr>
<tr><td style="padding:28px">
<h1 style="margin:0 0 16px;font-size:22px;line-height:1.25">${title}</h1>
${bodyHtml}
</td></tr>
<tr><td style="padding:18px 28px;border-top:1px solid #eee5da;font-size:12px;color:#8d8780">Sixth Gear &middot; <a href="https://sixthgear.ai" style="color:#8d8780">sixthgear.ai</a> &middot; Grow bigger, not busier.</td></tr>
</table></td></tr></table></body></html>`;
}

export function rows(data) {
  return Object.entries(data)
    .filter(([, v]) => v)
    .map(([k, v]) => `<tr><td style="padding:8px 0;color:#8d8780;font-size:13px;width:110px;vertical-align:top">${esc(k)}</td><td style="padding:8px 0;font-size:15px;white-space:pre-wrap">${esc(v)}</td></tr>`)
    .join('');
}
