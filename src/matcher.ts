/**
 * Tender Matcher — Core matching logic
 * Scores tenders against customer profiles and returns relevant matches (score > 50)
 */

import { CustomerProfile, EnrichedTender, TenderMatch } from './types';

const MIN_SCORE = 50;

interface ScoreBreakdown {
  keywordScore: number;      // 0-50
  regionScore: number;       // 0-30
  industryScore: number;     // 0-20
  total: number;
}

/**
 * Calculate keyword match score between tender and profile keywords
 * Returns 0-50 points
 */
function scoreKeywords(tender: EnrichedTender, profile: CustomerProfile): { score: number; matched: string[] } {
  const tenderText = `${tender.titleLower} ${tender.cpvDescriptions.join(' ')} ${tender.category.toLowerCase()}`;
  const matched: string[] = [];

  for (const kw of profile.keywords) {
    const kwLower = kw.toLowerCase();
    if (tenderText.includes(kwLower)) {
      matched.push(kw);
    }
  }

  if (matched.length === 0) return { score: 0, matched };
  
  // Score: 1 match = 20pts, 2 = 35pts, 3+ = 50pts (capped)
  const score = Math.min(50, matched.length * 20 - (matched.length === 1 ? 5 : 0));
  return { score, matched };
}

/**
 * Calculate region match score
 * Returns 0-30 points
 */
function scoreRegion(tender: EnrichedTender, profile: CustomerProfile): { score: number; reason: string } {
  if (profile.regions.length === 0) return { score: 10, reason: 'Ingen region-præference' };

  const matched = profile.regions.includes(tender.countryCode);
  if (matched) {
    return { score: 30, reason: `Land matcher: ${tender.country} (${tender.countryCode})` };
  }

  // Nordic bonus
  const nordic = ['DK', 'SE', 'NO', 'FI', 'IS'];
  const nordicMatch = nordic.some(r => profile.regions.includes(r)) && nordic.includes(tender.countryCode);
  if (nordicMatch) {
    return { score: 15, reason: `Nordic region: ${tender.country}` };
  }

  return { score: 5, reason: `Anden region: ${tender.country}` };
}

/**
 * Calculate industry match score
 * Returns 0-20 points
 */
function scoreIndustry(tender: EnrichedTender, profile: CustomerProfile): { score: number; matched: string[] } {
  const tenderText = `${tender.titleLower} ${tender.cpvDescriptions.join(' ')}`;
  const matched: string[] = [];

  for (const industry of profile.industries) {
    const indLower = industry.toLowerCase();
    if (tenderText.includes(indLower) || tender.category.toLowerCase().includes(indLower)) {
      matched.push(industry);
    }
  }

  const score = Math.min(20, matched.length * 10);
  return { score, matched };
}

/**
 * Main matching function — score a single tender against a single profile
 */
export function scoreMatch(tender: EnrichedTender, profile: CustomerProfile): TenderMatch | null {
  if (!profile.active) return null;

  const kwResult = scoreKeywords(tender, profile);
  const regionResult = scoreRegion(tender, profile);
  const indResult = scoreIndustry(tender, profile);

  const total = kwResult.score + regionResult.score + indResult.score;

  if (total < MIN_SCORE) return null;

  const reasons: string[] = [];
  if (kwResult.matched.length > 0) {
    reasons.push(`Keywords match: "${kwResult.matched.join('", "')}" (+${kwResult.score}pts)`);
  }
  reasons.push(`${regionResult.reason} (+${regionResult.score}pts)`);
  if (indResult.matched.length > 0) {
    reasons.push(`Industri match: "${indResult.matched.join('", "')}" (+${indResult.score}pts)`);
  }

  return {
    tenderId: tender.id,
    profileId: profile.id,
    score: total,
    reasons,
    tender,
    profile,
  };
}

/**
 * Match all tenders against all profiles
 */
export function matchAll(
  tenders: EnrichedTender[],
  profiles: CustomerProfile[]
): TenderMatch[] {
  const matches: TenderMatch[] = [];

  for (const tender of tenders) {
    for (const profile of profiles) {
      const match = scoreMatch(tender, profile);
      if (match) {
        matches.push(match);
      }
    }
  }

  // Sort by score descending
  matches.sort((a, b) => b.score - a.score);
  return matches;
}

/**
 * Get matches for a specific profile
 */
export function matchForProfile(
  tenders: EnrichedTender[],
  profile: CustomerProfile
): TenderMatch[] {
  const matches: TenderMatch[] = [];
  for (const tender of tenders) {
    const match = scoreMatch(tender, profile);
    if (match) matches.push(match);
  }
  matches.sort((a, b) => b.score - a.score);
  return matches;
}

/**
 * Group matches by profile
 */
export function groupMatchesByProfile(matches: TenderMatch[]): Record<string, TenderMatch[]> {
  const grouped: Record<string, TenderMatch[]> = {};
  for (const match of matches) {
    if (!grouped[match.profileId]) grouped[match.profileId] = [];
    grouped[match.profileId].push(match);
  }
  return grouped;
}
