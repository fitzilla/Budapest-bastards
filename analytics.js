/* Usage analytics: Google Analytics 4 and/or PostHog. Fill in either ID (or both) to switch it on.
   Both are public, client-side keys, so they're safe to commit. Nothing loads while they're blank,
   and nothing is ever sent from localhost. */
(() => {
  const GA_ID = '';            // Google Analytics 4 measurement ID, like 'G-ABC123XYZ'
  const POSTHOG_KEY = '';      // PostHog project API key, like 'phc_…'
  const POSTHOG_HOST = 'https://eu.i.posthog.com'; // 'https://us.i.posthog.com' for a US PostHog project

  const off = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
  const ga = !!GA_ID && !off;
  const ph = !!POSTHOG_KEY && !off;

  if (ga) {
    const s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA_ID);
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', GA_ID, { send_page_view: false }); // the app routes by #hash, so page views are sent below
  }

  if (ph) {
    // PostHog's standard loader: queues calls until the library arrives
    /* eslint-disable */
    !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="init capture register register_once register_for_session unregister unregister_for_session getFeatureFlag getFeatureFlagPayload isFeatureEnabled reloadFeatureFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSessionId getSurveys getActiveMatchingSurveys renderSurvey canRenderSurvey getNextSurveyStep identify setPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException loadToolbar get_property getSessionProperty createPersonProfile opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing clear_opt_in_out_capturing debug".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
    /* eslint-enable */
    window.posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      person_profiles: 'always',  // a handful of lads: one profile per phone is the useful view
      capture_pageview: false,    // sent below, per #route
      capture_pageleave: true,
      persistence: 'localStorage',
    });
    window.posthog.register({ app: 'bastards-on-tour-2026', standalone: matchMedia('(display-mode: standalone)').matches });
  }

  const send = (event, props) => {
    try {
      if (ga) window.gtag('event', event, props);
      if (ph) window.posthog.capture(event, props);
    } catch { /* analytics must never break the app */ }
  };

  // '#/p/lampas' -> '/Budapest-bastards/p/lampas', titled with the place's name
  function pageView() {
    const route = location.hash.replace(/^#\/?/, '');
    const [a, b] = route.split('/');
    const place = a === 'p' && window.BB_DATA?.places?.find((x) => x.id === b);
    const path = location.pathname.replace(/\/?$/, '/') + route;
    const title = place ? place.name : a === 'c' && b ? `Category: ${b}` : a ? a[0].toUpperCase() + a.slice(1) : 'Explore';
    const url = location.origin + path;
    try {
      if (ga) window.gtag('event', 'page_view', { page_location: url, page_path: path, page_title: title });
      if (ph) window.posthog.capture('$pageview', { $current_url: url, $pathname: path, title });
    } catch { /* ignore */ }
  }

  window.bbTrack = (ga || ph) ? send : () => {};
  if (ga || ph) {
    window.addEventListener('hashchange', pageView);
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', pageView, { once: true });
    else pageView();
  }
})();
