#!/usr/bin/env node
/**
 * Landing Page Signup Handler
 * Saves email signups to profiles.json with a 'pending' status
 * 
 * Usage:
 *   node signup-handler.js --email "test@example.com" --plan "pro"
 *   node signup-handler.js --file /path/to/signups.json   (batch import)
 */

const fs = require('fs');
const path = require('path');

const PROFILES_FILE = path.join(__dirname, '../data/profiles.json');

function generateId(email) {
  const slug = email.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
  const suffix = Math.random().toString(36).slice(2, 6);
  return `pending-${slug}-${suffix}`;
}

function loadProfiles() {
  try {
    const raw = fs.readFileSync(PROFILES_FILE, 'utf8');
    return JSON.parse(raw);
  } catch {
    return { profiles: [] };
  }
}

function saveProfiles(data) {
  fs.writeFileSync(PROFILES_FILE, JSON.stringify(data, null, 2));
}

function addSignup(email, plan = null) {
  const data = loadProfiles();
  
  // Check if already exists
  const existing = data.profiles.find(p => p.email === email && p.status === 'pending');
  if (existing) {
    console.log(`⚠️  Email already registered: ${email}`);
    return existing.id;
  }

  const profile = {
    id: generateId(email),
    companyName: email.split('@')[0],
    email,
    industries: [],
    keywords: [],
    regions: ['DK'],
    maxBudget: null,
    active: false,
    status: 'pending',
    plan: plan || 'starter',
    createdAt: new Date().toISOString(),
    source: 'landing-page',
  };

  data.profiles.push(profile);
  saveProfiles(data);
  console.log(`✅ Signup saved: ${email} (plan: ${plan || 'starter'})`);
  return profile.id;
}

function batchImport(filePath) {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const signups = JSON.parse(raw);
    let count = 0;
    for (const s of signups) {
      addSignup(s.email, s.plan || null);
      count++;
    }
    console.log(`✅ Imported ${count} signups from ${filePath}`);
  } catch (e) {
    console.error(`❌ Error importing: ${e.message}`);
  }
}

// CLI
const args = process.argv.slice(2);
if (args.includes('--email') || args.includes('-e')) {
  const emailIdx = args.indexOf('--email') + 1 || args.indexOf('-e') + 1;
  const email = args[emailIdx];
  const planIdx = args.indexOf('--plan');
  const plan = planIdx > -1 ? args[planIdx + 1] : null;
  addSignup(email, plan);
} else if (args.includes('--file') || args.includes('-f')) {
  const fileIdx = args.indexOf('--file') + 1 || args.indexOf('-f') + 1;
  batchImport(args[fileIdx]);
} else {
  console.log('Usage:');
  console.log('  node signup-handler.js --email user@example.com --plan pro');
  console.log('  node signup-handler.js --file signups.json');
}
