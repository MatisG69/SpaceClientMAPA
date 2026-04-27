/**
 * Génère un numéro de devis basique pour les rendus côté portail.
 * Utilisé seulement comme fallback quand on ré-affiche un devis existant
 * dont le numéro a été perdu (cas exceptionnel).
 */
export function generateQuoteNumber(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const rand = String(Math.floor(Math.random() * 9000) + 1000);
  return `DEV-${y}${m}-${rand}`;
}
