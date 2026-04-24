import { useState } from 'react';
import { AlertCircle, Loader2, LogIn } from 'lucide-react';
import { supabase } from '../lib/supabase';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { error: err } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (err) throw err;
      // onAuthStateChange remontera la session, l'App bascule sur ProjectPage
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur de connexion';
      setError(
        msg.toLowerCase().includes('invalid')
          ? 'Identifiants incorrects.'
          : msg
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-full flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Halo doré de fond */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          background:
            'radial-gradient(ellipse at 50% 30%, rgba(175,112,55,0.18) 0%, transparent 60%)',
        }}
      />

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <img src="/logo.png" alt="MAPA Développement" className="h-16 w-auto mb-6 opacity-95" />
          <div className="text-[10px] font-mono uppercase tracking-[0.4em] text-ws-accent mb-2">
            Espace client
          </div>
          <h1 className="font-serif text-3xl font-light text-ws-paper tracking-wide text-center">
            Suivi de projet
          </h1>
          <p className="text-sm text-ws-mist mt-3 text-center max-w-xs">
            Connectez-vous pour consulter l'avancement de votre projet.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-ws-line bg-ws-panel/90 backdrop-blur-xl p-8 shadow-glow"
        >
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
                Mot de passe
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-ws-deep/60 border border-ws-line text-ws-paper placeholder:text-ws-mist/50 focus:outline-none focus:border-ws-accent transition-colors"
                placeholder="••••••••"
              />
            </div>

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
              {loading ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} />}
              {loading ? 'Connexion…' : 'Se connecter'}
            </button>
          </div>

          <p className="text-[11px] text-ws-mist/70 font-mono text-center mt-6 leading-relaxed">
            Vos identifiants vous ont été communiqués par MAPA Développement.
            <br />
            Problème de connexion ? Contactez-nous à{' '}
            <a
              href="mailto:contact@mapa-dev.fr"
              className="text-ws-accent hover:text-ws-accent-soft"
            >
              contact@mapa-dev.fr
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
