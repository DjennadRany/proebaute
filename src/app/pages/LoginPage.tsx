import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import {
  ArrowLeft,
  Briefcase,
  Building2,
  Car,
  FileText,
  MapPin,
  ShieldCheck,
  Sparkles,
  User,
  type LucideIcon,
} from 'lucide-react';
import { BRANDED_LOGO_SRC } from '../constants/branding';
import { useAuth } from '../context/AuthContext';
import { trackSignup, trackLogin, trackFunnelStep } from '../lib/gtag';
import {
  requestPasswordReset,
  signUpClientAccount,
  signUpProfessionalAccount,
  updateAccountPassword,
  type ApiUser,
} from '../api/client';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';

const STORAGE_KEY = 'beautyhub_user';

type ClientSignupForm = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  birthDate: string;
  city: string;
  postalCode: string;
  streetAddress: string;
  bookingPreference: 'home' | 'salon' | 'both';
  beautyFrequency: 'occasionnel' | 'regulier' | 'evenement';
  acceptsHomeVisit: boolean;
  notes: string;
  password: string;
  confirmPassword: string;
  acceptsTerms: boolean;
};

type ProfessionalSignupForm = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  companyName: string;
  siren: string;
  specialty: string;
  bio: string;
  streetAddress: string;
  city: string;
  postalCode: string;
  serviceMode: 'home' | 'salon' | 'both';
  travelRadiusKm: string;
  notes: string;
  password: string;
  confirmPassword: string;
  acceptsTerms: boolean;
};

type StepMeta = {
  title: string;
  caption: string;
  icon: LucideIcon;
};

const clientSteps: StepMeta[] = [
  { title: 'Profil', caption: 'Vos informations personnelles', icon: User },
  { title: 'Adresse', caption: 'Votre zone principale', icon: MapPin },
  { title: 'Préférences', caption: 'Vos habitudes beauté', icon: Sparkles },
  { title: 'Sécurité', caption: 'Validation du compte', icon: ShieldCheck },
];

const professionalSteps: StepMeta[] = [
  { title: 'Responsable', caption: 'Identité du compte', icon: User },
  { title: 'Entreprise', caption: 'SIREN et activité', icon: Building2 },
  { title: 'Prestations', caption: "Mode d'intervention", icon: Car },
  { title: 'Adresse', caption: 'Localisation professionnelle', icon: MapPin },
  { title: 'Sécurité', caption: 'Accès et validation', icon: ShieldCheck },
];

function Stepper({
  steps,
  currentStep,
  onStepClick,
}: {
  steps: StepMeta[];
  currentStep: number;
  onStepClick: (index: number) => void;
}) {
  return (
    <>
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 sm:hidden">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
            {(() => {
              const Icon = steps[currentStep].icon;
              return <Icon className="h-4 w-4" />;
            })()}
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Etape {currentStep + 1} / {steps.length}
            </p>
            <p className="text-sm font-semibold text-foreground">{steps[currentStep].title}</p>
          </div>
        </div>
        <div className="h-2 rounded-full bg-muted">
          <div
            className="h-2 rounded-full bg-primary transition-all"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="hidden gap-3 sm:grid sm:grid-cols-2 xl:grid-cols-4">
      {steps.map((step, index) => {
        const Icon = step.icon;
        const isActive = index === currentStep;
        const isCompleted = index < currentStep;

        return (
          <button
            key={step.title}
            type="button"
            onClick={() => index <= currentStep && onStepClick(index)}
            className={`rounded-2xl border px-4 py-4 text-left transition ${
              isActive
                ? 'border-primary bg-primary/8 shadow-sm'
                : isCompleted
                ? 'border-primary/30 bg-background hover:border-primary/60'
                : 'border-border bg-card'
            }`}
          >
            <div className="mb-3 flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full ${
                  isActive || isCompleted ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  Etape {index + 1}
                </p>
                <p className="text-sm font-semibold text-foreground">{step.title}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">{step.caption}</p>
          </button>
        );
      })}
      </div>
    </>
  );
}

