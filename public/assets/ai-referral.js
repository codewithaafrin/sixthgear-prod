// Tag visits that arrive from AI assistants so you can see GEO traffic in analytics.
// Include once on every page (after your analytics loads). Works with GA4 (gtag),
// Plausible, PostHog, or falls back to a CustomEvent your own analytics can listen to.

(function () {
  var AI_SOURCES = [
    ['chatgpt', /(^|\.)chatgpt\.com$|(^|\.)chat\.openai\.com$/],
    ['perplexity', /(^|\.)perplexity\.ai$/],
    ['claude', /(^|\.)claude\.ai$/],
    ['gemini', /(^|\.)gemini\.google\.com$/],
    ['copilot', /(^|\.)copilot\.microsoft\.com$/],
    ['meta-ai', /(^|\.)meta\.ai$/],
    ['deepseek', /(^|\.)chat\.deepseek\.com$/],
    ['you', /(^|\.)you\.com$/],
  ];
  var source = null;
  try {
    var params = new URLSearchParams(location.search);
    var utm = (params.get('utm_source') || '').toLowerCase();
    if (/chatgpt|openai|perplexity|claude|gemini|copilot/.test(utm)) source = utm;
    if (!source && document.referrer) {
      var host = new URL(document.referrer).hostname;
      for (var i = 0; i < AI_SOURCES.length; i++) if (AI_SOURCES[i][1].test(host)) { source = AI_SOURCES[i][0]; break; }
    }
  } catch (e) {}
  if (!source) return;

  var detail = { ai_source: source, landing_page: location.pathname };
  try { sessionStorage.setItem('ai_source', source); } catch (e) {}
  if (window.gtag) window.gtag('event', 'ai_referral', detail);
  if (window.plausible) window.plausible('AI Referral', { props: detail });
  if (window.posthog && window.posthog.capture) window.posthog.capture('ai_referral', detail);
  try { window.dispatchEvent(new CustomEvent('sixthgear:ai-referral', { detail: detail })); } catch (e) {}
})();
