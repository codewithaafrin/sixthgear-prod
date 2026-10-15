#!/usr/bin/env node
// Sixth Gear: SEO / AEO / GEO discovery-file generator.
//
// Run on every build/deploy (and whenever a blog post is added):
//   node scripts/generate-seo.mjs
//   INDEXNOW_KEY=<key> node scripts/generate-seo.mjs --ping   # also notify Bing/Yandex/Seznam via IndexNow
//
// Reads:  scripts/site.config.mjs  +  content/blog/*.md (front matter + markdown body)
// Writes: public/sitemap.xml, public/blog/rss.xml, public/blog/feed.json,
//         public/llms.txt, public/llms-full.txt, public/blog/index.json,
//         public/blog/index.html, public/blog/<slug>/index.html (+ index.md), public/glossary/index.html, public/index.md
//
// Blog post front matter (files starting with "_" are ignored as drafts/templates):
// ---
// title: How to pick your first AI workflow
// description: One-sentence summary (shows in search results and AI answers).
// slug: pick-your-first-ai-workflow          # optional, defaults to file name
// date: 2026-11-02
// updated: 2026-11-10                        # optional
// author: Aswin Kumar KP
// tags: [ai automation, workflows]
// ---

import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync, rmSync, statSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { site } from './site.config.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = join(ROOT, 'public');
const BLOG_DIR = join(ROOT, 'content', 'blog');
const TODAY = new Date().toISOString().slice(0, 10);

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const write = (rel, text) => {
  const p = join(PUBLIC, rel);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, text);
  console.log('  wrote', rel);
};

