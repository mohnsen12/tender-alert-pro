/**
 * Profile management — load, save, validate customer profiles
 */

import * as fs from 'fs';
import * as path from 'path';
import { CustomerProfile } from './types';

export const DEFAULT_PROFILES_PATH = path.join(__dirname, '../data/profiles.json');

export function loadProfiles(fp: string = DEFAULT_PROFILES_PATH): CustomerProfile[] {
  try {
    const raw = fs.readFileSync(fp, 'utf8');
    return JSON.parse(raw).profiles || [];
  } catch {
    return [];
  }
}

export function saveProfiles(profiles: CustomerProfile[], fp: string = DEFAULT_PROFILES_PATH): void {
  const dir = path.dirname(fp);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(fp, JSON.stringify({ profiles }, null, 2));
}

export function addProfile(profile: CustomerProfile, fp: string = DEFAULT_PROFILES_PATH): CustomerProfile {
  const profiles = loadProfiles(fp);
  const existing = profiles.findIndex(p => p.id === profile.id);
  if (existing >= 0) {
    profiles[existing] = profile;
  } else {
    profiles.push(profile);
  }
  saveProfiles(profiles, fp);
  return profile;
}

export function removeProfile(id: string, fp: string = DEFAULT_PROFILES_PATH): boolean {
  const profiles = loadProfiles(fp);
  const idx = profiles.findIndex(p => p.id === id);
  if (idx < 0) return false;
  profiles.splice(idx, 1);
  saveProfiles(profiles, fp);
  return true;
}

export function validateProfile(p: Partial<CustomerProfile>): string[] {
  const errors: string[] = [];
  if (!p.id) errors.push('id er påkrævet');
  if (!p.companyName) errors.push('companyName er påkrævet');
  if (!p.email) errors.push('email er påkrævet');
  if (!p.keywords || p.keywords.length === 0) errors.push('mindst 1 keyword er påkrævet');
  if (!p.regions || p.regions.length === 0) errors.push('mindst 1 region er påkrævet');
  return errors;
}
