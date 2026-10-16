# sixthgear.ai

The Sixth Gear website: a fast, static site with no framework and no dependencies. It's built for search engines (SEO), answer engines (AEO) and AI assistants (GEO), and every word is in plain HTML so crawlers and AI agents can read it.

```
public/                      ← the website (this folder is what gets published)
  index.html                 home page: full design + meta tags + JSON-LD + visible FAQ
  assets/styles.css          design styles
  assets/app.js              interactions: gear-shift intro, rev band, popups, forms
  assets/pages.css           styles for blog, posts and glossary
  assets/ai-referral.js      tags visits that come from ChatGPT, Perplexity, Claude, Gemini, Copilot
  assets/film/               33s brand film (WebM, MP4, poster)
  logos/  brand/  favicons   tool logos, logo PNG, social share image, icons
  robots.txt  site.webmanifest  _headers
  (generated on every build: sitemap.xml, llms.txt, llms-full.txt, index.md,
   blog/, blog/<post>/, blog/rss.xml, blog/feed.json, glossary/)
scripts/site.config.mjs      company facts, FAQ, glossary: the single source of truth
scripts/generate-seo.mjs     the build: blog pages, glossary, sitemap, feeds, llms files, IndexNow
content/blog/*.md            blog posts in Markdown (5 cornerstone drafts included)
geo/                         monthly AI-visibility tracker
.github/workflows/           IndexNow ping after each deploy
functions/api/               form endpoints: lead.js (enquiry → admin@), worksheet.js (PDF → visitor)
lib/mail.js                  email helpers (Resend), validation, spam checks
vercel.json / netlify.toml   alternative hosting config (Cloudflare Pages needs none)
```

---

## Go live in about 15 minutes

### Step 1: Put the code on GitHub
1. Sign in at github.com → **New repository** → name it `sixthgear-website` → **Create repository**.
2. On the new repo page click **uploading an existing file**, drag in **everything inside this folder** (including `.github`), then **Commit changes**.
   *(Or from a terminal: `git init && git add . && git commit -m "Launch sixthgear.ai" && git branch -M main && git remote add origin https://github.com/<you>/sixthgear-website.git && git push -u origin main`.)*

### Step 2: Deploy on Cloudflare Pages (free, and allowed for business sites)
1. Go to dash.cloudflare.com → sign up (free) → **Workers & Pages → Create → Pages → Connect to Git** → pick `sixthgear-website`.
2. Build settings: **Framework preset** None · **Build command** `npm run build` · **Build output directory** `public`. Click **Save and Deploy**.
3. You get a live URL like `sixthgear-website.pages.dev` in about a minute. The `functions/` folder is picked up automatically, which powers the form emails.

*Why not Vercel's free plan? Vercel's Hobby plan is for non-commercial personal use only, and a company website counts as commercial. If you're on Vercel Pro, the site still works there, but you'd need to move `functions/api/*` to Vercel's `api/` format. Ask Claude to do it.*

### Step 3: Connect sixthgear.ai
1. In Cloudflare Pages: **your project → Custom domains → Set up a custom domain** → `sixthgear.ai`, then again for `www.sixthgear.ai`.
2. Easiest path: move the domain's DNS to Cloudflare (free) when prompted, and the records are created for you. Otherwise add the CNAME record it shows at your registrar.
3. HTTPS turns on automatically.

### Step 3b: Turn on form emails (free, about 10 minutes)
Forms send through **Resend**. Its free plan covers 3,000 emails a month and 100 a day.

- **"Transform now" / "Find your sixth gear"** emails each enquiry to **admin@codevantage.io**. Hit reply to answer the visitor directly.
- **"Get a free workshop"** emails the visitor the worksheet PDF (`public/assets/sixth-gear-ai-workshop-worksheet.pdf`) **from admin@codevantage.io**, and sends you a lead alert.

