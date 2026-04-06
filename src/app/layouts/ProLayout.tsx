import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, Outlet, useLocation, useNavigate } from 'react-router';
import {
  Calendar,
  CalendarClock,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageCircle,
  Scissors,
  Settings,
  Star,
  User,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '../components/ui/sheet';
import { cn } from '../components/ui/utils';
import { BRANDED_LOGO_SRC } from '../constants/branding';

const PRO_NAV = [
  { label: 'Dashboard', href: '/pro/dashboard', icon: LayoutDashboard },
  { label: 'Services', href: '/pro/services', icon: Scissors },
  { label: 'Disponibilités', href: '/pro/availability', icon: CalendarClock },
  { label: 'Réservations', href: '/pro/bookings', icon: Calendar },
  { label: 'Messages', href: '/pro/messages', icon: MessageCircle },
  { label: 'Avis', href: '/pro/reviews', icon: Star },
  { label: 'Profil', href: '/pro/profile', icon: User },
  { label: 'Paramètres', href: '/pro/settings', icon: Settings },
] as const;

function navActive(pathname: string, href: string) {
  if (href === '/pro/dashboard') return pathname === '/pro/dashboard';
  return pathname === href || pathname.startsWith(`${href}/`);
}

function ProNavLinks({
  onNavigate,
  className,
}: {
  onNavigate?: () => void;
  className?: string;
}) {
  const location = useLocation();
  return (
    <nav className={cn('flex flex-col gap-1', className)}>
      {PRO_NAV.map(({ label, href, icon: Icon }) => {
        const active = navActive(location.pathname, href);
        return (
          <Link
            key={href}
            to={href}
            onClick={onNavigate}
            className={cn(
              'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
              active
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
            )}
          >
            <Icon className="h-4 w-4 shrink-0 opacity-90" />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function ProLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    setSheetOpen(false);
  }, [location.pathname]);

  const currentTitle = useMemo(() => {
    const item = PRO_NAV.find((n) => navActive(location.pathname, n.href));
    return item?.label ?? 'Espace pro';
  }, [location.pathname]);

  if (!user) {
    return <Navigate to="/login?role=pro" replace />;
  }

  if (user.role !== 'professional') {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-[1600px]">
        <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-card/80 py-6 pl-4 pr-3 lg:flex">
          <Link to="/pro/dashboard" className="mb-8 flex items-center gap-2 px-2">
            <img src={BRANDED_LOGO_SRC} alt="LocBeauté Pro" className="h-9 w-auto object-contain" />
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">Pro</span>
          </Link>
          <ProNavLinks className="flex-1" />
          <div className="mt-auto space-y-2 border-t border-border/80 pt-4">
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={() => {
                logout();
                navigate('/login?role=pro', { replace: true });
              }}
            >
              <LogOut className="h-4 w-4" />
              Déconnexion
            </Button>
            <Link
              to="/"
              className="block px-3 text-xs text-muted-foreground underline-offset-4 hover:underline"
            >
              Voir le site public
            </Link>
          </div>
        </aside>

        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-border bg-background/95 px-4 py-3 backdrop-blur lg:hidden">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">{currentTitle}</p>
              <p className="text-[11px] text-muted-foreground">Espace professionnel</p>
            </div>
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" aria-label="Ouvrir le menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="flex w-[min(100%,320px)] flex-col gap-4">
                <SheetHeader>
                  <SheetTitle>Navigation</SheetTitle>
                </SheetHeader>
                <ProNavLinks onNavigate={() => setSheetOpen(false)} />
                <Button
                  variant="outline"
                  className="mt-auto gap-2"
                  onClick={() => {
                    logout();
                    navigate('/login?role=pro', { replace: true });
                  }}
                >
                  <LogOut className="h-4 w-4" />
                  Déconnexion
                </Button>
              </SheetContent>
            </Sheet>
          </header>

          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
