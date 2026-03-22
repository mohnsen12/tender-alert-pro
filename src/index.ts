/**
 * Tender Alert Pro — CLI
 * Usage: npx ts-node src/index.ts [scraper-results-path]
 * 
 * Example:
 *   npx ts-node src/index.ts /Users/teddy/.openclaw/workspace/udbud-scraper/data/results.json
 */

import * as path from 'path';
import * as fs from 'fs';
import { loadProfiles } from './profile';
import { loadAndEnrichTenders } from './enrich';
import { matchAll, groupMatchesByProfile } from './matcher';
import { generateAlerts, generateAlertText } from './alert';
import { TenderMatch } from './types.js';

const SCRAPER_RESULTS_PATH = process.argv[2] 
  || '/Users/teddy/.openclaw/workspace/udbud-scraper/data/results.json';

const PROFILES_PATH = path.join(__dirname, '../data/profiles.json');
const MATCHES_OUT_PATH = path.join(__dirname, '../data/matches.json');

function printMatch(match: TenderMatch, verbose = false) {
  const { tender, score, reasons } = match;
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`${verbose ? '🔥' : '│'} [${score}pts] ${tender.category}`);
  console.log(`${verbose ? '🔥' : '│'} ${tender.title}`);
  console.log(`${verbose ? '🔥' : '│'} Køber: ${tender.buyer} (${tender.buyerCountry})`);
  console.log(`${verbose ? '🔥' : '│'} Deadline: ${tender.deadline}`);
  if (verbose) {
    console.log(`${'─'.repeat(60)} Reasons:`);
    for (const r of reasons) console.log(`   • ${r}`);
    console.log(`${'─'.repeat(60)} CPV: ${tender.cpv.slice(0, 3).join(', ')}...`);
    console.log(`   🔗 ${tender.url}`);
  }
}

async function main() {
  console.log('🏗️  Tender Alert Pro — Starter...\n');

  // Load data
  console.log(`📂 Læser tenders fra: ${SCRAPER_RESULTS_PATH}`);
  if (!fs.existsSync(SCRAPER_RESULTS_PATH)) {
    console.error(`❌ Filen findes ikke: ${SCRAPER_RESULTS_PATH}`);
    process.exit(1);
  }

  const tenders = loadAndEnrichTenders(SCRAPER_RESULTS_PATH);
  console.log(`   ✓ ${tenders.length} tenders indlæst og beriget\n`);

  console.log(`📂 Læser profiler fra: ${PROFILES_PATH}`);
  const profiles = loadProfiles(PROFILES_PATH);
  console.log(`   ✓ ${profiles.length} profiler indlæst\n`);

  // Run matching
  console.log('🤖 Kører matching...');
  const allMatches = matchAll(tenders, profiles);
  console.log(`   ✓ ${allMatches.length} matches fundet (score > 50)\n`);

  // Save matches
  fs.writeFileSync(MATCHES_OUT_PATH, JSON.stringify({
    generatedAt: new Date().toISOString(),
    totalTenders: tenders.length,
    totalProfiles: profiles.length,
    totalMatches: allMatches.length,
    matches: allMatches.map(m => ({
      tenderId: m.tenderId,
      profileId: m.profileId,
      score: m.score,
      reasons: m.reasons,
      tenderTitle: m.tender.title,
      tenderUrl: m.tender.url,
      tenderCountry: m.tender.country,
      tenderDeadline: m.tender.deadline,
      tenderCategory: m.tender.category,
    })),
  }, null, 2));
  console.log(`💾 Matches gemt til: ${MATCHES_OUT_PATH}\n`);

  // Group by profile and print
  const byProfile = groupMatchesByProfile(allMatches);
  const alerts = generateAlerts(profiles, byProfile);

  for (const alert of alerts) {
    const { profile, matches } = alert;
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📢 ALERT FOR: ${profile.companyName} (${profile.email})`);
    console.log(`   Matcher: ${matches.length} tenders`);
    console.log(`${'='.repeat(60)}`);

    // Top 5 as summary
    for (const m of matches.slice(0, 5)) {
      printMatch(m, false);
    }

    if (matches.length > 5) {
      console.log(`\n   ... ${matches.length - 5} flere matches`);
    }
  }

  // Summary table
  console.log(`\n\n${'='.repeat(60)}`);
  console.log('📊 RESUME');
  console.log('='.repeat(60));
  console.log(`Tenders analyseret:  ${tenders.length}`);
  console.log(`Aktive profiler:    ${profiles.filter(p => p.active).length}`);
  console.log(`Samlet matches:      ${allMatches.length}`);
  console.log('');
  console.log('Matches per profil:');
  for (const [profileId, matches] of Object.entries(byProfile)) {
    const profile = profiles.find(p => p.id === profileId);
    console.log(`  ${profile?.companyName || profileId}: ${matches.length} matches`);
  }
  console.log('');
  console.log(`💾 Alle rå matches: ${MATCHES_OUT_PATH}`);
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
