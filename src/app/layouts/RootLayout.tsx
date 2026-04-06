import { Outlet, Link, useLocation, useNavigate } from 'react-router';
import { useEffect, useState } from 'react';
import {
  Bell,
  LayoutDashboard,
  MapPin,
  Sparkles,
  MessageCircle,
  Calendar,
  Heart,
  Star,
  User,
  Settings,
  LogIn,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { BottomTabBar } from '../components/BottomTabBar';
import { Button } from '../components/ui/button';
import { BRANDED_LOGO_SRC } from '../constants/branding';

const navigationMain = [
  { name: 'Accueil', href: '/dashboard', icon: LayoutDashboard },
  { name: 'MapBeautÃ©', href: '/map', icon: MapPin },
  { name: 'GlamFeed', href: '/glamfeed', icon: Sparkles },
  { name: 'RÃ©servations', href: '/reservations', icon: Calendar },
];

const navigationAccount = [
  { name: 'Notifications', href: '/notifications', icon: Bell },
  { name: 'Messages', href: '/messages', icon: MessageCircle },
  { name: 'Favoris', href: '/favorites', icon: Heart },
  { name: 'Avis', href: '/reviews', icon: Star },
  { name: 'Profil', href: '/profile', icon: User },
  { name: 'ParamÃ¨tres', href: '/settings', icon: Settings },
];

const guestNavigation = [
  { name: 'Accueil', href: '/', icon: LayoutDashboard },
  { name: 'Connexion', href: '/login', icon: LogIn },
];

export function RootLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      // L'accueil marketing reste accessible mÃªme sans connexion
      if (location.pathname !== '/' && location.pathname !== '/login') {
        navigate('/login', { replace: true });
      }
    }
  }, [user, location.pathname, navigate]);

  useEffect(() => {
    if (!user || user.role !== 'professional') return;
    const clientHubPaths: Record<string, string> = {
      '/dashboard': '/pro/dashboard',
      '/services': '/pro/services',
      '/reservations': '/pro/bookings',
      '/messages': '/pro/messages',
      '/reviews': '/pro/reviews',
      '/profile': '/pro/profile',
      '/settings': '/pro/settings',
    };
    if (location.pathname.startsWith('/messages')) {
      const rest = location.pathname.slice('/messages'.length) || '';
      navigate(`/pro/messages${rest}${location.search}`, { replace: true });
      return;
    }
    if (location.pathname.startsWith('/reservations')) {
      navigate('/pro/bookings', { replace: true });
      return;
    }
    const next = clientHubPaths[location.pathname];
    if (next) navigate(next, { replace: true });
  }, [user, location.pathname, navigate]);

  useEffect(() => {
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
  }, [location.pathname]);

  const safeFirstName = user?.firstName?.trim() || 'Compte';
  const safeLastName = user?.lastName?.trim() || '';
