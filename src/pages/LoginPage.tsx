import { useState } from 'react';
import { AlertCircle, Loader2, LogIn, KeyRound } from 'lucide-react';
import { supabase } from '../lib/supabase';

type Mode = 'login' | 'signup';

export function LoginPage() {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
    setPassword('');
    setPasswordConfirm('');
  };

  const handleLogin = async () => {
    const { error: err } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (err) {
      const msg = err.message || '';
      throw new Error(
        msg.toLowerCase().includes('invalid')
          ? 'Email ou mot de passe incorrect.'
          : msg
      );
    }
  };

  const handleSignup = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (password.length < 8) {
      throw new Error('Mot de passe : 8 caractères minimum.');
    }
    if (password !== passwordConfirm) {
      throw new Error('Les deux mots de passe ne correspondent pas.');
    }

    // Vérification de pré-autorisation : un portal_users doit exister avec cet email
    // et auth_user_id NULL (sinon le compte est déjà créé OU l'email n'est pas autorisé)
    const { data: preauth, error: preErr } = await supabase
      .from('portal_users')
      .select('id, auth_user_id')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (preErr) throw new Error(preErr.message);
    if (!preauth) {
      throw new Error(
        'Cet email n\'est pas autorisé. Contactez MAPA Développement pour obtenir un accès.'
      );
    }
    if (preauth.auth_user_id) {
      throw new Error(
        'Un compte existe déjà pour cet email. Utilisez l\'onglet « Connexion ».'
      );
    }

    const { error: signUpErr } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
    });
    if (signUpErr) {
      const msg = signUpErr.message || '';
      if (msg.toLowerCase().includes('already')) {
        throw new Error(
          'Un compte existe déjà pour cet email. Utilisez l\'onglet « Connexion ».'
        );
      }
      throw new Error(msg);
    }
    // Le trigger Postgres lie auth.users.id à portal_users automatiquement.
    // onAuthStateChange remontera la session, App bascule sur ProjectPage.
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === 'login') await handleLogin();
      else await handleSignup();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-full flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          background:
            'radial-gradient(ellipse at 50% 30%, rgba(175,112,55,0.18) 0%, transparent 60%)',
        }}
      />

      <div className="relative w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <img src="/logo.png" alt="MAPA Développement" className="h-16 w-auto mb-6 opacity-95" />
          <div className="text-[10px] font-mono uppercase tracking-[0.4em] text-ws-accent mb-2">
            Espace client
          </div>
          <h1 className="font-serif text-3xl font-light text-ws-paper tracking-wide text-center">
            Suivi de projet
          </h1>
          <p className="text-sm text-ws-mist mt-3 text-center max-w-xs">
            {mode === 'login'
              ? 'Connectez-vous pour consulter l\'avancement de votre projet.'
              : 'Première connexion : définissez le mot de passe qui sécurisera votre espace.'}
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-ws-line bg-ws-panel/90 backdrop-blur-xl p-8 shadow-glow"
        >
          {/* Onglets */}
          <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-ws-deep/60 border border-ws-line mb-6">
            <button
              type="button"
              onClick={() => switchMode('login')}
              className={`px-4 py-2 rounded-lg text-xs font-mono uppercase tracking-[0.18em] transition-all ${
                mode === 'login'
                  ? 'bg-ws-panel text-ws-paper shadow-sm'
                  : 'text-ws-mist hover:text-ws-paper'
              }`}
            >
              Connexion
            </button>
            <button
              type="button"
              onClick={() => switchMode('signup')}
              className={`px-4 py-2 rounded-lg text-xs font-mono uppercase tracking-[0.18em] transition-all ${
                mode === 'signup'
                  ? 'bg-ws-panel text-ws-paper shadow-sm'
                  : 'text-ws-mist hover:text-ws-paper'
              }`}
            >
              Première connexion
            </button>
          </div>

          <div className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-[10px] font-mono uppercase tracking-[0.25em] text-ws-mist mb-2"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-ws-deep/60 border border-ws-line text-ws-paper placeholder:text-ws-mist/50 focus:outline-none focus:border-ws-accent transition-colors"
                placeholder="vous@exemple.fr"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-[10px] font-mono uppercase tracking-[0.25em] text-ws-mist mb-2"
              >
                {mode === 'login' ? 'Mot de passe' : 'Choisissez un mot de passe'}
              </label>
              <input
                id="password"
                type="password"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                required
                minLength={mode === 'signup' ? 8 : undefined}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-ws-deep/60 border border-ws-line text-ws-paper placeholder:text-ws-mist/50 focus:outline-none focus:border-ws-accent transition-colors"
                placeholder={mode === 'login' ? '••••••••' : '8 caractères minimum'}
              />
            </div>

            {mode === 'signup' && (
              <div>
                <label
                  htmlFor="password-confirm"
                  className="block text-[10px] font-mono uppercase tracking-[0.25em] text-ws-mist mb-2"
                >
                  Confirmation du mot de passe
                </label>
                <input
                  id="password-confirm"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-ws-deep/60 border border-ws-line text-ws-paper placeholder:text-ws-mist/50 focus:outline-none focus:border-ws-accent transition-colors"
                  placeholder="••••••••"
                />
              </div>
            )}

            {error && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-200 text-sm">
                <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-gradient-to-b from-ws-accent-soft to-ws-accent text-ws-void font-semibold tracking-wide hover:brightness-110 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-glow-sm border border-white/15"
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : mode === 'login' ? (
                <LogIn size={16} />
              ) : (
                <KeyRound size={16} />
              )}
              {loading
                ? mode === 'login'
                  ? 'Connexion…'
                  : 'Création…'
                : mode === 'login'
                  ? 'Se connecter'
                  : 'Activer mon compte'}
            </button>
          </div>

          <p className="text-[11px] text-ws-mist/70 font-mono text-center mt-6 leading-relaxed">
            {mode === 'login' ? (
              <>
                Première fois ici ? Cliquez sur <strong className="text-ws-paper">« Première connexion »</strong>{' '}
                pour définir votre mot de passe.
              </>
            ) : (
              <>
                Votre email doit avoir été pré-autorisé par MAPA Développement.
              </>
            )}
            <br />
            Problème ? Contactez-nous à{' '}
            <a
              href="mailto:contact@mapa-developpement.fr"
              className="text-ws-accent hover:text-ws-accent-soft"
            >
              contact@mapa-developpement.fr
            </a>
          </p>
        </form>

        <p className="text-[10px] font-mono text-center text-ws-mist/50 mt-6 tracking-[0.2em] uppercase">
          © MAPA Développement
        </p>
      </div>
    </div>
  );
}