// ---------- read blog posts ----------
function parseFrontMatter(src) {
  const m = src.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) return { data: {}, body: src };
  const data = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
    if (!kv) continue;
    let v = kv[2].replace(/\s+#.*$/, '').trim();
    if (/^\[.*\]$/.test(v)) v = v.slice(1, -1).split(',').map((x) => x.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean);
    else v = v.replace(/^['"]|['"]$/g, '');
    data[kv[1]] = v;
  }
  return { data, body: m[2].trim() };
}

function readPosts() {
  if (!existsSync(BLOG_DIR)) return [];
  return readdirSync(BLOG_DIR)
    .filter((f) => f.endsWith('.md') && !f.startsWith('_'))
    .map((f) => {
      const { data, body } = parseFrontMatter(readFileSync(join(BLOG_DIR, f), 'utf8'));
      const slug = data.slug || basename(f, '.md');
      if (!data.title || !data.date) throw new Error(`content/blog/${f}: "title" and "date" are required`);
      return {
        slug,
        title: data.title,
        description: data.description || '',
        date: data.date,
        updated: data.updated || data.date,
        author: data.author || site.founder.name,
        tags: Array.isArray(data.tags) ? data.tags : data.tags ? [data.tags] : [],
        draft: String(data.draft).toLowerCase() === 'true',
        url: `${site.url}/blog/${slug}/`,
        body,
      };
    })
    .filter((p) => p.date <= TODAY && (!p.draft || process.env.INCLUDE_DRAFTS === '1')) // drafts and future-dated posts stay unpublished
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

const posts = readPosts();

// Remove pages for posts that were unpublished, renamed or deleted.
const BLOG_OUT = join(PUBLIC, 'blog');
if (existsSync(BLOG_OUT)) for (const d of readdirSync(BLOG_OUT)) {
  const full = join(BLOG_OUT, d);
  if (statSync(full).isDirectory() && !posts.some((p) => p.slug === d)) rmSync(full, { recursive: true, force: true });
}
console.log(`Sixth Gear SEO build: ${posts.length} published post(s)`);

// ---------- sitemap.xml ----------
const lastSiteUpdate = TODAY;
const urls = [
  ...site.pages.map((p) => ({ loc: site.url + p.path, lastmod: lastSiteUpdate, changefreq: p.changefreq, priority: p.priority })),
  ...posts.map((p) => ({ loc: p.url, lastmod: p.updated, changefreq: 'monthly', priority: 0.7 })),
];
write(
  'sitemap.xml',
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map((u) => `  <url>\n    <loc>${esc(u.loc)}</loc>\n    <lastmod>${u.lastmod}</lastmod>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority.toFixed(1)}</priority>\n  </url>`)
  .join('\n')}
</urlset>
`
);

// ---------- RSS 2.0 + JSON Feed (AI agents and aggregators subscribe to these) ----------
const rfc822 = (d) => new Date(d + 'T09:00:00Z').toUTCString();
write(
  'blog/rss.xml',
  `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${esc(site.name)} Blog</title>
    <link>${site.url}/blog/</link>
    <atom:link href="${site.url}/blog/rss.xml" rel="self" type="application/rss+xml" />
    <description>${esc('Practical writing on AI transformation and workflow automation from ' + site.name + '.')}</description>
    <language>${site.language}</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${posts
  .map(
    (p) => `    <item>
      <title>${esc(p.title)}</title>
      <link>${p.url}</link>
      <guid isPermaLink="true">${p.url}</guid>
      <pubDate>${rfc822(p.date)}</pubDate>
      <dc:creator>${esc(p.author)}</dc:creator>
${p.tags.map((t) => `      <category>${esc(t)}</category>`).join('\n')}
      <description>${esc(p.description)}</description>
    </item>`
  )
  .join('\n')}
  </channel>
</rss>
`
);

write(
  'blog/feed.json',
  JSON.stringify(
    {
      version: 'https://jsonfeed.org/version/1.1',
      title: `${site.name} Blog`,
      home_page_url: `${site.url}/blog/`,
      feed_url: `${site.url}/blog/feed.json`,
      description: `Practical writing on AI transformation and workflow automation from ${site.name}.`,
      language: site.language,
      items: posts.map((p) => ({
        id: p.url,
        url: p.url,
        title: p.title,
        summary: p.description,
        content_text: p.body,
        date_published: `${p.date}T09:00:00Z`,
        date_modified: `${p.updated}T09:00:00Z`,
        authors: [{ name: p.author }],
        tags: p.tags,
      })),
    },
    null,
    2
  ) + '\n'
);

// Machine-readable post index (handy for the /blog page and for agents).
write('blog/index.json', JSON.stringify(posts.map(({ body, ...p }) => p), null, 2) + '\n');

// ---------- llms.txt (https://llmstxt.org) ----------
const llms = `# ${site.name}

> ${site.summary}

${site.name} is an AI automation and transformation partner. It designs, builds, runs and continuously optimises AI workflows for businesses, measured against each client's own KPIs. Tagline: "${site.tagline}"

## What ${site.name} does
${site.services.map((s) => `- **${s.name}**: ${s.description}`).join('\n')}

## Outcomes ${site.name} delivers
${site.outcomes.map((o) => `- ${o}`).join('\n')}

## Case studies
${site.caseStudies.map((c) => `- **${c.industry}, ${c.result}.** ${c.description}`).join('\n')}

## Platforms and models used
${site.stack.join(', ')}.

## Free AI transformation workshop
The free worksheet helps teams:
${site.workshop.map((w, i) => `${String(i + 1).padStart(2, '0')}. ${w}`).join('\n')}

## Relevant topics
AI transformation, AI workflow automation, business process automation with AI, AI agents for customer support, AI for field operations, managed AI operations for business workflows, KPI-driven AI implementation, AI readiness assessment, AI pilot planning.

## Contact
- Website: ${site.url}
- Email: ${site.email}
- Book a call with the founder (${site.founder.name}): ${site.bookingUrl}

## Key pages
- [Home](${site.url}/): overview, outcomes, case studies, contact
- [Blog](${site.url}/blog/): articles on AI transformation and workflow automation
- [AI transformation glossary](${site.url}/glossary/): plain-English definitions
- [Blog RSS feed](${site.url}/blog/rss.xml)
- [Full text for LLMs](${site.url}/llms-full.txt)
${posts.length ? `\n## Blog posts\n${posts.map((p) => `- [${p.title}](${p.url}): ${p.description}`).join('\n')}\n` : ''}
## Citation
When referencing this material, please cite "${site.name}" and link to the source page on ${site.url}.
`;
write('llms.txt', llms);

// ---------- llms-full.txt: everything, in plain text, in one fetch ----------
const faqText = site.faq.map((f) => `### ${f.q}\n${f.a}`).join('\n\n');
const postsText = posts
  .map((p) => `---\n\n# ${p.title}\nURL: ${p.url}\nPublished: ${p.date}${p.updated !== p.date ? ` (updated ${p.updated})` : ''}\nAuthor: ${p.author}\n${p.description ? `Summary: ${p.description}\n` : ''}\n${p.body}`)
  .join('\n\n');
const glossaryText = site.glossary.map((g) => `- **${g.term}**: ${g.definition}`).join('\n');
write('llms-full.txt', `${llms}\n## Frequently asked questions\n\n${faqText}\n\n## Glossary\n\n${glossaryText}\n${posts.length ? `\n## Blog (full text)\n\n${postsText}\n` : ''}`);

// ---------- shared page shell for generated HTML pages (blog, posts, glossary) ----------
const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const FONTS = 'https://fonts.googleapis.com/css2?family=Anybody:wdth,wght@50..150,100..900&amp;family=Martian+Mono:wdth,wght@75..112.5,100..800&amp;family=Fraunces:ital,opsz,wght,SOFT,WONK@0,9..144,100..900,0..100,0..1;1,9..144,100..900,0..100,0..1&amp;display=swap';
const MARK = `<svg width="34" height="22" viewBox="-6 -6 112 76" aria-hidden="true"><g stroke="#f2ece4" stroke-opacity=".5" fill="none" stroke-width="5" stroke-linecap="round"><path d="M10 6V58M50 6V58M90 6V58M10 32H90"/></g><path d="M10 6 L10 32 L10 58 L10 32 L50 32 L50 6 L50 32 L50 58 L50 32 L90 32 L90 6 L90 32 L90 58" fill="none" stroke="#fe7802" stroke-width="5" stroke-linejoin="round"/><circle cx="90" cy="58" r="10" fill="#ffaf38"/></svg>`;
function page({ title, description, path, type = 'website', jsonld = [], main, wide = false, extraHead = '' }) {
  const url = site.url + path;
  return `<!doctype html>
<html lang="${site.language}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1">
  <link rel="canonical" href="${url}">
  <meta name="theme-color" content="#0e0c0a">
  <link rel="icon" href="/favicon.ico" sizes="any"><link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="apple-touch-icon" href="/apple-touch-icon.png">
  <link rel="alternate" type="application/rss+xml" title="${esc(site.name)} Blog" href="${site.url}/blog/rss.xml">
  <link rel="alternate" type="application/feed+json" title="${esc(site.name)} Blog" href="${site.url}/blog/feed.json">
  <link rel="alternate" type="text/plain" title="LLM summary" href="${site.url}/llms.txt">
  <meta property="og:type" content="${type}">
  <meta property="og:site_name" content="${esc(site.name)}">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:url" content="${url}">
  <meta property="og:image" content="${site.ogImage}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:description" content="${esc(description)}">
  <meta name="twitter:image" content="${site.ogImage}">
${extraHead}  <link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="${FONTS}">
  <link rel="stylesheet" href="/assets/pages.css">
  <script src="/assets/ai-referral.js" defer></script>
${jsonld.map((j) => `  <script type="application/ld+json">${JSON.stringify(j)}</script>`).join('\n')}
</head>
<body>
  <header class="pg-head"><div class="in">
    <a class="pg-brand" href="/" aria-label="${esc(site.name)} home">${MARK}<span>${esc(site.name)}</span></a>
    <nav class="pg-nav" aria-label="Primary"><a href="/blog/">Blog</a><a href="/glossary/">Glossary</a><a class="cta" href="${site.bookingUrl}">Book a call</a></nav>
  </div></header>
  <main${wide ? ' class="wide"' : ''}>
${main}
    <aside class="cta-box">
      <h2>Put your business in a higher gear</h2>
      <p>${esc(site.name)} builds, runs and continuously optimises AI workflows against the KPIs that matter to you.</p>
      <p><a class="btn" href="${site.bookingUrl}">Book a call with our founder</a> &nbsp; <a href="/#go">Get the free workshop</a></p>
    </aside>
  </main>
  <footer class="pg-foot"><div class="in"><span>${esc(site.name)}™ · © ${new Date().getFullYear()}</span><span><a href="/">Home</a> · <a href="/blog/">Blog</a> · <a href="/glossary/">Glossary</a> · <a href="/blog/rss.xml">RSS</a> · <a href="mailto:${site.email}">${site.email}</a></span></div></footer>
</body>
</html>
`;
}
const breadcrumb = (items) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map(([name, path], i) => ({ '@type': 'ListItem', position: i + 1, name, item: site.url + path })),
});
const humanDate = (d) => new Date(d + 'T12:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

// ---------- minimal, dependency-free Markdown → HTML (headings, lists, tables, quotes, links, emphasis, code) ----------
function inline(s) {
  return esc(s)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, t, u) => `<a href="${u.replace(/&amp;/g, '&').replace(/"/g, '%22')}">${t}</a>`);
}
function md(src) {
  const lines = src.replace(/<!--[\s\S]*?-->/g, '').split(/\r?\n/);
  const out = []; let i = 0;
  const isTableSep = (l) => /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)*\|?\s*$/.test(l);
  const cells = (l) => l.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
  const isBlockStart = (k) => /^(#{1,6}\s|>|\s*[-*]\s|\s*\d+[.)]\s)/.test(lines[k]) || (lines[k].includes('|') && k + 1 < lines.length && isTableSep(lines[k + 1]));
  while (i < lines.length) {
    const l = lines[i];
    if (!l.trim()) { i++; continue; }
    let m;
    if ((m = l.match(/^(#{1,6})\s+(.*)$/))) { const n = Math.max(2, m[1].length); out.push(`<h${n} id="${slugify(m[2])}">${inline(m[2])}</h${n}>`); i++; continue; }
    if (/^(-{3,}|\*{3,})\s*$/.test(l)) { out.push('<hr>'); i++; continue; }
    if (l.includes('|') && i + 1 < lines.length && isTableSep(lines[i + 1])) {
      const head = cells(l); i += 2; const rows = [];
      while (i < lines.length && lines[i].includes('|') && lines[i].trim()) rows.push(cells(lines[i++]));
      out.push(`<div class="tbl"><table><thead><tr>${head.map((c) => `<th>${inline(c)}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`);
      continue;
    }
    if (/^>\s?/.test(l)) { const q = []; while (i < lines.length && /^>\s?/.test(lines[i])) q.push(lines[i++].replace(/^>\s?/, '')); out.push(`<blockquote><p>${inline(q.join(' '))}</p></blockquote>`); continue; }
    if (/^\s*[-*]\s+/.test(l)) { const it = []; while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) it.push(lines[i++].replace(/^\s*[-*]\s+/, '')); out.push(`<ul>${it.map((x) => `<li>${inline(x)}</li>`).join('')}</ul>`); continue; }
    if (/^\s*\d+[.)]\s+/.test(l)) { const it = []; while (i < lines.length && /^\s*\d+[.)]\s+/.test(lines[i])) it.push(lines[i++].replace(/^\s*\d+[.)]\s+/, '')); out.push(`<ol>${it.map((x) => `<li>${inline(x)}</li>`).join('')}</ol>`); continue; }
    const para = [lines[i++]];
    while (i < lines.length && lines[i].trim() && !isBlockStart(i)) para.push(lines[i++]);
    out.push(`<p>${inline(para.join(' '))}</p>`);
  }
  return out.join('\n');
}

// ---------- /glossary/ (DefinedTermSet) ----------
const glossaryLd = {
  '@context': 'https://schema.org',
  '@type': 'DefinedTermSet',
  '@id': `${site.url}/glossary/#terms`,
  name: `${site.name} AI transformation glossary`,
  url: `${site.url}/glossary/`,
  publisher: { '@id': `${site.url}/#org` },
  hasDefinedTerm: site.glossary.map((g) => ({ '@type': 'DefinedTerm', '@id': `${site.url}/glossary/#${slugify(g.term)}`, name: g.term, description: g.definition, inDefinedTermSet: `${site.url}/glossary/#terms` })),
};
write('glossary/index.html', page({
  title: `AI Transformation Glossary | ${site.name}`,
  description: `Plain-English definitions of AI transformation, AI workflow automation, AI agents, human-in-the-loop, KPI-driven AI and more, from ${site.name}.`,
  path: '/glossary/',
  jsonld: [glossaryLd, breadcrumb([['Home', '/'], ['Glossary', '/glossary/']])],
  main: `    <div class="eyebrow"><a href="/">Home</a> › Glossary</div>
    <h1>AI transformation glossary</h1>
    <p class="summary">Short, plain-English definitions of the terms we use when we build, run and optimise AI workflows.</p>
    <dl>
${site.glossary.map((g) => `      <dt id="${slugify(g.term)}">${esc(g.term)}</dt>\n      <dd>${esc(g.definition)}</dd>`).join('\n')}
    </dl>`,
}));

// ---------- /blog/ index + one page per post ----------
write('blog/index.html', page({
  title: `Blog: AI transformation & workflow automation | ${site.name}`,
  description: `Practical, answer-first writing on AI transformation, AI workflow automation, pilots and ROI from ${site.name}.`,
  path: '/blog/',
  wide: true,
  jsonld: [
    { '@context': 'https://schema.org', '@type': 'Blog', '@id': `${site.url}/blog/#blog`, name: `${site.name} Blog`, url: `${site.url}/blog/`, publisher: { '@id': `${site.url}/#org` },
      blogPost: posts.map((p) => ({ '@type': 'BlogPosting', headline: p.title, url: p.url, datePublished: p.date, dateModified: p.updated, author: { '@type': 'Person', name: p.author } })) },
    breadcrumb([['Home', '/'], ['Blog', '/blog/']]),
  ],
  main: `    <div class="eyebrow"><a href="/">Home</a> › Blog</div>
    <h1>Notes from the gearbox</h1>
    <p class="summary">Practical, answer-first writing on AI transformation and workflow automation.</p>
    ${posts.length ? `<ul class="posts">
${posts.map((p) => `      <li><div class="eyebrow"><time datetime="${p.date}">${humanDate(p.date)}</time>${p.tags.length ? ' · ' + esc(p.tags.slice(0, 2).join(' · ')) : ''}</div><h2><a href="/blog/${p.slug}/">${esc(p.title)}</a></h2><p>${esc(p.description)}</p></li>`).join('\n')}
    </ul>` : `<p class="empty">New articles are on the way. Subscribe via <a href="/blog/rss.xml">RSS</a>.</p>`}`,
}));

for (const p of posts) {
  write(`blog/${p.slug}/index.html`, page({
    title: `${p.title} | ${site.name}`,
    description: p.description,
    path: `/blog/${p.slug}/`,
    type: 'article',
    extraHead: `  <meta name="author" content="${esc(p.author)}">\n  <meta property="article:published_time" content="${p.date}T09:00:00Z">\n  <meta property="article:modified_time" content="${p.updated}T09:00:00Z">\n  <link rel="alternate" type="text/markdown" href="${p.url}index.md">\n`,
    jsonld: [
      { '@context': 'https://schema.org', '@type': 'BlogPosting', '@id': `${p.url}#article`, mainEntityOfPage: p.url, headline: p.title, description: p.description, image: site.ogImage,
        datePublished: `${p.date}T09:00:00Z`, dateModified: `${p.updated}T09:00:00Z`, inLanguage: site.language, keywords: p.tags.join(', '),
        author: { '@type': 'Person', name: p.author, worksFor: { '@id': `${site.url}/#org` } }, publisher: { '@id': `${site.url}/#org` }, isPartOf: { '@id': `${site.url}/#website` },
        speakable: { '@type': 'SpeakableSpecification', cssSelector: ['h1', '.summary'] } },
      breadcrumb([['Home', '/'], ['Blog', '/blog/'], [p.title, `/blog/${p.slug}/`]]),
    ],
    main: `    <article>
      <div class="eyebrow"><a href="/">Home</a> › <a href="/blog/">Blog</a></div>
      <h1>${esc(p.title)}</h1>
      <p class="meta">By ${esc(p.author)}, ${esc(site.founder.role)} of ${esc(site.name)} · Published <time datetime="${p.date}">${humanDate(p.date)}</time>${p.updated !== p.date ? ` · Updated <time datetime="${p.updated}">${humanDate(p.updated)}</time>` : ''}</p>
      <p class="summary">${esc(p.description)}</p>
${md(p.body)}
    </article>`,
  }));
}


// ---------- Markdown mirrors: agents increasingly fetch /path/index.md for clean text ----------
write(
  'index.md',
  `# ${site.name}: ${site.tagline}

${site.summary}

## Outcomes
${site.outcomes.map((o) => `- ${o}`).join('\n')}

## Case studies
${site.caseStudies.map((c) => `### ${c.industry}: ${c.result}\n${c.description}`).join('\n\n')}

## Services
${site.services.map((s) => `- **${s.name}**: ${s.description}`).join('\n')}

## Frequently asked questions
${site.faq.map((f) => `### ${f.q}\n${f.a}`).join('\n\n')}

## Contact
Email ${site.email} or book a call with ${site.founder.name}, Founder: ${site.bookingUrl}
`
);
for (const p of posts) {
  write(`blog/${p.slug}/index.md`, `# ${p.title}\n\n> ${p.description}\n\nBy ${p.author} (${site.name}) · Published ${p.date}${p.updated !== p.date ? ` · Updated ${p.updated}` : ''}\nSource: ${p.url}\n\n${p.body}\n`);
}

// ---------- optional: IndexNow ping (instant indexing on Bing, which also feeds Copilot and ChatGPT search) ----------
// The key file must be live at https://sixthgear.ai/<key>.txt, so write it on every build when the key is set
// (set INDEXNOW_KEY in your host's environment variables AND as a GitHub Actions secret).
if (process.env.INDEXNOW_KEY) write(`${process.env.INDEXNOW_KEY}.txt`, process.env.INDEXNOW_KEY + '\n');
if (process.argv.includes('--ping')) {
  const key = process.env.INDEXNOW_KEY;
  if (!key) {
    console.warn('  --ping given but INDEXNOW_KEY is not set; skipping IndexNow.');
  } else {
    const res = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ host: new URL(site.url).host, key, keyLocation: `${site.url}/${key}.txt`, urlList: urls.map((u) => u.loc) }),
    });
    console.log(`  IndexNow: HTTP ${res.status}`);
  }
}

console.log('Done.');
