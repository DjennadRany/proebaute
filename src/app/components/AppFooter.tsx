import { Link } from 'react-router';
import { Instagram } from 'lucide-react';
import { BRANDED_LOGO_SRC } from '../constants/branding';

const INSTAGRAM_URL = 'https://www.instagram.com/locbeaute.app?igsh=MXcwYjZrdzd0NTZ5dA==';

const NAV_APP = [
  { label: 'Accueil', href: '/' },
  { label: 'Carte des pros', href: '/map' },
  { label: 'GlamFeed', href: '/glamfeed' },
  { label: 'Professionnels', href: '/professionals' },
  { label: 'Services', href: '/services' },
];

const NAV_CLIENT = [
  { label: 'Se connecter', href: '/login' },
  { label: 'Réservations', href: '/reservations' },
  { label: 'Messages', href: '/messages' },
  { label: 'Favoris', href: '/favorites' },
  { label: 'Avis', href: '/reviews' },
];

const NAV_PRO = [
  { label: 'Espace professionnel', href: '/pro/dashboard' },
  { label: 'Mes Bookings', href: '/pro/bookings' },
  { label: 'Disponibilités', href: '/pro/availability' },
  { label: 'Mon Portefeuille', href: '/pro/wallet' },
  { label: 'Paramètres pro', href: '/pro/settings' },
];

const ROADMAP_ITEMS = [
  { label: 'Carte interactive', done: true },
  { label: 'GlamFeed', done: true },
  { label: 'Inscriptions pro', done: true },
  { label: 'Paiement intégré', done: false },
  { label: 'App iOS & Android', done: false },
  { label: 'Abonnements pro', done: false },
];

export function AppFooter() {
  return (
    <footer className="w-full" role="contentinfo">

      {/* ── Instagram banner ──────────────────────────────────────────────── */}
      <a
        href={INSTAGRAM_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="block relative overflow-hidden group"
        aria-label="Suivez LocBeauté sur Instagram"
      >
        <div
          className="relative flex items-center justify-between gap-4 px-6 sm:px-10 py-5"
          style={{
            background: 'linear-gradient(135deg, #080808 0%, #1a0a18 35%, #2a1028 60%, rgba(201,168,76,0.08) 100%)',
            borderTop: '1px solid rgba(201,168,76,0.2)',
            borderBottom: '1px solid rgba(201,168,76,0.12)',
          }}
        >
          <div
            className="absolute right-0 top-0 w-64 h-full pointer-events-none opacity-30"
            style={{ background: 'radial-gradient(ellipse at 100% 50%, #e1306c55 0%, transparent 70%)' }}
          />
          <div className="flex items-center gap-4 relative z-10">
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-lg"
              style={{
                background: 'linear-gradient(135deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
              }}
            >
              <Instagram className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">@LocBeauté</p>
              <p className="text-xs text-white/55">Inspirations beauté, avant-premières et actus de la plateforme</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-white/60 group-hover:text-white transition-colors relative z-10 shrink-0">
            <span className="hidden sm:inline">Suivre sur Instagram</span>
            <Instagram className="h-4 w-4" />
          </div>
        </div>
      </a>

      {/* ── Main footer ───────────────────────────────────────────────────── */}
      <div
        className="px-4 sm:px-6 lg:px-8 pt-10 pb-8"
        style={{
          background: 'linear-gradient(180deg, #05070d 0%, #080808 100%)',
          borderTop: '1px solid rgba(201,168,76,0.08)',
        }}
      >
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 grid-cols-2 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_1.5fr]">

            {/* Brand — full width on mobile */}
            <div className="col-span-2 lg:col-span-1 space-y-4">
              <Link to="/" className="inline-flex items-center gap-3">
                <img src={BRANDED_LOGO_SRC} alt="LocBeauté" className="h-8 w-auto object-contain" />
              </Link>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-[220px]">
                La plateforme beauté qui connecte les meilleurs professionnels avec leurs clientes, partout en France.
              </p>
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-8 h-8 rounded-xl items-center justify-center border border-border hover:border-primary/40 text-muted-foreground hover:text-white transition-colors"
                style={{ background: 'rgba(255,255,255,0.03)' }}
                aria-label="Instagram LocBeauté"
              >
                <Instagram className="h-3.5 w-3.5" />
              </a>
            </div>

            {/* L'App */}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary mb-4">L'App</p>
              <ul className="space-y-2.5">
                {NAV_APP.map(({ label, href }) => (
                  <li key={href}>
                    <Link to={href} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Espace Client */}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary mb-4">Clientes</p>
              <ul className="space-y-2.5">
                {NAV_CLIENT.map(({ label, href }) => (
                  <li key={href}>
                    <Link to={href} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Espace Pro */}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary mb-4">Pros</p>
              <ul className="space-y-2.5">
                {NAV_PRO.map(({ label, href }) => (
                  <li key={href}>
                    <Link to={href} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Roadmap */}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary mb-4">Roadmap</p>
              <ul className="space-y-2">
                {ROADMAP_ITEMS.map(({ label, done }) => (
                  <li key={label} className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${done ? 'bg-emerald-500' : 'bg-primary/35'}`} />
                    <span className={`text-xs ${done ? 'text-muted-foreground/60 line-through' : 'text-foreground/70'}`}>
                      {label}
                    </span>
                    {done && (
                      <span className="text-[9px] font-semibold text-emerald-400 bg-emerald-500/10 rounded-full px-1.5 py-0.5 shrink-0">
                        Live
                      </span>
                    )}
                  </li>
                ))}
              </ul>
              <p className="text-[10px] text-muted-foreground/60 mt-3 leading-relaxed">
                Prochaine mise à jour · mai 2026
              </p>
            </div>

          </div>

          {/* Gold divider */}
          <div className="gold-divider my-8" />

          {/* Bottom bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-[11px] text-muted-foreground">
            <p>© 2026 LocBeauté · Tous droits réservés</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              <span className="cursor-default hover:text-foreground transition-colors">Mentions légales</span>
              <span className="cursor-default hover:text-foreground transition-colors">CGU</span>
              <span className="cursor-default hover:text-foreground transition-colors">Confidentialité</span>
              <span className="cursor-default hover:text-foreground transition-colors">Cookies</span>
            </div>
          </div>

        </div>
      </div>
    </footer>
  );
}
