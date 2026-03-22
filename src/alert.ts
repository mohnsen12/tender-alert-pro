/**
 * Alert generation — create personalized alerts for matched tenders
 * Includes both plain-text and Telegram-formatted output
 */

import { AlertData, CustomerProfile, TenderMatch } from './types';

export function formatDeadline(tender: TenderMatch['tender']): string {
  if (!tender.deadlineDate) return 'Ingen deadline angivet';
  const now = new Date();
  const diff = Math.ceil((tender.deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return `⚠️ Udløbet for ${Math.abs(diff)} dage siden`;
  if (diff === 0) return '⚡ I dag!';
  if (diff === 1) return '⏰ I morgen!';
  if (diff <= 7) return `⏰ ${diff} dage`;
  // Format as "15. april"
  const d = tender.deadlineDate;
  const months = ['januar','februar','marts','april','maj','juni','juli','august','september','oktober','november','december'];
  return `${d.getDate()}. ${months[d.getMonth()]}`;
}

export function scoreEmoji(score: number): string {
  if (score >= 90) return '🔥';
  if (score >= 75) return '✨';
  if (score >= 60) return '👍';
  return '📋';
}

export function countryFlag(code: string): string {
  if (!code || code === 'EU') return '🇪🇺';
  // Convert country code to flag emoji
  const offset = 127397;
  return code.toUpperCase().split('').map(c => String.fromCodePoint(c.charCodeAt(0) + offset)).join('');
}

export function formatEstimatedValue(eur?: number): string {
  if (!eur) return 'Ikke angivet';
  if (eur >= 1_000_000) return `${(eur / 1_000_000).toFixed(1)} mio. DKK`;
  if (eur >= 1_000) return `${(eur / 1_000).toFixed(0)}k DKK`;
  return `${eur} DKK`;
}

/**
 * Generate a Telegram-formatted alert message for a single profile's matches.
 * Uses the format specified in the Tender Alert Pro spec.
 */
export function generateTelegramAlert(profile: CustomerProfile, matches: TenderMatch[], totalMatchesInDb: number): string {
  const lines: string[] = [];
  const now = new Date();
  const todayCount = matches.length;

  // Header
  lines.push('🔔 NYE TENDER ALERTS');
  lines.push('');

  if (matches.length === 0) {
    lines.push('Ingen nye matches denne gang. Vi holder øje! 👀');
    lines.push('');
    lines.push('---');
    lines.push(`📥 ${totalMatchesInDb} totalematches i databasen`);
    lines.push(`🕐 ${now.toLocaleDateString('da-DK', { day: 'numeric', month: 'long' })} ${now.getFullYear()}`);
    return lines.join('\n');
  }

  // Each match
  for (const match of matches.slice(0, 10)) {
    const { tender } = match;
    const flag = countryFlag(tender.countryCode);

    lines.push(`${scoreEmoji(match.score)} *[Score ${match.score}]* ${tender.title}`);
    lines.push(`📍 Region: ${tender.country} ${flag}`);
    
    if (tender.estimatedValueEur) {
      const dkk = tender.estimatedValueEur * 7.5;
      lines.push(`💰 Værdi: ${formatEstimatedValue(dkk)} (estimeret)`);
    }
    
    lines.push(`⏰ Deadline: ${formatDeadline(tender)}`);
    lines.push(`🔗 ${tender.url}`);
    lines.push('');

    // Match reasons
    if (match.reasons.length > 0) {
      const reasonsText = match.reasons
        .map((r: string) => r.replace(/\s*\(\+\d+pts\)/g, ''))
        .map((r: string) => `"${r}"`)
        .join(', ');
      lines.push(`Matchede fordi: ${reasonsText}`);
    }

    lines.push('---');
    lines.push('');
  }

  // Summary
  lines.push(`📊 ${todayCount} nye matches i dag`);
  lines.push(`📥 ${totalMatchesInDb} totalematches i databasen`);

  return lines.join('\n');
}

export function generateAlertText(profile: CustomerProfile, matches: TenderMatch[]): string {
  const lines: string[] = [];

  lines.push(`📢 *Tender Alert — ${profile.companyName}*`);
  lines.push('');
  lines.push(`🎯 ${matches.length} nye matches fundet baseret på dine præferencer.`);
  lines.push('');

  for (const match of matches.slice(0, 10)) { // top 10
    const { tender } = match;
    lines.push(`${scoreEmoji(match.score)} *[${match.score}pts]* ${tender.category}`);
    lines.push(`   ${tender.title}`);
    lines.push(`   Køber: ${tender.buyer} (${tender.buyerCountry})`);
    lines.push(`   🗓️ Deadline: ${formatDeadline(tender)}`);
    lines.push(`   🔗 ${tender.url}`);
    lines.push('');
  }

  if (matches.length > 10) {
    lines.push(`...og ${matches.length - 10} flere matches (se dashboard for alle).`);
    lines.push('');
  }

  lines.push('---');
  lines.push(`Genereret: ${new Date().toISOString().slice(0, 16).replace('T', ' ')}`);
  lines.push('Powered by Tender Alert Pro 🐕');

  return lines.join('\n');
}

export function generateAlerts(
  profiles: CustomerProfile[],
  matchesByProfile: Record<string, TenderMatch[]>
): AlertData[] {
  return profiles
    .filter(p => p.active && (matchesByProfile[p.id]?.length ?? 0) > 0)
    .map(profile => ({
      profile,
      matches: matchesByProfile[profile.id] || [],
      generatedAt: new Date().toISOString(),
    }));
}
