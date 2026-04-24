export function formatEur(n: number | null | undefined): string {
  if (n == null) return '—';
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatDateLong(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

export function formatDateShort(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Retourne le nombre de jours entre deux dates (positif = futur) */
export function daysBetween(from: Date, to: Date): number {
  const ms = to.getTime() - from.getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

export function projectTypeLabel(type: string | null): string {
  const map: Record<string, string> = {
    website: 'Site vitrine',
    ecommerce: 'E-commerce',
    webapp: 'Application web',
    redesign: 'Refonte',
    maintenance: 'Maintenance',
    seo: 'SEO & référencement',
    other: 'Prestation sur mesure',
  };
  return type ? map[type] ?? 'Prestation sur mesure' : 'Prestation sur mesure';
}
