/**
 * Tender Alert Pro — TypeScript type definitions
 */

export interface CustomerProfile {
  id: string;
  companyName: string;
  email: string;
  industries: string[];       // ["kaffe", "software", "byg"]
  keywords: string[];           // ["espresso", "espresso machine", "web development"]
  regions: string[];           // ["DK", "SE", "DE"] (ISO 2-letter country codes)
  maxBudget?: number;         // Max udbudsværdi i EUR
  active: boolean;
  status?: 'pending' | 'active' | 'inactive';  // FASE 2: signup flow
  plan?: string;               // 'starter' | 'pro' | 'business'
  source?: string;             // 'landing-page' | 'manual'
  createdAt?: string;
}

export interface TenderMatch {
  tenderId: string;
  profileId: string;
  score: number;             // 0-100 relevance
  reasons: string[];         // Hvorfor matchede den
  tender: EnrichedTender;
  profile: CustomerProfile;
}

export interface EnrichedTender {
  id: string;
  publicationNumber: string;
  title: string;
  titleLower: string;
  buyer: string;
  buyerCountry: string;
  countryCode: string;       // "DK", "DE", "SE", etc.
  country: string;          // "Danmark", "Tyskland", etc.
  publicationDate: string;
  deadline: string;
  deadlineDate?: Date;
  cpv: string[];
  cpvDescriptions: string[];
  category: string;
  url: string;
  estimatedValue?: string;
  estimatedValueEur?: number;
}

export interface MatchResult {
  profileId: string;
  matches: TenderMatch[];
}

export interface AlertData {
  profile: CustomerProfile;
  matches: TenderMatch[];
  generatedAt: string;
}
