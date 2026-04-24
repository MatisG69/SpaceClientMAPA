import { Loader2 } from 'lucide-react';
import { useAuth } from './hooks/useAuth';
import { LoginPage } from './pages/LoginPage';
import { ProjectPage } from './pages/ProjectPage';
import { isSupabaseReady } from './lib/supabase';

export default function App() {
  const { session, loading } = useAuth();

  if (!isSupabaseReady()) {
    return (
      <div className="min-h-full flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <h1 className="font-display text-xl font-bold text-ws-paper mb-3">
            Configuration Supabase manquante
          </h1>
          <p className="text-sm text-ws-mist">
            Les variables <code className="text-ws-accent">VITE_SUPABASE_URL</code> et{' '}
            <code className="text-ws-accent">VITE_SUPABASE_ANON_KEY</code> doivent être définies
            dans <code className="text-ws-accent">.env</code>.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <Loader2 size={18} className="animate-spin text-ws-accent" />
      </div>
    );
  }

  return session ? <ProjectPage session={session} /> : <LoginPage />;
}
