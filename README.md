# sixthgear.ai

The Sixth Gear website: a fast, static site with no framework and no dependencies. It's built for search engines (SEO), answer engines (AEO) and AI assistants (GEO), and every word is in plain HTML so crawlers and AI agents can read it.

```
public/                      ← the website (this folder is what gets published)
  index.html                 home page: full design + meta tags + JSON-LD + visible FAQ
  assets/styles.css          design styles
  assets/app.js              interactions: gear-shift intro, rev band, popups, forms
  assets/pages.css           styles for blog, posts and glossary
  assets/ai-referral.js      tags visits that come from ChatGPT, Perplexity, Claude, Gemini, Copilot
  logos/  brand/  favicons   tool logos, logo PNG, social share image, icons
  robots.txt  site.webmanifest  _headers
  (generated on every build: sitemap.xml, llms.txt, llms-full.txt, index.md,
   blog/, blog/<post>/, blog/rss.xml, blog/feed.json, glossary/)
scripts/site.config.mjs      company facts, FAQ, glossary: the single source of truth
scripts/generate-seo.mjs     the build: blog pages, glossary, sitemap, feeds, llms files, IndexNow
content/blog/*.md            blog posts in Markdown (5 cornerstone drafts included)
geo/                         monthly AI-visibility tracker
.github/workflows/           IndexNow ping after each deploy
vercel.json / netlify.toml   hosting config
```

---

## Go live in about 15 minutes

### Step 1: Put the code on GitHub
1. Sign in at github.com → **New repository** → name it `sixthgear-website` → **Create repository**.
2. On the new repo page click **uploading an existing file**, drag in **everything inside this folder** (including `.github`), then **Commit changes**.
   *(Or from a terminal: `git init && git add . && git commit -m "Launch sixthgear.ai" && git branch -M main && git remote add origin https://github.com/<you>/sixthgear-website.git && git push -u origin main`.)*

### Step 2: Deploy on Vercel (recommended, free)
1. Go to vercel.com → sign in with GitHub → **Add New… → Project** → import `sixthgear-website`.
2. Vercel reads `vercel.json` automatically (build command `npm run build`, output `public`). Click **Deploy**.
3. You get a live URL like `sixthgear-website.vercel.app` within about a minute.

*Netlify or Cloudflare Pages also work: import the repo, set build command `npm run build` and publish directory `public`.*

### Step 3: Connect sixthgear.ai
1. In Vercel: **Project → Settings → Domains → Add** `sixthgear.ai` and `www.sixthgear.ai`.
2. At your domain registrar, add the DNS records Vercel shows: usually an **A record** `@ → 76.76.21.21` and a **CNAME** `www → cname.vercel-dns.com`.
3. HTTPS turns on automatically. Set `sixthgear.ai` (no www) as the primary domain so every canonical URL matches.

### Step 4: Turn on search and AI discovery (do this on launch day)
1. **Google Search Console** → add property `sixthgear.ai` → verify (DNS, or paste the token into the `google-site-verification` meta tag in `public/index.html`) → **Sitemaps** → submit `https://sixthgear.ai/sitemap.xml`.
2. **Bing Webmaster Tools** → import from Google Search Console → submit the sitemap. Bing also feeds Copilot and ChatGPT search.
3. **IndexNow (instant indexing):** create a 32-character hex key (e.g. run `openssl rand -hex 16`), then add it as `INDEXNOW_KEY` in **two** places:
   - Vercel → Settings → Environment Variables (so the key file is published)
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
- [ ] **Add the brand film:** replace the placeholder block in `public/index.html` (search for `Brand film`) with a `<video>` or embed.
- [ ] **Social profiles:** add LinkedIn, X, Crunchbase and similar URLs to `sameAs` in `scripts/site.config.mjs` **and** in the Organization JSON-LD in `public/index.html`.
- [ ] **Case-study pages:** "Read case study" currently links to the case section. Add full pages when ready.
- [ ] **Form delivery:** forms open the visitor's email app addressed to aswin@codevantage.io. For automatic delivery, point `submit()` in `public/assets/app.js` at a form service (Formspree, FormSubmit, HubSpot). The hook is marked in the code.
- [ ] **Worksheet PDF:** add it to `public/` and link it from the workshop thank-you message for instant download.
- [ ] Validate with Google's Rich Results Test and PageSpeed Insights.

## Growing GEO and AEO
See `geo/ai-visibility-tracker.md`. Each month, put the 18 buyer questions to ChatGPT, Claude, Perplexity, Gemini, AI Overviews and Copilot, log where Sixth Gear appears, and earn mentions on the sources they cite instead: directories, reviews, industry publications and podcasts.

This site contains no hidden instructions to AI systems. Text like that is treated as manipulation and gets ignored or penalised. Recommendations come from clear, consistent facts, content that answers real questions, and independent mentions across the web.
