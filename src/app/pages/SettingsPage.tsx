import { useEffect, useState } from 'react';
import { Bell, Lock, Globe, Eye, Shield, Download, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AppCard } from '../components/AppCard';
import { AppHeader } from '../components/AppHeader';
import {
  fetchPrivacySettings,
  updatePrivacySettings,
  fetchNotificationSettings,
  updateNotificationSettings,
  gdprExport,
  gdprDeleteAccount,
} from '../api/client';
import { Button } from '../components/ui/button';
import { Switch } from '../components/ui/switch';
import { Label } from '../components/ui/label';
import { Separator } from '../components/ui/separator';

export function SettingsPage() {
  const { user } = useAuth();
  const [privacy, setPrivacy] = useState<Record<string, boolean>>({});
  const [notifications, setNotifications] = useState<Record<string, boolean>>({});

  useEffect(() => {
    Promise.all([
      fetchPrivacySettings(user._id).catch(() => ({})),
      fetchNotificationSettings(user._id).catch(() => ({})),
    ]).then(([p, n]) => {
      setPrivacy(p as Record<string, boolean>);
      setNotifications(n as Record<string, boolean>);
    });
  }, [user._id]);

  const handlePrivacy = (key: string, value: boolean) => {
    const next = { ...privacy, [key]: value };
    setPrivacy(next);
    updatePrivacySettings(user._id, next).catch(console.error);
  };

  const handleNotification = (key: string, value: boolean) => {
    const next = { ...notifications, [key]: value };
    setNotifications(next);
    updateNotificationSettings(user._id, next).catch(console.error);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <AppHeader
        eyebrow="Préférences"
        title="Paramètres"
        subtitle="Personnalisez vos notifications, votre confidentialité et vos données personnelles depuis un espace structuré."
      />

      <div className="space-y-6">
        {/* Notifications */}
        <AppCard tone="elevated" className="rounded-2xl p-0 overflow-hidden">
          <div className="p-6 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">Notifications</h2>
                <p className="text-sm text-muted-foreground">
                  Gérez vos préférences de notifications
                </p>
              </div>
            </div>
          </div>
          <div className="p-6 space-y-6">
            <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex-1">
                <Label htmlFor="email-notifications" className="text-foreground cursor-pointer">
                  Notifications par email
                </Label>
                <p className="text-sm text-muted-foreground">
                  Recevoir des emails pour les confirmations et rappels
                </p>
              </div>
              <Switch
                id="email-notifications"
                checked={notifications.email ?? true}
                onCheckedChange={(v) => handleNotification('email', v)}
              />
            </div>
            <Separator />
            <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex-1">
                <Label htmlFor="booking-notifications" className="text-foreground cursor-pointer">
                  Notifications de réservation
                </Label>
                <p className="text-sm text-muted-foreground">
                  Alertes pour vos rendez-vous à venir
                </p>
              </div>
              <Switch
                id="booking-notifications"
                checked={notifications.booking ?? true}
                onCheckedChange={(v) => handleNotification('booking', v)}
              />
            </div>
            <Separator />
            <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex-1">
                <Label htmlFor="messages-notifications" className="text-foreground cursor-pointer">
                  Notifications de messages
                </Label>
                <p className="text-sm text-muted-foreground">
                  Alertes pour les nouveaux messages
                </p>
              </div>
              <Switch
                id="messages-notifications"
                checked={notifications.messages ?? true}
                onCheckedChange={(v) => handleNotification('messages', v)}
              />
            </div>
            <Separator />
            <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex-1">
                <Label htmlFor="marketing-notifications" className="text-foreground cursor-pointer">
                  Offres promotionnelles
                </Label>
                <p className="text-sm text-muted-foreground">
                  Recevoir des offres spéciales et nouveautés
                </p>
              </div>
              <Switch
                id="marketing-notifications"
                checked={notifications.marketing ?? false}
                onCheckedChange={(v) => handleNotification('marketing', v)}
              />
            </div>
          </div>
        </AppCard>

        {/* Privacy */}
        <AppCard tone="elevated" className="rounded-2xl p-0 overflow-hidden">
          <div className="p-6 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent dark:bg-accent">
                <Eye className="w-5 h-5 text-primary dark:text-primary" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">Confidentialité</h2>
                <p className="text-sm text-muted-foreground">
                  Contrôlez qui peut voir vos informations
                </p>
              </div>
            </div>
          </div>
          <div className="p-6 space-y-6">
            <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex-1">
                <Label htmlFor="profile-visibility" className="text-foreground cursor-pointer">
                  Profil public
                </Label>
                <p className="text-sm text-muted-foreground">
                  Rendre votre profil visible aux professionnels
                </p>
              </div>
              <Switch
                id="profile-visibility"
                checked={privacy.profileVisible ?? true}
                onCheckedChange={(v) => handlePrivacy('profileVisible', v)}
              />
            </div>
            <Separator />
            <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex-1">
                <Label htmlFor="show-reviews" className="text-foreground cursor-pointer">
                  Afficher mes avis publiquement
                </Label>
                <p className="text-sm text-muted-foreground">
                  Vos avis seront visibles par tous
                </p>
              </div>
              <Switch
                id="show-reviews"
                checked={privacy.showReviews ?? true}
                onCheckedChange={(v) => handlePrivacy('showReviews', v)}
              />
            </div>
          </div>
        </AppCard>

        {/* Security */}
        <AppCard tone="elevated" className="rounded-2xl p-0 overflow-hidden">
          <div className="p-6 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                <Lock className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">Sécurité</h2>
                <p className="text-sm text-muted-foreground">
                  Protégez votre compte
                </p>
              </div>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <Button variant="outline" className="w-full justify-start">
              <Lock className="w-4 h-4 mr-2" />
              Changer le mot de passe
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Shield className="w-4 h-4 mr-2" />
              Activer l'authentification à deux facteurs
            </Button>
          </div>
        </AppCard>

        {/* GDPR / Data */}
        <AppCard tone="elevated" className="rounded-2xl p-0 overflow-hidden">
          <div className="p-6 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                <Globe className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">Données personnelles (RGPD)</h2>
                <p className="text-sm text-muted-foreground">
                  Gérez vos données selon le RGPD
                </p>
              </div>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => {
                gdprExport(user._id)
                  .then((res) => {
                    const blob = new Blob([JSON.stringify(res, null, 2)], {
                      type: 'application/json',
                    });
                    const a = document.createElement('a');
                    a.href = URL.createObjectURL(blob);
                    a.download = `beautyhub-data-${user._id}.json`;
                    a.click();
                    URL.revokeObjectURL(a.href);
                  })
                  .catch(console.error);
              }}
            >
              <Download className="w-4 h-4 mr-2" />
              Télécharger mes données
            </Button>
            <p className="text-xs text-muted-foreground px-4">
              Vous pouvez télécharger une copie de toutes vos données personnelles stockées sur BeautyHub.
            </p>
            <Separator />
            <Button
              variant="destructive"
              className="w-full justify-start"
              onClick={() => {
                if (!window.confirm('Supprimer définitivement votre compte ? Cette action est irréversible.')) return;
                gdprDeleteAccount(user._id)
                  .then(() => {
                    window.alert('Compte supprimé. Vous allez être redirigé.');
                    window.location.href = '/';
                  })
                  .catch(console.error);
              }}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Supprimer mon compte
            </Button>
            <p className="text-xs text-muted-foreground px-4">
              La suppression de votre compte est irréversible et entraînera la perte de toutes vos données.
            </p>
          </div>
        </AppCard>

        {/* Language & Region */}
        <AppCard tone="elevated" className="rounded-2xl p-0 overflow-hidden">
          <div className="p-6 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-pink-100 dark:bg-pink-900/30">
                <Globe className="w-5 h-5 text-pink-600 dark:text-pink-400" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">Langue et région</h2>
                <p className="text-sm text-muted-foreground">
                  Personnalisez votre expérience
                </p>
              </div>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <Label className="text-foreground mb-2 block">Langue</Label>
              <Button variant="outline" className="w-full justify-between">
                Français
                <span className="text-muted-foreground">🇫🇷</span>
              </Button>
            </div>
            <div>
              <Label className="text-foreground mb-2 block">Fuseau horaire</Label>
              <Button variant="outline" className="w-full justify-between">
                Europe/Paris (GMT+1)
              </Button>
            </div>
          </div>
        </AppCard>
      </div>
    </div>
  );
}
