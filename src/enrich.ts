/**
 * Enrich raw tender data from scraper with derived fields:
 * - countryCode (DK, DE, SE, etc.)
 * - deadlineDate (parsed Date)
 * - cpvDescriptions (human-readable CPV codes)
 */

import { EnrichedTender } from './types';

// Map scraped country names (from title prefix) to ISO codes
const COUNTRY_MAP: Record<string, string> = {
  'danmark': 'DK',
  'tyskland': 'DE',
  'sverige': 'SE',
  'norge': 'NO',
  'nederlandene': 'NL',
  'belgien': 'BE',
  'frankrig': 'FR',
  'italien': 'IT',
  'spanien': 'ES',
  'polen': 'PL',
  'østrig': 'AT',
  'schweiz': 'CH',
  'finland': 'FI',
  'irland': 'IE',
  'portugal': 'PT',
  'grækenland': 'EL',
  'tjekkiet': 'CZ',
  'ungarn': 'HU',
  'rumænien': 'RO',
  'kroatien': 'HR',
  'slovakiet': 'SK',
  'slovenien': 'SI',
  'letland': 'LV',
  'litauen': 'LT',
  'estland': 'EE',
  'bulgarien': 'BG',
  'luxembourg': 'LU',
  'island': 'IS',
  'malta': 'MT',
  'cypern': 'CY',
  'storbritannien': 'GB',
  'eu': 'EU',
};

// CPV code prefix → human-readable category
const CPV_CATEGORIES: Record<string, string> = {
  '1586': 'Kaffe, te, kakao',
  '15861': 'Kaffe',
  '15862': 'Te og kakao',
  '15000': 'Fødevarer, drikkevarer, tobak',
  '3971': 'Elektriske husholdningsapparater',
  '39711': 'Kaffemaskiner',
  '4296': 'Drikkevareudstyr',
  '42968': 'Drikkevarautomater',
  '5111': 'Installation af elektrisk udstyr',
  '5550': 'Cateringvirksomhed',
  '72000': 'IT-tjenester & konsulent',
  '48000': 'Software',
  '30230': 'Computere og -udstyr',
  '79340': 'Marketing',
  '71320': 'Ingeniørprojektering',
  '85000': 'Sundhedsydelser',
};

function getCountryFromTitle(title: string): { country: string; countryCode: string } {
  const match = title.match(/^([A-ZÆØÅ][a-zæøå]+(?:[a-zæøå]+)?)\s*[-–]/);
  if (match) {
    const name = match[1].toLowerCase();
    const code = COUNTRY_MAP[name];
    if (code) {
      return { country: match[1], countryCode: code };
    }
    // Fallback: try to find in map by partial match
    for (const [key, code] of Object.entries(COUNTRY_MAP)) {
      if (name.includes(key) || key.includes(name)) {
        return { country: match[1], countryCode: code };
      }
    }
  }
  return { country: 'EU', countryCode: 'EU' };
}

function parseDeadline(deadline: string | string[]): Date | undefined {
  const raw = Array.isArray(deadline) ? deadline[0] : deadline;
  if (!raw || raw === 'not specified') return undefined;
  // TED format: "2026-03-26+01:00" or "2026-04-09+02:00"
  const iso = raw.replace(/\+\d{2}:\d{2}$/, 'Z').replace('Z', '');
  const d = new Date(iso);
  return isNaN(d.getTime()) ? undefined : d;
}

function getCpvDescriptions(cpvCodes: string[]): string[] {
  const unique = [...new Set(cpvCodes)];
  return unique.map(code => {
    const prefix = code.slice(0, 4);
    return CPV_CATEGORIES[prefix] || CPV_CATEGORIES[code.slice(0, 3)] || `CPV ${code}`;
  }).slice(0, 5); // top 5 unique descriptions
}

export interface RawTender {
  category: string;
  publicationNumber: string;
  title: string;
  buyer: string | string[];
  publicationDate: string;
  deadline: string | string[];
  cpv: string[];
  url: string;
  isNew: boolean;
}

export function enrichTender(raw: RawTender): EnrichedTender {
  const { country, countryCode } = getCountryFromTitle(raw.title);
  const buyerName = Array.isArray(raw.buyer) ? raw.buyer[0] : raw.buyer;
  const deadlineDate = parseDeadline(raw.deadline);
  const deadlineStr = Array.isArray(raw.deadline)
    ? raw.deadline[0] || 'not specified'
    : raw.deadline;
  const cleanedDeadline = deadlineStr === 'not specified' ? 'Ikke angivet' : deadlineStr.slice(0, 10);

  return {
    id: raw.publicationNumber,
    publicationNumber: raw.publicationNumber,
    title: raw.title,
    titleLower: raw.title.toLowerCase(),
    buyer: buyerName,
    buyerCountry: country,
    countryCode,
    country,
    publicationDate: raw.publicationDate.slice(0, 10),
    deadline: cleanedDeadline,
    deadlineDate,
    cpv: [...new Set(raw.cpv)],
    cpvDescriptions: getCpvDescriptions(raw.cpv),
    category: raw.category,
    url: raw.url,
  };
}

export function loadAndEnrichTenders(jsonPath: string): EnrichedTender[] {
  // Dynamic import to work with CommonJS scraper output
  const fs = require('fs');
  const raw = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  return raw.results.map((r: RawTender) => enrichTender(r));
}