const initials = user
  ? `${safeFirstName.charAt(0)}${safeLastName.charAt(0)}`.trim() || 'U'
  : '';
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Top navigation bar - mobile first */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-14 sm:h-16 items-center justify-between gap-3">
            {/* Logo + brand */}
            <Link
              to="/"
              className="-ml-2 sm:ml-0 lg:ml-1 flex items-center gap-2 sm:gap-3"
              onClick={() => setMobileMenuOpen(false)}
            >
              <img
                src={BRANDED_LOGO_SRC}
                alt="LocBeautÃ©"
                className="h-10 w-auto object-contain sm:h-12 lg:h-16"
              />
              <span className="sr-only">LocBeautÃ©</span>
              <p className="hidden sm:block text-[11px] text-muted-foreground leading-snug">
                RÃ©servez vos soins en un clic
              </p>
            </Link>

            {/* Desktop / tablet nav */}
            {user && (
              <nav className="hidden md:flex items-center gap-1 lg:gap-2">
                {navigationMain.map((item) => {
                  const isActive =
                    item.href === '/'
                      ? location.pathname === '/'
                      : location.pathname.startsWith(item.href);

                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-medium lg:text-sm ${
                        isActive
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                      }`}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </nav>
            )}

            {/* Right side: user / auth + burger */}
            <div className="flex items-center gap-2">
              {user ? (
                <div className="hidden sm:flex items-center gap-2">
                  {/* User dropdown = Mon compte */}
                  <div className="relative hidden lg:block">
                    <button
                      type="button"
                      className="flex items-center gap-2 rounded-full bg-accent/60 border border-border px-3 py-1.5"
                      onClick={() => setUserMenuOpen((open) => !open)}
                      aria-haspopup="menu"
                      aria-expanded={userMenuOpen}
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#e8c1b7] to-[#6c5ce7] flex items-center justify-center text-xs font-medium text-white">
                        {initials}
                      </div>
                      <div className="hidden xl:flex flex-col min-w-0 text-left">
                        <span className="text-xs font-medium truncate">
                          {safeFirstName} {safeLastName}
                        </span>
                        <span className="text-[11px] text-muted-foreground truncate">
                          {user.email}
                        </span>
                      </div>
                      <ChevronDown
                        className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${
                          userMenuOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    <div
                      className={`absolute right-0 top-full z-20 mt-2 w-48 rounded-xl border border-border bg-card shadow-lg transition-opacity transition-[visibility] duration-150 ${
                        userMenuOpen ? 'visible opacity-100' : 'invisible opacity-0'
                      }`}
                    >
                      <div className="py-1">
                        {navigationAccount.map((item) => {
                          const isActive =
                            item.href === '/'
                              ? location.pathname === '/'
                              : location.pathname.startsWith(item.href);

                          return (
                            <Link
                              key={item.name}
                              to={item.href}
                              className={`flex items-center gap-2 px-3 py-2 text-xs lg:text-sm ${
                                isActive
                                  ? 'bg-primary text-primary-foreground'
                                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                              }`}
                            >
                              <item.icon className="h-4 w-4" />
                              <span>{item.name}</span>
                            </Link>
                          );
                        })}

                        <button
                          type="button"
                          onClick={() => { logout(); navigate('/'); }}
                          className="mt-1 flex w-full items-center gap-2 border-t border-border/70 px-3 pt-2 pb-2 text-xs lg:text-sm text-destructive hover:bg-destructive/5"
                        >
                          <LogOut className="h-4 w-4" />
                          <span>DÃ©connexion</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <Link to="/login" className="hidden sm:block">
                  <Button size="sm" className="rounded-full text-xs px-4 py-1.5">
                    Se connecter
                  </Button>
                </Link>
              )}

              {/* Burger button - mobile & tablet */}
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-full border border-border p-1.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground md:hidden"
                onClick={() => setMobileMenuOpen((open) => !open)}
                aria-label="Ouvrir le menu de navigation"
                aria-expanded={mobileMenuOpen}
              >
                <span className="sr-only">Menu</span>
                <div className="space-y-0.5">
                  <span className={`block h-[2px] w-4 rounded-full bg-current transition-transform ${mobileMenuOpen ? 'translate-y-[3px] rotate-45' : ''}`} />
                  <span className={`block h-[2px] w-4 rounded-full bg-current transition-opacity ${mobileMenuOpen ? 'opacity-0' : 'opacity-100'}`} />
                  <span className={`block h-[2px] w-4 rounded-full bg-current transition-transform ${mobileMenuOpen ? '-translate-y-[3px] -rotate-45' : ''}`} />
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile / tablet dropdown menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-card">
            <div className="mx-auto max-w-6xl px-4 py-3 space-y-2">
              {user && (
                <div className="mb-3 rounded-xl border border-border bg-accent/40 px-3 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#e8c1b7] to-[#6c5ce7] text-sm font-medium text-white">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {safeFirstName} {safeLastName}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                </div>
              )}

              {(user ? navigationMain : guestNavigation).map((item) => {
                const isActive =
                  item.href === '/'
                    ? location.pathname === '/'
                    : location.pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-2 rounded-lg px-2 py-2 text-sm ${
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}

              {user && (
                <>
                  <p className="mt-2 mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/80">
                    Mon compte
                  </p>
                  {navigationAccount.map((item) => {
                    const isActive =
                      item.href === '/'
                        ? location.pathname === '/'
                        : location.pathname.startsWith(item.href);

                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-2 rounded-lg px-2 py-2 text-sm ${
                          isActive
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                        }`}
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.name}</span>
                      </Link>
                    );
                  })}
                </>
              )}

              {/* Connexion / DÃ©connexion in mobile menu */}
              <div className="pt-1 border-t border-border/70 mt-2">
                {user ? (
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      logout();
                      navigate('/');
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  >
                    <LogOut className="w-4 h-4" />
                    DÃ©connexion
                  </button>
                ) : (
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground px-3 py-2 text-sm font-medium"
                  >
                    <LogIn className="w-4 h-4" />
                    Se connecter
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 bg-background pb-24 md:pb-0">
        <div className="mx-auto max-w-6xl px-4 pt-4 pb-6 sm:px-6 sm:pt-6 lg:px-8 lg:pt-8 lg:pb-10">
          <Outlet />
        </div>
      </main>
      {user && <BottomTabBar />}
    </div>
  );
}

