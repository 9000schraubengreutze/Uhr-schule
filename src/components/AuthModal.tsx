import React, { useState } from 'react';
import {
  X,
  Lock,
  ShieldCheck,
  LogOut,
  Mail,
  KeyRound,
  AlertCircle,
  Loader2,
  Crown,
  Sparkles,
} from 'lucide-react';
import { useAuth, APP_OWNER_EMAIL } from '../context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const {
    user,
    profile,
    isOwner,
    isAdmin,
    loginWithGoogle,
    loginWithEmail,
    registerWithEmail,
    logout,
  } = useAuth();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    setErrorMsg(null);
    setIsLoading(true);
    try {
      await loginWithGoogle();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setErrorMsg('Google-Anmeldung fehlgeschlagen: ' + (err.message || 'Unbekannter Fehler'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Bitte E-Mail-Adresse und Passwort eingeben.');
      return;
    }

    setErrorMsg(null);
    setIsLoading(true);

    try {
      if (mode === 'login') {
        await loginWithEmail(email, password);
      } else {
        await registerWithEmail(email, password);
      }
      if (onSuccess) onSuccess();
    } catch (err: any) {
      let friendly = 'Anmeldung fehlgeschlagen.';
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        friendly = 'Ungültige Anmeldedaten. Bitte überprüfe deine E-Mail und dein Passwort.';
      } else if (err.code === 'auth/user-not-found') {
        friendly = 'Kein Konto mit dieser E-Mail-Adresse gefunden.';
      } else if (err.code === 'auth/email-already-in-use') {
        friendly = 'Diese E-Mail-Adresse wird bereits verwendet.';
      } else if (err.code === 'auth/weak-password') {
        friendly = 'Das Passwort muss mindestens 6 Zeichen lang sein.';
      } else if (err.message) {
        friendly = err.message;
      }
      setErrorMsg(friendly);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      id="auth-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="auth-modal-content"
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl relative overflow-hidden space-y-5"
      >
        {/* Glow Header Accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
          aria-label="Schließen"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Badge & Title */}
        <div className="text-center space-y-2 pt-2">
          <div className="inline-flex p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 shadow-inner">
            {isOwner ? (
              <Crown className="w-7 h-7 text-amber-400 animate-bounce" />
            ) : isAdmin ? (
              <ShieldCheck className="w-7 h-7 text-emerald-400" />
            ) : (
              <Lock className="w-7 h-7 text-blue-400" />
            )}
          </div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">
            {isOwner
              ? 'Inhaber-Zugriff aktiv'
              : isAdmin
              ? 'Administrator-Zugriff aktiv'
              : 'Admin- & Inhaber-Anmeldung'}
          </h2>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            {user
              ? 'Dein Benutzerkonto ist derzeit angemeldet.'
              : 'Pausen-Spiele erfordern ein Konto mit Inhaber- (Owner) oder Admin-Berechtigung.'}
          </p>
        </div>

        {/* Case 1: User is already logged in */}
        {user ? (
          <div className="space-y-4 pt-2">
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Angemeldet als:</span>
                <span className="font-semibold text-slate-200 truncate max-w-[200px]">
                  {user.email}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Rolle / Status:</span>
                {isOwner ? (
                  <span className="inline-flex items-center gap-1 font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30">
                    <Crown className="w-3.5 h-3.5" /> App-Owner (Inhaber)
                  </span>
                ) : isAdmin ? (
                  <span className="inline-flex items-center gap-1 font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                    <ShieldCheck className="w-3.5 h-3.5" /> Administrator
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 font-medium text-slate-300 bg-slate-800 px-2 py-0.5 rounded-full">
                    Gast / Standard-Benutzer
                  </span>
                )}
              </div>
            </div>

            {/* Access status explanation */}
            {isOwner || isAdmin ? (
              <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-800/50 text-emerald-300 text-xs flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>Voller Zugriff gewährt: Du kannst alle Spiele uneingeschränkt spielen.</span>
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-800/50 text-amber-300 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                <span>
                  Dein Konto besitzt keine Inhaber-Rechte. Bitte melde dich mit der Inhaber-E-Mail ({APP_OWNER_EMAIL}) oder einem Admin-Konto an.
                </span>
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold transition-all cursor-pointer"
              >
                Schließen
              </button>
              <button
                type="button"
                onClick={async () => {
                  await logout();
                }}
                className="py-2.5 px-4 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Abmelden</span>
              </button>
            </div>
          </div>
        ) : (
          /* Case 2: User is NOT logged in */
          <div className="space-y-4 pt-1">
            {/* Google One-Click Login */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-2xl bg-white hover:bg-slate-100 active:scale-[0.98] text-slate-900 font-semibold text-xs flex items-center justify-center gap-2.5 shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>Mit Google anmelden</span>
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 text-slate-500 text-[11px]">
              <div className="flex-1 h-px bg-slate-800" />
              <span>Oder mit E-Mail & Passwort</span>
              <div className="flex-1 h-px bg-slate-800" />
            </div>

            {/* Error banner */}
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleEmailSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-300 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" /> E-Mail-Adresse
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-300 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-slate-400" /> Passwort
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50 mt-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Bitte warten...</span>
                  </>
                ) : mode === 'login' ? (
                  <span>Anmelden</span>
                ) : (
                  <span>Konto erstellen</span>
                )}
              </button>
            </form>

            {/* Mode switch */}
            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => {
                  setMode(mode === 'login' ? 'register' : 'login');
                  setErrorMsg(null);
                }}
                className="text-[11px] text-slate-400 hover:text-blue-400 transition-colors underline cursor-pointer"
              >
                {mode === 'login'
                  ? 'Noch kein Konto? Hier neu registrieren'
                  : 'Bereits registriert? Hier anmelden'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
