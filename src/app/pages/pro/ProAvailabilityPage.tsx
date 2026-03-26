import { useCallback, useEffect, useState } from 'react';
import { CalendarRange, Loader2, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { AppHeader } from '../../components/AppHeader';
import { AppCard } from '../../components/AppCard';
import { EmptyState } from '../../components/EmptyState';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Switch } from '../../components/ui/switch';
import { Skeleton } from '../../components/ui/skeleton';
import { Alert, AlertDescription } from '../../components/ui/alert';
import {
  fetchAvailabilitySlotsByProId,
  fetchProfessionalByUserId,
  replaceAvailabilitySlotsForPro,
} from '../../api/client';

const DAY_LABELS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'] as const;

function newLocalId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `r-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

type RangeRow = { localId: string; start: string; end: string };

type DayConfig = { enabled: boolean; ranges: RangeRow[] };

function defaultDayConfig(): DayConfig {
  return {
    enabled: false,
    ranges: [{ localId: newLocalId(), start: '09:00', end: '18:00' }],
  };
}

function initialWeekState(): DayConfig[] {
  return Array.from({ length: 7 }, () => defaultDayConfig());
}

function parseMinutes(t: string): number {
  const [h, m] = t.split(':').map((x) => parseInt(x, 10));
  if (Number.isNaN(h) || Number.isNaN(m)) return NaN;
  return h * 60 + m;
}

function rangesOverlapOnDay(ranges: RangeRow[]): boolean {
  const intervals = ranges
    .map((r) => ({ a: parseMinutes(r.start), b: parseMinutes(r.end) }))
    .filter((x) => !Number.isNaN(x.a) && !Number.isNaN(x.b) && x.b > x.a)
    .sort((x, y) => x.a - y.a);
  for (let i = 1; i < intervals.length; i++) {
    if (intervals[i]!.a < intervals[i - 1]!.b) return true;
  }
  return false;
}

export function ProAvailabilityPage() {
  const { user } = useAuth();
  const [proId, setProId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState<DayConfig[]>(initialWeekState);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const pro = await fetchProfessionalByUserId(user._id);
      if (!pro) {
        setProId(null);
        setDays(initialWeekState());
        return;
      }
      setProId(pro._id);
      const slots = await fetchAvailabilitySlotsByProId(pro._id);
      const next = initialWeekState();
      for (let d = 0; d < 7; d++) {
        const forDay = slots.filter((s) => s.dayOfWeek === d && s.isActive);
        if (forDay.length > 0) {
          next[d] = {
            enabled: true,
            ranges: forDay.map((s) => ({
              localId: newLocalId(),
              start: s.startTime,
              end: s.endTime,
            })),
          };
        }
      }
      setDays(next);
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : 'Chargement impossible');
    } finally {
      setLoading(false);
    }
  }, [user._id]);

  useEffect(() => {
    load();
  }, [load]);

  const updateDay = (index: number, patch: Partial<DayConfig>) => {
    setDays((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index]!, ...patch };
      return copy;
    });
  };

  const addRange = (dayIndex: number) => {
    setDays((prev) => {
      const copy = [...prev];
      const d = copy[dayIndex]!;
      copy[dayIndex] = {
        ...d,
        ranges: [...d.ranges, { localId: newLocalId(), start: '09:00', end: '12:00' }],
      };
      return copy;
    });
  };

  const removeRange = (dayIndex: number, localId: string) => {
    setDays((prev) => {
      const copy = [...prev];
      const d = copy[dayIndex]!;
      if (d.ranges.length <= 1) return prev;
      copy[dayIndex] = {
        ...d,
        ranges: d.ranges.filter((r) => r.localId !== localId),
      };
      return copy;
    });
  };

  const setRangeField = (dayIndex: number, localId: string, field: 'start' | 'end', value: string) => {
    setDays((prev) => {
      const copy = [...prev];
      const d = copy[dayIndex]!;
      copy[dayIndex] = {
        ...d,
        ranges: d.ranges.map((r) => (r.localId === localId ? { ...r, [field]: value } : r)),
      };
      return copy;
    });
  };

  const handleSave = async () => {
    if (!proId) return;
    const payload: { dayOfWeek: number; startTime: string; endTime: string }[] = [];
    for (let d = 0; d < 7; d++) {
      const cfg = days[d]!;
      if (!cfg.enabled) continue;
      if (cfg.ranges.length === 0) {
        setError(`Ajoutez au moins une plage pour ${DAY_LABELS[d]}.`);
        return;
      }
      if (rangesOverlapOnDay(cfg.ranges)) {
        setError(`Les plages se chevauchent le ${DAY_LABELS[d]}.`);
        return;
      }
      for (const r of cfg.ranges) {
        const a = parseMinutes(r.start);
        const b = parseMinutes(r.end);
        if (Number.isNaN(a) || Number.isNaN(b) || b <= a) {
          setError(`Horaires invalides le ${DAY_LABELS[d]}.`);
          return;
        }
        payload.push({ dayOfWeek: d, startTime: r.start, endTime: r.end });
      }
    }
    setError(null);
    setSaving(true);
    try {
      await replaceAvailabilitySlotsForPro(proId, payload);
      await load();
    } catch (e) {
      console.error(e);
      setError(
        e instanceof Error
          ? e.message
          : 'Enregistrement impossible (vérifiez la table availability_slots et les policies RLS).',
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl space-y-4">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    );
  }

  if (!proId) {
    return (
      <div className="mx-auto max-w-3xl">
        <AppHeader
          eyebrow="Planning"
          title="Disponibilités"
          subtitle="Associez d’abord une fiche professionnelle à votre compte."
        />
        <EmptyState
          icon={CalendarRange}
          title="Fiche pro introuvable"
          description="Sans ligne dans public.professionals, vous ne pouvez pas définir de plages."
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <AppHeader
        eyebrow="Planning"
        title="Disponibilités"
        subtitle="Plages récurrentes par jour de la semaine (0 = lundi … 6 = dimanche). Les clients ne verront que les créneaux libres selon la durée de la prestation."
        action={
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="size-4 animate-spin" /> : null}
            Enregistrer
          </Button>
        }
      />

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <Alert>
        <AlertDescription className="text-sm">
          Exécutez le script{' '}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">scripts/supabase-rls-availability-slots.sql</code>{' '}
          dans le SQL Editor Supabase si la sauvegarde renvoie une erreur de permission.
        </AlertDescription>
      </Alert>

      <div className="grid gap-4">
        {DAY_LABELS.map((label, dayIndex) => {
          const cfg = days[dayIndex]!;
          return (
            <AppCard key={label} tone="elevated" className="rounded-2xl space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={cfg.enabled}
                    onCheckedChange={(checked) => {
                      updateDay(dayIndex, {
                        enabled: checked,
                        ranges: checked && cfg.ranges.length === 0 ? defaultDayConfig().ranges : cfg.ranges,
                      });
                    }}
                    id={`day-${dayIndex}`}
                  />
                  <Label htmlFor={`day-${dayIndex}`} className="text-base font-semibold">
                    {label}
                  </Label>
                </div>
                {cfg.enabled ? (
                  <Button type="button" variant="outline" size="sm" className="gap-1" onClick={() => addRange(dayIndex)}>
                    <Plus className="size-4" />
                    Ajouter une plage
                  </Button>
                ) : null}
              </div>

              {cfg.enabled ? (
                <div className="space-y-3">
                  {cfg.ranges.map((r) => (
                    <div
                      key={r.localId}
                      className="flex flex-wrap items-end gap-3 rounded-xl border border-border/80 bg-background/60 p-3"
                    >
                      <div className="grid gap-1.5">
                        <Label className="text-xs text-muted-foreground">Début</Label>
                        <Input
                          type="time"
                          value={r.start}
                          onChange={(e) => setRangeField(dayIndex, r.localId, 'start', e.target.value)}
                          className="w-[8.5rem]"
                        />
                      </div>
                      <div className="grid gap-1.5">
                        <Label className="text-xs text-muted-foreground">Fin</Label>
                        <Input
                          type="time"
                          value={r.end}
                          onChange={(e) => setRangeField(dayIndex, r.localId, 'end', e.target.value)}
                          className="w-[8.5rem]"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        disabled={cfg.ranges.length <= 1}
                        onClick={() => removeRange(dayIndex, r.localId)}
                        aria-label="Supprimer la plage"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Jour inactif — aucune plage enregistrée.</p>
              )}
            </AppCard>
          );
        })}
      </div>
    </div>
  );
}
