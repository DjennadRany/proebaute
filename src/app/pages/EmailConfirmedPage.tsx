import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Sparkles, MapPin } from 'lucide-react';

export function EmailConfirmedPage() {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(4);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((n) => {
        if (n <= 1) {
          clearInterval(timer);
          navigate('/map', { replace: true });
          return 0;
        }
        return n - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex flex-col items-center justify-center px-6">

      {/* Logo */}
      <img
        src="/asset/locbeaute_logo.png"
        alt="LocBeauté"
        className="w-28 mb-8 drop-shadow"
      />

      {/* Cercle animé */}
      <div className="relative mb-8">
        <div className="w-28 h-28 rounded-full bg-gradient-to-br from-pink-400 to-pink-600 flex items-center justify-center shadow-xl shadow-pink-200">
          <Sparkles className="w-12 h-12 text-white" strokeWidth={1.5} />
        </div>
        <div className="absolute inset-0 rounded-full bg-pink-400 opacity-20 animate-ping" />
      </div>

      {/* Titre */}
      <h1 className="text-3xl font-bold text-gray-900 text-center mb-3">
        Email confirmé ! 🎉
      </h1>
      <p className="text-gray-500 text-center text-base leading-relaxed mb-8 max-w-xs">
        Votre compte <span className="text-pink-500 font-semibold">LocBeauté</span> est maintenant actif.
        Bienvenue sur la plateforme beauté !
      </p>

      {/* Redirection */}
      <div className="flex flex-col items-center gap-3">
        <div className="flex items-center gap-2 bg-white border border-pink-100 rounded-full px-5 py-3 shadow-sm">
          <MapPin className="w-4 h-4 text-pink-500" />
          <span className="text-sm text-gray-600">
            Redirection vers la carte dans{' '}
            <span className="font-bold text-pink-500">{countdown}s</span>
          </span>
        </div>

        <button
          onClick={() => navigate('/map', { replace: true })}
          className="text-sm text-pink-500 underline underline-offset-2 mt-1"
        >
          Accéder maintenant
        </button>
      </div>

    </div>
  );
}
