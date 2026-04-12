import { useEffect } from 'react';

interface SEOConfig {
  title?: string;
  description?: string;
  canonical?: string;
  image?: string;
  type?: 'website' | 'profile' | 'article';
  noindex?: boolean;
  jsonLd?: Record<string, unknown>;
}

const DEFAULT_TITLE = 'LocBeauté · Réservation beauté à domicile';
const DEFAULT_DESC = 'Réservez vos soins beauté à domicile sur LocBeauté. Coiffure, ongles, esthétique, make-up avec des professionnels vérifiés près de chez vous.';
const SITE_URL = 'https://locbeaute.com';
const DEFAULT_IMAGE = `${SITE_URL}/asset/locbeaute_logo.png`;

export function useSEO(config: SEOConfig = {}) {
  const {
    title,
    description = DEFAULT_DESC,
    canonical,
    image = DEFAULT_IMAGE,
    type = 'website',
    noindex = false,
    jsonLd,
  } = config;

  const fullTitle = title ? `${title} · LocBeauté` : DEFAULT_TITLE;

  useEffect(() => {
    document.title = fullTitle;

    const setMeta = (name: string, content: string, isProp = false) => {
      const attr = isProp ? 'property' : 'name';
      let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    const resolvedCanonical = canonical ?? `${SITE_URL}${window.location.pathname}`;

    setMeta('description', description);
    setMeta('robots', noindex ? 'noindex,nofollow' : 'index,follow');

    setMeta('og:title', fullTitle, true);
    setMeta('og:description', description, true);
    setMeta('og:type', type, true);
    setMeta('og:image', image, true);
    setMeta('og:url', resolvedCanonical, true);
    setMeta('og:site_name', 'LocBeauté', true);
    setMeta('og:locale', 'fr_FR', true);

    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', fullTitle);
    setMeta('twitter:description', description);
    setMeta('twitter:image', image);

    let canonicalEl = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonicalEl) {
      canonicalEl = document.createElement('link');
      canonicalEl.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalEl);
    }
    canonicalEl.setAttribute('href', resolvedCanonical);

    let ldEl = document.getElementById('json-ld-dynamic') as HTMLScriptElement | null;
    if (jsonLd) {
      if (!ldEl) {
        ldEl = document.createElement('script');
        ldEl.id = 'json-ld-dynamic';
        ldEl.setAttribute('type', 'application/ld+json');
        document.head.appendChild(ldEl);
      }
      ldEl.textContent = JSON.stringify(jsonLd);
    } else if (ldEl) {
      ldEl.remove();
    }

    return () => {
      document.title = DEFAULT_TITLE;
    };
  }, [fullTitle, description, canonical, image, type, noindex, jsonLd]);
}