export function LoginPage() {
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [signupError, setSignupError] = useState('');
  const [signupSuccess, setSignupSuccess] = useState('');
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [resetPassword, setResetPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [clientStep, setClientStep] = useState(0);
  const [proStep, setProStep] = useState(0);
  const [signupForm, setSignupForm] = useState<ClientSignupForm>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    birthDate: '',
    city: '',
    postalCode: '',
    streetAddress: '',
    bookingPreference: 'home',
    beautyFrequency: 'occasionnel',
    acceptsHomeVisit: true,
    notes: '',
    password: '',
    confirmPassword: '',
    acceptsTerms: false,
  });
  const [proSignupForm, setProSignupForm] = useState<ProfessionalSignupForm>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    companyName: '',
    siren: '',
    specialty: 'Coiffure & beauté',
    bio: '',
    streetAddress: '',
    city: '',
    postalCode: '',
    serviceMode: 'both',
    travelRadiusKm: '20',
    notes: '',
    password: '',
    confirmPassword: '',
    acceptsTerms: false,
  });

  const modeParam = searchParams.get('mode');
  const mode =
    modeParam === 'signup' || modeParam === 'forgot' || modeParam === 'reset'
      ? modeParam
      : 'login';
  const role = searchParams.get('role') === 'pro' ? 'pro' : 'client';
  const isClientSignup = mode === 'signup' && role === 'client';
  const isProSignup = mode === 'signup' && role === 'pro';
  const isForgotPassword = mode === 'forgot';
  const isResetPassword = mode === 'reset';
  const title = useMemo(() => {
    if (isClientSignup) return 'Créer mon compte cliente';
    if (isProSignup) return 'Créer mon compte pro beauté';
    if (isForgotPassword) return 'Mot de passe oublié';
    if (isResetPassword) return 'Choisissez un nouveau mot de passe';
    return 'Connectez-vous à votre compte';
  }, [isClientSignup, isForgotPassword, isProSignup, isResetPassword]);

  const setField = <K extends keyof ClientSignupForm>(key: K, value: ClientSignupForm[K]) => {
    setSignupForm((prev) => ({ ...prev, [key]: value }));
  };

  const setProField = <K extends keyof ProfessionalSignupForm>(
    key: K,
    value: ProfessionalSignupForm[K],
  ) => {
    setProSignupForm((prev) => ({ ...prev, [key]: value }));
  };

  const persistUser = (apiUser: ApiUser) => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        _id: apiUser._id,
        role: apiUser.role,
        firstName: apiUser.firstName,
        lastName: apiUser.lastName,
        email: apiUser.email,
        phone: apiUser.phone,
      }),
    );
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.location.hash.includes('type=recovery') && mode !== 'reset') {
      setSearchParams({ mode: 'reset', role: 'client' });
    }
  }, [mode, setSearchParams, searchParams]);

  useEffect(() => {
    setSignupError('');
    setSignupSuccess('');
    setClientStep(0);
    setProStep(0);
  }, [mode, role]);

  const validateClientStep = (step: number) => {
    switch (step) {
      case 0:
        if (!signupForm.firstName.trim() || !signupForm.lastName.trim() || !signupForm.email.trim()) {
          return 'Renseignez votre prénom, nom et email pour continuer.';
        }
        return '';
      case 1:
        if (!signupForm.streetAddress.trim() || !signupForm.city.trim() || !signupForm.postalCode.trim()) {
          return "Complétez votre adresse principale avant de passer à l'étape suivante.";
        }
        return '';
      case 2:
        return '';
      case 3:
        if (signupForm.password.length < 8) {
          return 'Le mot de passe doit contenir au moins 8 caractères.';
        }
        if (signupForm.password !== signupForm.confirmPassword) {
          return 'Les mots de passe ne correspondent pas.';
        }
        if (!signupForm.acceptsTerms) {
          return 'Vous devez accepter les conditions pour créer votre compte.';
        }
        return '';
      default:
        return '';
    }
  };

  const validateProStep = (step: number) => {
    switch (step) {
      case 0:
        if (!proSignupForm.firstName.trim() || !proSignupForm.lastName.trim() || !proSignupForm.email.trim()) {
          return 'Renseignez le responsable du compte avant de continuer.';
        }
        return '';
      case 1:
        if (!proSignupForm.companyName.trim() || !proSignupForm.specialty.trim()) {
          return 'Complétez les informations de votre entreprise.';
        }
        if (!/^\d{9}$/.test(proSignupForm.siren.trim())) {
          return 'Le SIREN doit contenir exactement 9 chiffres.';
        }
        return '';
      case 2:
        if (!proSignupForm.bio.trim()) {
          return 'Décrivez brièvement votre activité pour continuer.';
        }
        return '';
      case 3:
        if (!proSignupForm.streetAddress.trim() || !proSignupForm.city.trim() || !proSignupForm.postalCode.trim()) {
          return "Completez l'adresse professionnelle avant de passer a l'etape suivante.";
        }
        return '';
      case 4:
        if (proSignupForm.password.length < 8) {
          return 'Le mot de passe doit contenir au moins 8 caractères.';
        }
        if (proSignupForm.password !== proSignupForm.confirmPassword) {
          return 'Les mots de passe ne correspondent pas.';
        }
        if (!proSignupForm.acceptsTerms) {
          return 'Vous devez accepter les conditions pour créer votre compte professionnel.';
        }
        return '';
      default:
        return '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const loggedIn = await login(email.trim().toLowerCase(), password);
      navigate(
        loggedIn.role === 'professional' ? '/pro/dashboard' : '/map',
        { replace: true },
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Identifiants incorrects');
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess('');
    setIsSendingReset(true);

    try {
      await requestPasswordReset(forgotEmail);
      setForgotSuccess(
        "Si un compte existe avec cet email, un lien de réinitialisation vient d'être envoyé.",
      );
    } catch (err) {
      setForgotError(
        err instanceof Error
          ? err.message
          : "Impossible d'envoyer le mail de réinitialisation.",
      );
    } finally {
      setIsSendingReset(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    setResetSuccess('');

    if (resetPassword.length < 8) {
      setResetError('Le nouveau mot de passe doit contenir au moins 8 caractères.');
      return;
    }

    if (resetPassword !== resetConfirmPassword) {
      setResetError('Les mots de passe ne correspondent pas.');
      return;
    }

    setIsUpdatingPassword(true);

    try {
      await updateAccountPassword(resetPassword);
      setResetSuccess('Votre mot de passe a été mis à jour. Vous pouvez maintenant vous connecter.');
      setResetPassword('');
      setResetConfirmPassword('');
      if (typeof window !== 'undefined') {
        window.history.replaceState({}, document.title, '/login');
      }
      setSearchParams({ role: 'client' });
    } catch (err) {
      setResetError(
        err instanceof Error
          ? err.message
          : 'Impossible de modifier le mot de passe pour le moment.',
      );
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleClientSignup = async () => {
    const validationError = validateClientStep(clientSteps.length - 1);
    if (validationError) {
      setSignupError(validationError);
      return;
    }

    setSignupError('');
    setSignupSuccess('');
    setIsSigningUp(true);

    try {
      const result = await signUpClientAccount({
        firstName: signupForm.firstName,
        lastName: signupForm.lastName,
        email: signupForm.email,
        phone: signupForm.phone,
        password: signupForm.password,
        birthDate: signupForm.birthDate || undefined,
        city: signupForm.city,
        postalCode: signupForm.postalCode,
        streetAddress: signupForm.streetAddress,
        bookingPreference: signupForm.bookingPreference,
        beautyFrequency: signupForm.beautyFrequency,
        acceptsHomeVisit: signupForm.acceptsHomeVisit,
        notes: signupForm.notes,
      });

      if (result.user) {
        // Track successful signup
        trackSignup('client', 'email');
        trackFunnelStep('signup_complete', 'client');

        persistUser(result.user);
        navigate(result.user.role === 'professional' ? '/pro/dashboard' : '/map', { replace: true });
        return;
      }

      // Track signup start even if email confirmation required
      trackFunnelStep('signup_start', 'client');

      setSignupSuccess(
        result.requiresEmailConfirmation
          ? 'Compte créé. Vérifiez votre boîte mail pour confirmer votre inscription avant de vous connecter.'
          : 'Compte créé avec succès. Vous pouvez maintenant vous connecter.',
      );
      setSearchParams({ role: 'client' });
    } catch (err) {
      setSignupError(
        err instanceof Error
          ? err.message
          : 'Impossible de créer votre compte pour le moment.',
      );
    } finally {
      setIsSigningUp(false);
    }
  };

  const handleProfessionalSignup = async () => {
    const validationError = validateProStep(professionalSteps.length - 1);
    if (validationError) {
      setSignupError(validationError);
      return;
    }

    setSignupError('');
    setSignupSuccess('');
    setIsSigningUp(true);

    try {
      const result = await signUpProfessionalAccount({
        firstName: proSignupForm.firstName,
        lastName: proSignupForm.lastName,
        email: proSignupForm.email,
        phone: proSignupForm.phone,
        password: proSignupForm.password,
        companyName: proSignupForm.companyName,
        siren: proSignupForm.siren,
        specialty: proSignupForm.specialty,
        bio: proSignupForm.bio,
        streetAddress: proSignupForm.streetAddress,
        city: proSignupForm.city,
        postalCode: proSignupForm.postalCode,
        serviceMode: proSignupForm.serviceMode,
        travelRadiusKm: Number(proSignupForm.travelRadiusKm || 0),
        notes: proSignupForm.notes,
      });

      if (result.user) {
        // Track successful professional signup
        trackSignup('professional', 'email');
        trackFunnelStep('signup_complete', 'professional');

        persistUser(result.user);
        navigate('/pro/dashboard', { replace: true });
        return;
      }

      // Track signup start even if email confirmation required
      trackFunnelStep('signup_start', 'professional');

      setSignupSuccess(
        result.requiresEmailConfirmation
          ? "Compte pro créé. Vérifiez votre boîte mail pour confirmer l'email, puis connectez-vous : votre fiche (users / professionals) sera synchronisée automatiquement au premier login."
          : 'Compte pro créé avec succès. Vous pouvez maintenant vous connecter.',
      );
      setSearchParams({ role: 'pro' });
    } catch (err) {
      setSignupError(
        err instanceof Error
          ? err.message
          : 'Impossible de créer votre compte professionnel pour le moment.',
      );
    } finally {
      setIsSigningUp(false);
    }
  };

  const handleClientNext = () => {
    const validationError = validateClientStep(clientStep);
    if (validationError) {
      setSignupError(validationError);
      return;
    }
    setSignupError('');
    setClientStep((prev) => Math.min(prev + 1, clientSteps.length - 1));
  };

  const handleProNext = () => {
    const validationError = validateProStep(proStep);
    if (validationError) {
      setSignupError(validationError);
      return;
    }
    setSignupError('');
    setProStep((prev) => Math.min(prev + 1, professionalSteps.length - 1));
  };

  const renderClientStep = () => {
    switch (clientStep) {
      case 0:
        return (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">Prénom</Label>
              <Input id="firstName" value={signupForm.firstName} onChange={(e) => setField('firstName', e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Nom</Label>
              <Input id="lastName" value={signupForm.lastName} onChange={(e) => setField('lastName', e.target.value)} required />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="signupEmail">Email</Label>
              <Input id="signupEmail" type="email" value={signupForm.email} onChange={(e) => setField('email', e.target.value)} autoComplete="email" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone</Label>
              <Input id="phone" type="tel" value={signupForm.phone} onChange={(e) => setField('phone', e.target.value)} placeholder="06 12 34 56 78" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="birthDate">Date de naissance</Label>
              <Input id="birthDate" type="date" value={signupForm.birthDate} onChange={(e) => setField('birthDate', e.target.value)} />
            </div>
          </div>
        );
      case 1:
        return (
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="streetAddress">Adresse</Label>
              <Input id="streetAddress" value={signupForm.streetAddress} onChange={(e) => setField('streetAddress', e.target.value)} placeholder="12 rue de la Beauté" required />
            </div>
            <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
              <div className="space-y-2">
                <Label htmlFor="city">Ville</Label>
                <Input id="city" value={signupForm.city} onChange={(e) => setField('city', e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="postalCode">Code postal</Label>
                <Input id="postalCode" value={signupForm.postalCode} onChange={(e) => setField('postalCode', e.target.value)} required />
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-5">
            <div className="space-y-3">
              <Label>Je préfère réserver</Label>
              <RadioGroup
                value={signupForm.bookingPreference}
                onValueChange={(value) => setField('bookingPreference', value as ClientSignupForm['bookingPreference'])}
              >
                <label className="flex items-center gap-3 rounded-xl border border-border px-3 py-3">
                  <RadioGroupItem value="home" id="booking-home" />
                  <span>Des prestations à domicile</span>
                </label>
                <label className="flex items-center gap-3 rounded-xl border border-border px-3 py-3">
                  <RadioGroupItem value="salon" id="booking-salon" />
                  <span>Me déplacer en salon / institut</span>
                </label>
                <label className="flex items-center gap-3 rounded-xl border border-border px-3 py-3">
                  <RadioGroupItem value="both" id="booking-both" />
                  <span>Les deux selon le service</span>
                </label>
              </RadioGroup>
            </div>
            <div className="space-y-3">
              <Label>À quelle fréquence réservez-vous ?</Label>
              <RadioGroup
                value={signupForm.beautyFrequency}
                onValueChange={(value) => setField('beautyFrequency', value as ClientSignupForm['beautyFrequency'])}
              >
                <label className="flex items-center gap-3 rounded-xl border border-border px-3 py-3">
                  <RadioGroupItem value="occasionnel" id="freq-occasionnel" />
                  <span>Occasionnellement</span>
                </label>
                <label className="flex items-center gap-3 rounded-xl border border-border px-3 py-3">
                  <RadioGroupItem value="regulier" id="freq-regulier" />
                  <span>Régulièrement</span>
                </label>
                <label className="flex items-center gap-3 rounded-xl border border-border px-3 py-3">
                  <RadioGroupItem value="evenement" id="freq-evenement" />
                  <span>Pour des événements / occasions spéciales</span>
                </label>
              </RadioGroup>
            </div>
            <label className="flex items-start gap-3 rounded-xl border border-border px-3 py-3">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 rounded border border-border accent-primary"
                checked={signupForm.acceptsHomeVisit}
                onChange={(e) => setField('acceptsHomeVisit', e.target.checked)}
              />
              <span className="text-sm text-foreground">
                J'accepte d'être contactée pour des prestations à domicile quand le professionnel se déplace.
              </span>
            </label>
            <div className="space-y-2">
              <Label htmlFor="notes">Informations utiles</Label>
              <Textarea
                id="notes"
                value={signupForm.notes}
                onChange={(e) => setField('notes', e.target.value)}
                placeholder="Ex: je privilégie les rendez-vous en soirée, coiffure et manucure le week-end..."
              />
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="signupPassword">Mot de passe</Label>
                <Input id="signupPassword" type="password" value={signupForm.password} onChange={(e) => setField('password', e.target.value)} autoComplete="new-password" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                <Input id="confirmPassword" type="password" value={signupForm.confirmPassword} onChange={(e) => setField('confirmPassword', e.target.value)} autoComplete="new-password" required />
              </div>
            </div>
            <label className="flex items-start gap-3 rounded-xl border border-border px-3 py-3">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 rounded border border-border accent-primary"
                checked={signupForm.acceptsTerms}
                onChange={(e) => setField('acceptsTerms', e.target.checked)}
              />
              <span className="text-sm text-foreground">
                Je confirme que mes informations sont exactes et j'accepte la création de mon compte cliente LocBeauté.
              </span>
            </label>
          </div>
        );
      default:
        return null;
    }
  };

  const renderProfessionalStep = () => {
    switch (proStep) {
      case 0:
        return (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="proFirstName">Prénom</Label>
              <Input id="proFirstName" value={proSignupForm.firstName} onChange={(e) => setProField('firstName', e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="proLastName">Nom</Label>
              <Input id="proLastName" value={proSignupForm.lastName} onChange={(e) => setProField('lastName', e.target.value)} required />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="proEmail">Email professionnel</Label>
              <Input id="proEmail" type="email" value={proSignupForm.email} onChange={(e) => setProField('email', e.target.value)} required />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="proPhone">Téléphone</Label>
              <Input id="proPhone" type="tel" value={proSignupForm.phone} onChange={(e) => setProField('phone', e.target.value)} placeholder="06 12 34 56 78" />
            </div>
          </div>
        );
      case 1:
        return (
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Nom de l'entreprise / salon</Label>
              <Input id="companyName" value={proSignupForm.companyName} onChange={(e) => setProField('companyName', e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="siren">SIREN</Label>
              <Input
                id="siren"
                inputMode="numeric"
                maxLength={9}
                value={proSignupForm.siren}
                onChange={(e) => setProField('siren', e.target.value.replace(/\D/g, '').slice(0, 9))}
                placeholder="123456789"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="specialty">Spécialité principale</Label>
              <Input id="specialty" value={proSignupForm.specialty} onChange={(e) => setProField('specialty', e.target.value)} placeholder="Coiffure, barbe, esthétique, ongles..." required />
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-5">
            <div className="space-y-3">
              <Label>Mode d'intervention</Label>
              <RadioGroup
                value={proSignupForm.serviceMode}
                onValueChange={(value) => setProField('serviceMode', value as ProfessionalSignupForm['serviceMode'])}
              >
                <label className="flex items-center gap-3 rounded-xl border border-border px-3 py-3">
                  <RadioGroupItem value="home" id="pro-mode-home" />
                  <span>Je me déplace uniquement à domicile</span>
                </label>
                <label className="flex items-center gap-3 rounded-xl border border-border px-3 py-3">
                  <RadioGroupItem value="salon" id="pro-mode-salon" />
                  <span>Je reçois uniquement en salon / institut</span>
                </label>
                <label className="flex items-center gap-3 rounded-xl border border-border px-3 py-3">
                  <RadioGroupItem value="both" id="pro-mode-both" />
                  <span>Je propose les deux</span>
                </label>
              </RadioGroup>
            </div>
            <div className="space-y-2">
              <Label htmlFor="travelRadiusKm">Rayon de déplacement (km)</Label>
              <Input
                id="travelRadiusKm"
                type="number"
                min={0}
                max={100}
                value={proSignupForm.travelRadiusKm}
                onChange={(e) => setProField('travelRadiusKm', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="proBio">Présentation de votre activité</Label>
              <Textarea
                id="proBio"
                value={proSignupForm.bio}
                onChange={(e) => setProField('bio', e.target.value)}
                placeholder="Présentez votre expertise, vos prestations, vos types de clientèle et votre différence."
              />
            </div>
          </div>
        );
      case 3:
        return (
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="proStreetAddress">Adresse professionnelle</Label>
              <Input id="proStreetAddress" value={proSignupForm.streetAddress} onChange={(e) => setProField('streetAddress', e.target.value)} placeholder="45 rue de la Beauté" required />
            </div>
            <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
              <div className="space-y-2">
                <Label htmlFor="proCity">Ville</Label>
                <Input id="proCity" value={proSignupForm.city} onChange={(e) => setProField('city', e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="proPostalCode">Code postal</Label>
                <Input id="proPostalCode" value={proSignupForm.postalCode} onChange={(e) => setProField('postalCode', e.target.value)} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="proNotes">Informations complémentaires</Label>
              <Textarea
                id="proNotes"
                value={proSignupForm.notes}
                onChange={(e) => setProField('notes', e.target.value)}
                placeholder="Ex: déplacements possibles le soir, matériel fourni, parking facile, prestations premium..."
              />
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="proPassword">Mot de passe</Label>
                <Input id="proPassword" type="password" value={proSignupForm.password} onChange={(e) => setProField('password', e.target.value)} autoComplete="new-password" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="proConfirmPassword">Confirmer le mot de passe</Label>
                <Input id="proConfirmPassword" type="password" value={proSignupForm.confirmPassword} onChange={(e) => setProField('confirmPassword', e.target.value)} autoComplete="new-password" required />
              </div>
            </div>
            <label className="flex items-start gap-3 rounded-xl border border-border px-3 py-3">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 rounded border border-border accent-primary"
                checked={proSignupForm.acceptsTerms}
                onChange={(e) => setProField('acceptsTerms', e.target.checked)}
              />
              <span className="text-sm text-foreground">
                Je confirme l'exactitude de mes informations professionnelles et j'accepte la création de mon compte pro beauté LocBeauté.
              </span>
            </label>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className={`w-full ${isClientSignup || isProSignup ? 'max-w-5xl' : 'max-w-sm'} space-y-8`}>
        <div className="flex flex-col items-center gap-3 text-center">
          <img
            src={BRANDED_LOGO_SRC}
            alt="Logo LocBeauté"
            className="h-20 w-auto object-contain"
          />
          <h1 className="text-2xl font-bold bg-gradient-to-r from-[#8B6914] via-[#C9A84C] to-[#F5D58B] bg-clip-text text-transparent">
            LocBeauté
          </h1>
          <p className="text-sm text-muted-foreground">{title}</p>
        </div>

        {isClientSignup ? (
          <div className="space-y-6">
            <Stepper steps={clientSteps} currentStep={clientStep} onStepClick={setClientStep} />
            {signupError && (
              <div className="text-sm text-red-600 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
                {signupError}
              </div>
            )}
            {signupSuccess && (
              <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                {signupSuccess}
              </div>
            )}
            <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
              <div className="mb-5 flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  {(() => {
                    const Icon = clientSteps[clientStep].icon;
                    return <Icon className="h-5 w-5" />;
                  })()}
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Etape {clientStep + 1} / {clientSteps.length}
                  </p>
                  <h2 className="text-xl font-semibold text-foreground">{clientSteps[clientStep].title}</h2>
                  <p className="text-sm text-muted-foreground">{clientSteps[clientStep].caption}</p>
                </div>
              </div>
              {renderClientStep()}
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Button
                type="button"
                variant="ghost"
                className="justify-start"
                onClick={() => {
                  if (clientStep === 0) setSearchParams({ role: 'client' });
                  else setClientStep((prev) => Math.max(prev - 1, 0));
                }}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {clientStep === 0 ? 'Retour à la connexion' : "Revenir à l'étape précédente"}
              </Button>
              {clientStep < clientSteps.length - 1 ? (
                <Button type="button" onClick={handleClientNext} className="sm:min-w-56">
                  Continuer
                </Button>
              ) : (
                <Button type="button" onClick={handleClientSignup} disabled={isSigningUp} className="sm:min-w-56">
                  {isSigningUp ? 'Création du compte...' : 'Créer mon compte cliente'}
                </Button>
              )}
            </div>
          </div>
        ) : isProSignup ? (
          <div className="space-y-6">
            <Stepper steps={professionalSteps} currentStep={proStep} onStepClick={setProStep} />
            {signupError && (
              <div className="text-sm text-red-600 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
                {signupError}
              </div>
            )}
            {signupSuccess && (
              <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                {signupSuccess}
              </div>
            )}
            <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
              <div className="mb-5 flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  {(() => {
                    const Icon = professionalSteps[proStep].icon;
                    return <Icon className="h-5 w-5" />;
                  })()}
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Etape {proStep + 1} / {professionalSteps.length}
                  </p>
                  <h2 className="text-xl font-semibold text-foreground">{professionalSteps[proStep].title}</h2>
                  <p className="text-sm text-muted-foreground">{professionalSteps[proStep].caption}</p>
                </div>
              </div>
              {renderProfessionalStep()}
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Button
                type="button"
                variant="ghost"
                className="justify-start"
                onClick={() => {
                  if (proStep === 0) setSearchParams({ role: 'pro' });
                  else setProStep((prev) => Math.max(prev - 1, 0));
                }}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {proStep === 0 ? 'Retour à la connexion' : "Revenir à l'étape précédente"}
              </Button>
              {proStep < professionalSteps.length - 1 ? (
                <Button type="button" onClick={handleProNext} className="sm:min-w-56">
                  Continuer
                </Button>
              ) : (
                <Button type="button" onClick={handleProfessionalSignup} disabled={isSigningUp} className="sm:min-w-56">
                  {isSigningUp ? 'Création du compte...' : 'Créer mon compte pro beauté'}
                </Button>
              )}
            </div>
          </div>
        ) : isForgotPassword ? (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            {forgotError && (
              <div className="text-sm text-red-600 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
                {forgotError}
              </div>
            )}
            {forgotSuccess && (
              <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                {forgotSuccess}
              </div>
            )}
            <div className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="forgotEmail">Email du compte</Label>
                <Input
                  id="forgotEmail"
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="digitaledevops@gmail.com"
                  required
                  autoComplete="email"
                />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={isSendingReset}>
              {isSendingReset ? 'Envoi du mail...' : 'Recevoir un lien de réinitialisation'}
            </Button>
            <Button type="button" variant="ghost" className="w-full" onClick={() => setSearchParams({ role: 'client' })}>
              Retour à la connexion
            </Button>
          </form>
        ) : isResetPassword ? (
          <form onSubmit={handleResetPassword} className="space-y-4">
            {resetError && (
              <div className="text-sm text-red-600 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
                {resetError}
              </div>
            )}
            {resetSuccess && (
              <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                {resetSuccess}
              </div>
            )}
            <div className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="resetPassword">Nouveau mot de passe</Label>
                <Input id="resetPassword" type="password" value={resetPassword} onChange={(e) => setResetPassword(e.target.value)} autoComplete="new-password" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="resetConfirmPassword">Confirmer le mot de passe</Label>
                <Input id="resetConfirmPassword" type="password" value={resetConfirmPassword} onChange={(e) => setResetConfirmPassword(e.target.value)} autoComplete="new-password" required />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={isUpdatingPassword}>
              {isUpdatingPassword ? 'Mise à jour...' : 'Mettre à jour mon mot de passe'}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="text-sm text-red-600 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
                {error}
              </div>
            )}
            <div className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                {role === 'pro' ? <Briefcase className="h-5 w-5" /> : <User className="h-5 w-5" />}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="votre@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value.trim().toLowerCase())}
                  required
                  autoComplete="email"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  inputMode="email"
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full"
                />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Connexion...' : role === 'pro' ? 'Se connecter en pro beauté' : 'Se connecter'}
            </Button>
            <button
              type="button"
              className="w-full text-sm text-primary hover:underline"
              onClick={() => setSearchParams({ mode: 'forgot', role })}
            >
              Mot de passe oublié ?
            </button>
          </form>
        )}

        <div className="space-y-3 text-xs text-center text-muted-foreground">
          <div className="pt-2 border-t border-border/60 space-y-1">
            <p className="font-medium text-foreground text-sm">Nouveau sur LocBeauté ?</p>
            <div className="flex flex-col gap-1">
              <button
                type="button"
                className="text-primary hover:underline"
                onClick={() => setSearchParams({ mode: 'signup', role: 'client' })}
              >
                Créer un compte cliente
              </button>
              <button
                type="button"
                className="text-primary hover:underline"
                onClick={() => setSearchParams({ mode: 'signup', role: 'pro' })}
              >
                Créer un compte pro beauté
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