1. Sign up free at resend.com → **Domains → Add domain** → `codevantage.io`.
2. Add the DNS records Resend shows (SPF, DKIM, and optionally DMARC) wherever codevantage.io's DNS is managed. If that's Cloudflare, Resend can add them for you in one click. Wait until the domain shows **Verified**.
3. Resend → **API Keys → Create API key** (permission: Sending access) → copy it.
4. Cloudflare Pages → your project → **Settings → Variables and Secrets → Add**: name `RESEND_API_KEY`, type **Secret**, paste the key. Add it for Production (and Preview if you like).
5. Optional variables: `LEADS_TO` (where enquiries go, default `admin@codevantage.io`), `MAIL_FROM` (default `Sixth Gear <admin@codevantage.io>`).
6. **Retry the latest deployment** (Deployments → ⋯ → Retry) so the variables apply. Then send yourself a test from the live site.

Spam protection is built in: a hidden trap field plus a minimum time on the form. If the email service is ever unavailable, the form falls back to opening the visitor's own email app, so no lead is lost.

### Step 4: Turn on search and AI discovery (do this on launch day)
1. **Google Search Console** → add property `sixthgear.ai` → verify (DNS, or paste the token into the `google-site-verification` meta tag in `public/index.html`) → **Sitemaps** → submit `https://sixthgear.ai/sitemap.xml`.
2. **Bing Webmaster Tools** → import from Google Search Console → submit the sitemap. Bing also feeds Copilot and ChatGPT search.
3. **IndexNow (instant indexing):** create a 32-character hex key (e.g. run `openssl rand -hex 16`), then add it as `INDEXNOW_KEY` in **two** places:
   - Cloudflare Pages → Settings → Variables and Secrets (so the key file is published)
   - GitHub → Settings → Secrets and variables → Actions (so the workflow can ping after each push)
4. **Cloudflare users:** if the domain is proxied through Cloudflare, make sure **"Block AI bots" is off**, or AI crawlers will be blocked regardless of `robots.txt`.

---

## Day-to-day

### Publish a blog post
1. Copy `content/blog/_TEMPLATE.md` to `content/blog/your-post-slug.md` and write it. The template includes writing tips for getting quoted by AI.
2. Make sure `draft: true` is removed or set to `false`.
3. Commit to GitHub. The site rebuilds automatically, the post goes live at `/blog/your-post-slug/`, and the sitemap, RSS, `llms.txt` and `llms-full.txt` all update. IndexNow then notifies search engines.

**The 5 cornerstone articles are drafts.** Have the founder read each one, add a real example or opinion (first-hand experience is a strong ranking and citation signal), then set `draft: false`. Preview drafts locally with `npm run preview:drafts`.

### Change company facts, FAQ or glossary
Edit `scripts/site.config.mjs`. It feeds `llms.txt`, `llms-full.txt`, `index.md` and the glossary. If you change the FAQ, also update the matching FAQ text and FAQPage JSON-LD in `public/index.html`, since visible text and markup must match.

### Run locally
```bash
npm run dev        # builds, then serves http://localhost:3000
```

---

## Before or soon after launch
- [x] **Brand film:** `public/assets/film/` (WebM + MP4 + poster). To swap it, replace those files and keep the names.
- [ ] **Social profiles:** add LinkedIn, X, Crunchbase and similar URLs to `sameAs` in `scripts/site.config.mjs` **and** in the Organization JSON-LD in `public/index.html`.
- [ ] **Case-study pages:** "Read case study" currently links to the case section. Add full pages when ready.
- [ ] **Form emails:** follow Step 3b (free Resend account + one API key).
- [x] **Worksheet PDF:** `public/assets/sixth-gear-ai-workshop-worksheet.pdf`. Replace the file (same name) to update it.
- [ ] Validate with Google's Rich Results Test and PageSpeed Insights.

## Growing GEO and AEO
See `geo/ai-visibility-tracker.md`. Each month, put the 18 buyer questions to ChatGPT, Claude, Perplexity, Gemini, AI Overviews and Copilot, log where Sixth Gear appears, and earn mentions on the sources they cite instead: directories, reviews, industry publications and podcasts.

This site contains no hidden instructions to AI systems. Text like that is treated as manipulation and gets ignored or penalised. Recommendations come from clear, consistent facts, content that answers real questions, and independent mentions across the web.
