import { useState } from 'react';
import {
  Shield,
  CreditCard,
  Bell,
  User,
  Briefcase,
  Eye,
  EyeOff,
  Info,
  CheckCircle2,
  AlertCircle,
  Save,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router';
import { AppHeader } from '../../components/AppHeader';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Tab = 'compte' | 'activite' | 'paiements' | 'notifications' | 'securite';

// ---------------------------------------------------------------------------
// Persistance locale
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'pro_settings';

function loadSettings(): Record<string, unknown> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

// ---------------------------------------------------------------------------
// Composant principal
// ---------------------------------------------------------------------------

export function ProSettingsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<Tab>('compte');
  const [settings, setSettings] = useState<Record<string, unknown>>(loadSettings);

  const save = (updates: Record<string, unknown>) => {
    const next = { ...settings, ...updates };
    setSettings(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  const get = <T,>(key: string, fallback: T): T => {
    return key in settings ? (settings[key] as T) : fallback;
  };

  // -------------------------------------------------------------------------
  // Barre d'onglets
  // -------------------------------------------------------------------------

  const tabLabels: Record<Tab, string> = {
    compte: 'Compte',
    activite: 'Activite Pro',
    paiements: 'Paiements',
    notifications: 'Notifications',
    securite: 'Securite',
  };

  const tabs = (
    <div className="flex gap-1 overflow-x-auto pb-1 mb-6 border-b border-border">
      {(['compte', 'activite', 'paiements', 'notifications', 'securite'] as Tab[]).map((tab) => (
        <button
          key={tab}
          onClick={() => setActiveTab(tab)}
          className={`px-4 py-2 text-sm font-medium whitespace-nowrap rounded-t-lg border-b-2 transition-colors ${
            activeTab === tab
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          {tabLabels[tab]}
        </button>
      ))}
    </div>
  );

  // -------------------------------------------------------------------------
  // Rendu conditionnel par onglet
  // -------------------------------------------------------------------------

  return (
    <div className="max-w-3xl mx-auto px-4 pb-16">
      <AppHeader
        eyebrow="Pro"
        title="Parametres"
        subtitle="Gerez votre compte professionnel, votre activite et vos preferences."
        backTo="/pro"
      />

      {tabs}

      {activeTab === 'compte' && <TabCompte get={get} save={save} user={user} />}
      {activeTab === 'activite' && <TabActivite get={get} save={save} />}
      {activeTab === 'paiements' && <TabPaiements get={get} save={save} />}
      {activeTab === 'notifications' && <TabNotifications get={get} save={save} />}
      {activeTab === 'securite' && <TabSecurite navigate={navigate} />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers UI locaux
// ---------------------------------------------------------------------------

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-foreground">{label}</label>
      {children}
    </div>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary ${props.className ?? ''}`}
    />
  );
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary ${props.className ?? ''}`}
    />
  );
}

function SaveButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-[#8B6914] to-[#C9A84C] hover:from-[#7A5C12] hover:to-[#B8943E] transition-all shadow-sm"
    >
      <Save className="w-4 h-4" />
      Enregistrer
    </button>
  );
}

// ---------------------------------------------------------------------------
// Onglet Compte
// ---------------------------------------------------------------------------

function TabCompte({
  get,
  save,
  user,
}: {
  get: <T>(key: string, fallback: T) => T;
  save: (u: Record<string, unknown>) => void;
  user: { firstName?: string; lastName?: string; email?: string } | null;
}) {
  const [prenom, setPrenom] = useState(get('prenom', user?.firstName ?? ''));
  const [nom, setNom] = useState(get('nom', user?.lastName ?? ''));
  const [email, setEmail] = useState(get('email', user?.email ?? ''));
  const [telephone, setTelephone] = useState(get<string>('telephone', ''));
  const [ville, setVille] = useState(get<string>('ville', ''));
  const [codePostal, setCodePostal] = useState(get<string>('codePostal', ''));
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    save({ prenom, nom, email, telephone, ville, codePostal });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const villes = [
    'Paris', 'Lyon', 'Marseille', 'Bordeaux', 'Toulouse', 'Nantes',
    'Strasbourg', 'Lille', 'Rennes', 'Nice', 'Montpellier', 'Autre',
  ];

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-card p-6 space-y-4 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <User className="w-5 h-5 text-primary" />
          <h2 className="font-semibold text-foreground">Informations personnelles</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Prenom">
            <Input
              type="text"
              value={prenom}
              onChange={(e) => setPrenom(e.target.value)}
              placeholder="Votre prenom"
            />
          </Field>
          <Field label="Nom">
            <Input
              type="text"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder="Votre nom"
            />
          </Field>
        </div>

        <Field label="Email">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="votre@email.com"
          />
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Info className="w-3 h-3" />
            Une verification sera envoyee si vous modifiez votre email.
          </p>
        </Field>

        <Field label="Telephone">
          <Input
            type="tel"
            value={telephone}
            onChange={(e) => setTelephone(e.target.value)}
            placeholder="+33 6 00 00 00 00"
          />
        </Field>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 space-y-4 mb-4">
        <h2 className="font-semibold text-foreground">Localisation</h2>

        <Field label="Ville">
          <Select value={ville} onChange={(e) => setVille(e.target.value)}>
            <option value="">Selectionner une ville</option>
            {villes.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </Select>
        </Field>

        <Field label="Code postal">
          <Input
            type="text"
            value={codePostal}
            onChange={(e) => setCodePostal(e.target.value)}
            placeholder="75001"
            maxLength={5}
          />
        </Field>
      </div>

      <div className="flex items-center gap-3">
        <SaveButton onClick={handleSave} />
        {saved && (
          <span className="text-sm text-green-600 flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4" /> Enregistre !
          </span>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Onglet Activite
// ---------------------------------------------------------------------------

function TabActivite({
  get,
  save,
}: {
  get: <T>(key: string, fallback: T) => T;
  save: (u: Record<string, unknown>) => void;
}) {
  const [siret, setSiret] = useState(get<string>('siret', ''));
  const [statut, setStatut] = useState(get<string>('statut', ''));
  const [specialite, setSpecialite] = useState(get<string>('specialite', ''));
  const [zone, setZone] = useState(get<string>('zone', 'domicile'));
  const [rayon, setRayon] = useState(get<number>('rayon', 20));
  const [tarifHoraire, setTarifHoraire] = useState(get<string>('tarifHoraire', ''));
  const [annulation, setAnnulation] = useState(get<string>('annulation', 'flexible'));
  const [bienvenue, setBienvenue] = useState(get<string>('bienvenue', ''));
  const [verifie] = useState(get<boolean>('verifie', false));
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    save({ siret, statut, specialite, zone, rayon, tarifHoraire, annulation, bienvenue });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const zonesOptions = [
    { value: 'domicile', label: 'A domicile' },
    { value: 'salon', label: 'En salon' },
    { value: 'les-deux', label: 'Les deux' },
  ];

  return (
    <div className="space-y-4">
      {/* SIRET */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Briefcase className="w-5 h-5 text-primary" />
          <h2 className="font-semibold text-foreground">Informations legales</h2>
        </div>

        <Field label="Numero SIRET">
          <Input
            type="text"
            value={siret}
            onChange={(e) => {
              const v = e.target.value.replace(/\D/g, '').slice(0, 14);
              setSiret(v);
            }}
            placeholder="14 chiffres"
            maxLength={14}
          />
          <a
            href="https://annuaire-entreprises.data.gouv.fr"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary hover:underline"
          >
            Verifier sur sirene.fr
          </a>
        </Field>

        <Field label="Statut juridique">
          <Select value={statut} onChange={(e) => setStatut(e.target.value)}>
            <option value="">Selectionner</option>
            <option value="auto">Auto-entrepreneur</option>
            <option value="eurl">EURL</option>
            <option value="sarl">SARL</option>
            <option value="sas">SAS</option>
            <option value="autre">Autre</option>
          </Select>
        </Field>
      </div>

      {/* Specialite et zone */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4 mb-4">
        <h2 className="font-semibold text-foreground">Activite</h2>

        <Field label="Specialite">
          <Select value={specialite} onChange={(e) => setSpecialite(e.target.value)}>
            <option value="">Selectionner</option>
            <option value="coiffure">Coiffure</option>
            <option value="esthetique">Esthetique</option>
            <option value="onglerie">Onglerie</option>
            <option value="barbe">Barbe</option>
            <option value="maquillage">Maquillage</option>
            <option value="massage">Massage</option>
            <option value="soin-visage">Soin visage</option>
            <option value="pedicure">Pedicure</option>
            <option value="autre">Autre</option>
          </Select>
        </Field>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-foreground">Zone d'intervention</label>
          <div className="grid grid-cols-3 gap-3">
            {zonesOptions.map((z) => (
              <button
                key={z.value}
                onClick={() => setZone(z.value)}
                className={`rounded-lg border px-3 py-3 text-sm font-medium transition-colors text-center ${
                  zone === z.value
                    ? 'border-primary bg-accent text-primary dark:bg-accent dark:text-primary'
                    : 'border-border text-muted-foreground hover:border-primary hover:text-foreground'
                }`}
              >
                {z.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-foreground">
            Rayon d'intervention -{' '}
            <span className="text-primary font-semibold">{rayon} km</span> autour de votre adresse
          </label>
          <input
            type="range"
            min={5}
            max={100}
            step={5}
            value={rayon}
            onChange={(e) => setRayon(Number(e.target.value))}
            className="w-full accent-primary"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>5 km</span>
            <span>100 km</span>
          </div>
        </div>

        <Field label="Tarif horaire">
          <div className="relative">
            <Input
              type="number"
              value={tarifHoraire}
              onChange={(e) => setTarifHoraire(e.target.value)}
              placeholder="0"
              className="pr-12"
              min={0}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              euro/h
            </span>
          </div>
        </Field>
      </div>

      {/* Politique annulation et message */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4 mb-4">
        <h2 className="font-semibold text-foreground">Conditions</h2>

        <Field label="Politique d'annulation">
          <Select value={annulation} onChange={(e) => setAnnulation(e.target.value)}>
            <option value="flexible">Flexible - annulation jusqu'a 24h avant</option>
            <option value="moderee">Moderee - annulation jusqu'a 48h avant</option>
            <option value="stricte">Stricte - annulation jusqu'a 72h avant</option>
          </Select>
        </Field>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">
            Message de bienvenue
            <span className="ml-2 text-xs text-muted-foreground font-normal">
              {bienvenue.length}/300
            </span>
          </label>
          <textarea
            value={bienvenue}
            onChange={(e) => {
              if (e.target.value.length <= 300) setBienvenue(e.target.value);
            }}
            rows={4}
            maxLength={300}
            placeholder="Presentez-vous en quelques mots a vos clients..."
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          />
        </div>
      </div>

      {/* Statut verification */}
      {verifie ? (
        <div className="rounded-xl border border-green-200 bg-green-50 dark:bg-green-900/10 dark:border-green-800 p-4 flex items-center gap-3 mb-4">
          <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-green-700 dark:text-green-400">Profil verifie</p>
            <p className="text-xs text-green-600 dark:text-green-500">
              Votre profil a ete verifie par l'equipe LocBeaute.
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-orange-200 bg-orange-50 dark:bg-orange-900/10 dark:border-orange-800 p-4 space-y-3 mb-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-orange-500 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-orange-700 dark:text-orange-400">
                Profil non verifie
              </p>
              <p className="text-xs text-orange-600 dark:text-orange-500">
                Faites verifier votre profil pour inspirer confiance a vos clients.
              </p>
            </div>
          </div>
          <button className="w-full rounded-lg border border-orange-400 bg-white dark:bg-transparent px-4 py-2 text-sm font-medium text-orange-700 dark:text-orange-400 hover:bg-orange-100 transition-colors">
            Demander la verification
          </button>
        </div>
      )}

      <div className="flex items-center gap-3">
        <SaveButton onClick={handleSave} />
        {saved && (
          <span className="text-sm text-green-600 flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4" /> Enregistre !
          </span>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Onglet Paiements
// ---------------------------------------------------------------------------

function TabPaiements({
  get,
  save,
}: {
  get: <T>(key: string, fallback: T) => T;
  save: (u: Record<string, unknown>) => void;
}) {
  const [ibanEdit, setIbanEdit] = useState(false);
  const [iban, setIban] = useState(get<string>('iban', ''));
  const [showIban, setShowIban] = useState(false);
  const [bic, setBic] = useState(get<string>('bic', ''));
  const [titulaire, setTitulaire] = useState(get<string>('titulaire', ''));
  const [seuilVirement, setSeuilVirement] = useState(get<string>('seuilVirement', '50'));
  const [saved, setSaved] = useState(false);

  // Masquage IBAN - affiche seulement les 4 derniers chiffres
  const maskedIban = () => {
    if (!iban) return '';
    const cleaned = iban.replace(/\s/g, '');
    if (cleaned.length < 4) return cleaned;
    const prefix = cleaned.slice(0, 4); // ex: FR76
    const last4 = cleaned.slice(-4);
    return `${prefix} **** **** **** ${last4}`;
  };

  const handleSave = () => {
    save({ iban, bic, titulaire, seuilVirement });
    setIbanEdit(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* IBAN */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <CreditCard className="w-5 h-5 text-primary" />
          <h2 className="font-semibold text-foreground">Coordonnees bancaires</h2>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">IBAN</label>
          {ibanEdit ? (
            <div className="relative">
              <Input
                type={showIban ? 'text' : 'password'}
                value={iban}
                onChange={(e) => setIban(e.target.value.toUpperCase())}
                placeholder="FR76 XXXX XXXX XXXX XXXX XXXX XXX"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowIban((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showIban ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2">
              <span className="text-sm font-mono text-foreground">
                {iban ? maskedIban() : <span className="text-muted-foreground">Aucun IBAN enregistre</span>}
              </span>
              <button
                onClick={() => setIbanEdit(true)}
                className="text-xs text-primary hover:underline ml-3 shrink-0"
              >
                Modifier l'IBAN
              </button>
            </div>
          )}
        </div>

        <Field label="BIC / SWIFT">
          <Input
            type="text"
            value={bic}
            onChange={(e) => setBic(e.target.value.toUpperCase())}
            placeholder="BNPAFRPPXXX"
          />
        </Field>

        <Field label="Titulaire du compte">
          <Input
            type="text"
            value={titulaire}
            onChange={(e) => setTitulaire(e.target.value)}
            placeholder="Prenom NOM"
          />
        </Field>
      </div>

      {/* Infos virements */}
      <div className="rounded-xl border border-blue-200 bg-blue-50 dark:bg-blue-900/10 dark:border-blue-800 p-5 space-y-2 mb-4">
        <div className="flex items-center gap-2 mb-1">
          <Info className="w-4 h-4 text-blue-600 shrink-0" />
          <p className="text-sm font-semibold text-blue-700 dark:text-blue-400">Conditions de paiement</p>
        </div>
        <ul className="space-y-1.5 text-xs text-blue-600 dark:text-blue-400">
          <li>- Virements chaque lundi pour prestations terminees depuis +48h</li>
          <li>- Commission LocBeaute : 10% HT</li>
          <li>- Delai : 3-5 jours ouvres selon votre banque</li>
        </ul>
      </div>

      {/* Seuil minimum */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4 mb-4">
        <h2 className="font-semibold text-foreground">Seuil minimum de virement</h2>
        <Field label="Virer a partir de">
          <Select value={seuilVirement} onChange={(e) => setSeuilVirement(e.target.value)}>
            <option value="20">20 euro</option>
            <option value="50">50 euro</option>
            <option value="100">100 euro</option>
            <option value="200">200 euro</option>
            <option value="toujours">Toujours virer</option>
          </Select>
        </Field>
      </div>

      {/* Recapitulatif annuel */}
      <div className="rounded-xl border border-border bg-card p-6 mb-4">
        <button
          disabled
          className="flex items-center gap-2 w-full px-4 py-2.5 rounded-lg border border-border text-sm text-muted-foreground bg-muted/30 cursor-not-allowed"
        >
          <CreditCard className="w-4 h-4" />
          Telecharger recapitulatif annuel (PDF)
        </button>
        <p className="text-xs text-muted-foreground mt-2">
          Disponible en janvier pour l'annee precedente.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <SaveButton onClick={handleSave} />
        {saved && (
          <span className="text-sm text-green-600 flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4" /> Enregistre !
          </span>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Onglet Notifications
// ---------------------------------------------------------------------------

function SwitchRow({
  id,
  label,
  description,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <div className="flex-1 min-w-0">
        <label htmlFor={id} className="text-sm font-medium text-foreground cursor-pointer">
          {label}
        </label>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      <label className="relative inline-flex items-center cursor-pointer shrink-0">
        <input
          id={id}
          type="checkbox"
          className="sr-only peer"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <div className="w-11 h-6 rounded-full bg-muted peer-checked:bg-primary transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:w-5 after:h-5 after:transition-all peer-checked:after:translate-x-5 after:shadow-sm" />
      </label>
    </div>
  );
}

function TabNotifications({
  get,
  save,
}: {
  get: <T>(key: string, fallback: T) => T;
  save: (u: Record<string, unknown>) => void;
}) {
  const [notifNouvelleResa, setNotifNouvelleResa] = useState(get<boolean>('notifNouvelleResa', true));
  const [notifResaAnnulee, setNotifResaAnnulee] = useState(get<boolean>('notifResaAnnulee', true));
  const [notifRappel24h, setNotifRappel24h] = useState(get<boolean>('notifRappel24h', true));
  const [notifVirement, setNotifVirement] = useState(get<boolean>('notifVirement', true));
  const [notifSolde, setNotifSolde] = useState(get<boolean>('notifSolde', true));
  const [notifConseils, setNotifConseils] = useState(get<boolean>('notifConseils', false));
  const [notifNouveautes, setNotifNouveautes] = useState(get<boolean>('notifNouveautes', false));
  const [doNotDisturb, setDoNotDisturb] = useState(get<boolean>('doNotDisturb', false));
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    save({
      notifNouvelleResa,
      notifResaAnnulee,
      notifRappel24h,
      notifVirement,
      notifSolde,
      notifConseils,
      notifNouveautes,
      doNotDisturb,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Reservations */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-1 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Bell className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Reservations</h3>
        </div>
        <SwitchRow
          id="notif-nouvelle-resa"
          label="Nouvelle reservation"
          description="Alerte quand un client reserve une prestation"
          checked={notifNouvelleResa}
          onChange={setNotifNouvelleResa}
        />
        <div className="border-b border-border" />
        <SwitchRow
          id="notif-resa-annulee"
          label="Reservation annulee"
          description="Alerte quand un client annule une reservation"
          checked={notifResaAnnulee}
          onChange={setNotifResaAnnulee}
        />
        <div className="border-b border-border" />
        <SwitchRow
          id="notif-rappel-24h"
          label="Rappel 24h avant"
          description="Rappel automatique la veille de chaque prestation"
          checked={notifRappel24h}
          onChange={setNotifRappel24h}
        />
      </div>

      {/* Paiements */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-1 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <CreditCard className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Paiements</h3>
        </div>
        <SwitchRow
          id="notif-virement"
          label="Virement effectue"
          description="Confirmation quand un virement est envoye"
          checked={notifVirement}
          onChange={setNotifVirement}
        />
        <div className="border-b border-border" />
        <SwitchRow
          id="notif-solde"
          label="Solde disponible"
          description="Notification quand votre solde atteint le seuil minimum"
          checked={notifSolde}
          onChange={setNotifSolde}
        />
      </div>

      {/* Marketing */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-1 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Info className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Marketing</h3>
        </div>
        <SwitchRow
          id="notif-conseils"
          label="Conseils pour votre profil"
          description="Suggestions pour ameliorer votre visibilite"
          checked={notifConseils}
          onChange={setNotifConseils}
        />
        <div className="border-b border-border" />
        <SwitchRow
          id="notif-nouveautes"
          label="Nouveautes LocBeaute"
          description="Informations sur les nouvelles fonctionnalites"
          checked={notifNouveautes}
          onChange={setNotifNouveautes}
        />
      </div>

      {/* Ne pas deranger */}
      <div className="rounded-xl border border-border bg-card p-6 mb-4">
        <SwitchRow
          id="do-not-disturb"
          label="Ne pas deranger (22h - 8h)"
          description="Aucune notification entre 22h et 8h - les alertes urgentes restent actives"
          checked={doNotDisturb}
          onChange={setDoNotDisturb}
        />
      </div>

      <div className="flex items-center gap-3">
        <SaveButton onClick={handleSave} />
        {saved && (
          <span className="text-sm text-green-600 flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4" /> Enregistre !
          </span>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Onglet Securite
// ---------------------------------------------------------------------------

function passwordStrength(pwd: string): { level: 'weak' | 'medium' | 'strong'; label: string } {
  if (pwd.length === 0) return { level: 'weak', label: '' };
  const hasUpper = /[A-Z]/.test(pwd);
  const hasLower = /[a-z]/.test(pwd);
  const hasDigit = /[0-9]/.test(pwd);
  const hasSpecial = /[^A-Za-z0-9]/.test(pwd);
  const score = [pwd.length >= 8, hasUpper, hasLower, hasDigit, hasSpecial].filter(Boolean).length;
  if (score <= 2) return { level: 'weak', label: 'Faible' };
  if (score <= 4) return { level: 'medium', label: 'Moyen' };
  return { level: 'strong', label: 'Fort' };
}

const MOCK_SESSIONS = [
  { id: '1', appareil: 'Chrome - Windows 10', localisation: 'Paris, France', date: '01/04/2026 14:32' },
  { id: '2', appareil: 'Safari - iPhone 15', localisation: 'Lyon, France', date: '31/03/2026 09:15' },
];

function TabSecurite({ navigate }: { navigate: ReturnType<typeof useNavigate> }) {
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [sessions, setSessions] = useState(MOCK_SESSIONS);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [pwdSaved, setPwdSaved] = useState(false);
  const [pwdError, setPwdError] = useState('');

  const strength = passwordStrength(newPwd);

  const strengthColors = {
    weak: 'bg-red-500',
    medium: 'bg-yellow-500',
    strong: 'bg-green-500',
  };

  const strengthWidths = {
    weak: 'w-1/3',
    medium: 'w-2/3',
    strong: 'w-full',
  };

  const handleChangePwd = () => {
    setPwdError('');
    if (!currentPwd) { setPwdError('Mot de passe actuel requis.'); return; }
    if (newPwd.length < 8) { setPwdError('Le nouveau mot de passe doit faire au moins 8 caracteres.'); return; }
    if (newPwd !== confirmPwd) { setPwdError('Les mots de passe ne correspondent pas.'); return; }
    setPwdSaved(true);
    setCurrentPwd('');
    setNewPwd('');
    setConfirmPwd('');
    setTimeout(() => setPwdSaved(false), 3000);
  };

  const revokeSession = (id: string) => {
    setSessions((s) => s.filter((sess) => sess.id !== id));
  };

  const handleDeleteAccount = () => {
    if (deleteConfirmText !== 'SUPPRIMER') return;
    // En production : appel API de suppression puis redirection
    alert('Votre demande de suppression a ete envoyee. Vous allez etre redirige.');
    navigate('/');
  };

  return (
    <div className="space-y-4">
      {/* Mot de passe */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="w-5 h-5 text-primary" />
          <h2 className="font-semibold text-foreground">Changer le mot de passe</h2>
        </div>

        <Field label="Mot de passe actuel">
          <div className="relative">
            <Input
              type={showCurrent ? 'text' : 'password'}
              value={currentPwd}
              onChange={(e) => setCurrentPwd(e.target.value)}
              placeholder="Votre mot de passe actuel"
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowCurrent((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </Field>

        <Field label="Nouveau mot de passe">
          <div className="relative">
            <Input
              type={showNew ? 'text' : 'password'}
              value={newPwd}
              onChange={(e) => setNewPwd(e.target.value)}
              placeholder="Au moins 8 caracteres"
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowNew((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {newPwd.length > 0 && (
            <div className="flex items-center gap-3 mt-1">
              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${strengthColors[strength.level]} ${strengthWidths[strength.level]}`}
                />
              </div>
              <span
                className={`text-xs font-medium ${
                  strength.level === 'weak'
                    ? 'text-red-500'
                    : strength.level === 'medium'
                    ? 'text-yellow-600'
                    : 'text-green-600'
                }`}
              >
                {strength.label}
              </span>
            </div>
          )}
        </Field>

        <Field label="Confirmer le nouveau mot de passe">
          <div className="relative">
            <Input
              type={showConfirm ? 'text' : 'password'}
              value={confirmPwd}
              onChange={(e) => setConfirmPwd(e.target.value)}
              placeholder="Repetez le nouveau mot de passe"
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </Field>

        {pwdError && (
          <p className="text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {pwdError}
          </p>
        )}

        <div className="flex items-center gap-3">
          <button
            onClick={handleChangePwd}
            className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-[#8B6914] to-[#C9A84C] hover:from-[#7A5C12] hover:to-[#B8943E] transition-all"
          >
            <Shield className="w-4 h-4" />
            Mettre a jour
          </button>
          {pwdSaved && (
            <span className="text-sm text-green-600 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> Mot de passe mis a jour !
            </span>
          )}
        </div>
      </div>

      {/* 2FA */}
      <div className="rounded-xl border border-border bg-card p-5 flex items-start gap-3 mb-4">
        <Shield className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-foreground">
            Authentification a 2 facteurs
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Renforcez la securite de votre compte avec un code supplementaire a chaque connexion.
          </p>
          <span className="inline-block mt-2 px-2 py-0.5 rounded-full text-xs bg-muted text-muted-foreground">
            Bientot disponible
          </span>
        </div>
      </div>

      {/* Sessions */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-3 mb-4">
        <h2 className="font-semibold text-foreground">Sessions actives</h2>
        {sessions.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune session active.</p>
        ) : (
          sessions.map((sess) => (
            <div
              key={sess.id}
              className="flex items-start justify-between gap-4 py-3 border-b border-border last:border-0"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{sess.appareil}</p>
                <p className="text-xs text-muted-foreground">{sess.localisation} - {sess.date}</p>
              </div>
              <button
                onClick={() => revokeSession(sess.id)}
                className="text-xs text-red-600 hover:underline shrink-0"
              >
                Revoquer
              </button>
            </div>
          ))
        )}
      </div>

      {/* Suppression compte */}
      <div className="rounded-xl border border-red-200 bg-card p-6 mb-4">
        <h2 className="font-semibold text-red-700 dark:text-red-400 mb-2">Zone dangereuse</h2>
        <p className="text-sm text-muted-foreground mb-4">
          La suppression de votre compte est definitive. Toutes vos donnees, prestations et avis seront effaces.
        </p>
        <button
          onClick={() => setShowDeleteDialog(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors"
        >
          <AlertCircle className="w-4 h-4" />
          Supprimer le compte
        </button>
      </div>

      {/* AlertDialog suppression */}
      {showDeleteDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="w-full max-w-md rounded-2xl bg-background border border-border p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-red-600 shrink-0" />
              <h3 className="text-lg font-semibold text-foreground">Confirmer la suppression</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Cette action est <strong>irreversible</strong>. Votre compte, vos prestations, vos avis et toutes vos donnees seront definitivement supprimes.
            </p>
            <p className="text-sm text-foreground font-medium">
              Tapez <code className="px-1 py-0.5 rounded bg-muted text-red-600 font-mono text-xs">SUPPRIMER</code> pour confirmer :
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="SUPPRIMER"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setShowDeleteDialog(false); setDeleteConfirmText(''); }}
                className="px-4 py-2 rounded-lg text-sm font-medium border border-border text-foreground hover:bg-muted transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== 'SUPPRIMER'}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Supprimer definitivement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
