// Single source of truth for Sixth Gear's public facts.
// generate-seo.mjs reads this (plus content/blog/*.md) to build:
//   sitemap.xml, blog/rss.xml, blog/feed.json, llms.txt, llms-full.txt
// Keep every statement here TRUE and consistent with the website, LinkedIn, Crunchbase, etc.
// Consistent, verifiable facts are what search engines and AI assistants reward.

export const site = {
  name: 'Sixth Gear',
  url: 'https://sixthgear.ai',
  tagline: 'Your business, in a higher gear.',
  summary:
    'Sixth Gear is an AI automation and transformation partner. We build, run, and continuously optimise AI workflows against the KPIs that matter to your business, so your team can grow bigger, not busier.',
  email: 'humans@sixthgear.ai',
  leadsEmail: 'aswin@codevantage.io',
  bookingUrl: 'https://cal.com/aswin-kumar-kp/build-with-us',
  founder: { name: 'Aswin Kumar KP', role: 'Founder' },
  logo: 'https://sixthgear.ai/brand/sixth-gear-logo.png',
  ogImage: 'https://sixthgear.ai/brand/og-image.png',
  sameAs: [
    // TODO: add every official profile. These links are how engines confirm "Sixth Gear" is one entity.
    // 'https://www.linkedin.com/company/sixthgear-ai',
    // 'https://x.com/sixthgear_ai',
    // 'https://www.crunchbase.com/organization/sixth-gear',
    // 'https://www.youtube.com/@sixthgear',
  ],
  language: 'en',

  services: [
    {
      name: 'AI workflow automation',
      description:
        'We design and build AI workflows that take over repetitive, manual work across support, operations and back-office processes.',
    },
    {
      name: 'Managed AI operations',
      description:
        'We run your AI workflows in production and continuously optimise them against the KPIs you care about, such as turnaround time, cost per task and hours saved.',
    },
    {
      name: 'AI support agents',
      description:
        'AI agents that handle routine customer support queries and investigate issues, with humans reviewing the work that matters.',
    },
    {
      name: 'Free AI transformation workshop',
      description:
        'A free worksheet-led workshop to identify bottlenecks, assess readiness and risks, build a cost and outcome case, and plan a pilot.',
    },
  ],

  outcomes: [
    '24/7 operational coverage',
    '10+ hours saved per employee per week',
    '3× more workflows handled per team',
    '80% of routine support queries handled by AI',
    '2× faster turnaround',
    '65% less manual data entry',
  ],

  caseStudies: [
    {
      industry: 'Customer Service',
      result: '4× faster support investigation',
      description:
        'An AI support agent that investigates bugs, reproduces issues in a sandbox, and prepares tested fixes as draft PRs for engineering review.',
    },
    {
      industry: 'Field Operations',
      result: '65% less manual data entry',
      description:
        'An AI-powered workflow that brings field data capture, rule-based calculations, and report drafting into one streamlined process.',
    },
  ],

  stack: [
    'Anthropic (Claude)', 'OpenAI', 'Google Gemini', 'DeepSeek', 'Kimi', 'ElevenLabs',
    'Typesafe', 'Google Cloud', 'AWS', 'Snowflake', 'Microsoft Azure', 'Salesforce',
  ],

  workshop: [
    'Identify bottlenecks and map the workflow',
    'Assess readiness and risks',
    'Build a case estimating costs and outcomes',
    'Plan the pilot',
  ],

  // Shown visibly on the home page AND marked up as FAQPage (both are required for rich results).
  faq: [
    {
      q: "What does Sixth Gear do?",
      a: "Sixth Gear is an AI workflow automation and operations company. We design, build, deploy, and manage AI workflows across business functions, from customer support and sales to finance, marketing, operations, and engineering. Unlike providers that hand over a completed project, we continue to run, monitor, and optimise workflows against measurable business KPIs.",
    },
    {
      q: "What kind of results can AI workflow automation deliver?",
      a: "AI automation can help businesses save time, process more work and reduce manual effort, with no extra hires and operating beyond traditional working hours. Depending on the workflow, we’ve delivered 2× faster turnaround, 4× faster support investigation, 10+ hours saved per employee per week, 3× more workflows handled per team, 65% less manual data entry and 24/7 operational coverage.",
    },
    {
      q: "Which industries and processes does Sixth Gear automate?",
      a: "If your team spends hours on repetitive tasks, manual data entry, follow-ups, reporting, or moving information between tools, there’s an opportunity to automate. Sixth Gear identifies opportunities across industries such as SaaS, professional services, real estate, financial services, and e-commerce, and departments including sales, marketing, finance, HR, customer support, operations, and engineering. Not sure where to start? Use our free AI Workflow Builder worksheet to assess your workflows and determine whether automation makes business sense.",
    },
    {
      q: "Which AI models and platforms do you work with?",
      a: "Sixth Gear works with AI models and tools from Anthropic (Claude), OpenAI, Google Gemini, DeepSeek, Kimi, and ElevenLabs. Depending on the project, workflows can also integrate with infrastructure and business platforms such as Google Cloud, AWS, Microsoft Azure, Snowflake, and Salesforce. The technology stack is selected according to the workflow’s requirements, cost, performance, security, and integration needs.",
    },
    {
      q: "Do you only build the AI workflow, or also run it?",
      a: "Sixth Gear does both. We build and deploy AI workflows, then continue to run and optimise them in production. This includes monitoring performance, identifying issues, and improving workflows over time, with progress evaluated against agreed business KPIs.",
    },
    {
      q: "How do I start an AI transformation project with Sixth Gear?",
      a: "Start with our free AI Workflow Builder worksheet or book a call with our founder (https://cal.com/aswin-kumar-kp/build-with-us). We move from workflow assessment and scoping to building and deployment within 1–2 weeks.",
    }
  ],

  // Glossary: published at /glossary/ with DefinedTermSet schema. Definitions are short, neutral and
  // quotable, which is exactly what answer engines lift into "What is X?" responses.
  glossary: [
    { term: 'AI transformation', definition: 'The process of redesigning how a business operates so that AI systems take on meaningful parts of the work, measured by business outcomes such as cost, speed, quality and capacity rather than by the technology deployed.' },
    { term: 'AI workflow automation', definition: 'Using AI models, usually large language models combined with integrations and rules, to carry out multi-step business processes such as triaging tickets, extracting data from documents or drafting reports, with humans reviewing where judgement matters.' },
    { term: 'AI agent', definition: 'Software that uses an AI model to plan and take actions toward a goal, such as reading a support ticket, reproducing a bug and drafting a fix, rather than only generating a single response.' },
    { term: 'Human-in-the-loop', definition: 'A workflow design in which people review, approve or correct AI output at defined checkpoints, so automation scales without giving up control over important decisions.' },
    { term: 'KPI-driven AI', definition: 'An approach where every AI workflow is tied to a business metric (for example hours saved, turnaround time or share of queries resolved) and is tuned continuously against that metric after launch.' },
    { term: 'AI pilot', definition: 'A time-boxed, limited-scope deployment of an AI workflow on one real process, used to prove value against agreed KPIs before scaling.' },
    { term: 'AI readiness assessment', definition: 'A structured review of a team’s processes, data, systems, risks and skills to decide where AI can be applied safely and with the highest return.' },
    { term: 'Workflow bottleneck', definition: 'The step in a process that limits overall throughput, often manual data entry, hand-offs, or repetitive investigation, and usually the best first candidate for automation.' },
  ],

  // Static pages for the sitemap. Add new pages here as the site grows.
  pages: [
    { path: '/', changefreq: 'weekly', priority: 1.0 },
    { path: '/blog/', changefreq: 'weekly', priority: 0.8 },
    { path: '/glossary/', changefreq: 'monthly', priority: 0.6 },
  ],
};
