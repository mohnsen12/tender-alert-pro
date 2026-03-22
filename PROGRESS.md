# Tender Alert Pro — PROGRESS.md

## FASE 1: Core Infrastructure ✅
- [x] Project structure with TypeScript/ts-node
- [x] TED API scraper (`udbud-scraper/scraper.js`)
- [x] Profile management (`src/profile.ts`)
- [x] Tender enrichment (`src/enrich.ts`)
- [x] Match scoring engine (`src/matcher.ts`)
- [x] CLI runner (`src/index.ts`)
- [x] 3 demo profiles (kaffe, web, byg)
- [x] 18 matches found in first run

## FASE 2: Email Alerts + Landing Page (IN PROGRESS)

### OPGAVE 1: Telegram Alert Integration ✅
- [x] `src/alert.ts` udvidet med `generateTelegramAlert()` funktion
- [x] Formaterer matches med: score emoji, lande-flag, deadline-formatering, estimated value, match-reasons
- [x] `countryFlag()` helper (DK→🇩🇰 etc.)
- [x] `formatEstimatedValue()` til DKK-visning
- [x] `formatDeadline()` med "15. april" format
- [x] CLI-output bevaret (brug `generateAlertText()` for markdown format)
- [ ] **Integration med OpenClaw message tool** — kræver Teddy's message tool API
- [ ] **Cron job** for automatisk Telegram-alerts

### OPGAVE 2: Udvid Udbud Scraper ✅
- [x] Tilføjet `estimatedValue` — `{ amount, currency, eur }` fra `award-value`
- [x] Tilføjet `deadline` — formatteret som "15. april 2026"
- [x] Tilføjet `country` — landekode (DK, SE, DE, NO, etc.) fra `country`-feltet
- [x] Tilfjet `cpvDescriptions` — human-readable CPV labels (fx "Kaffe, te, kakao")
- [x] Udvidet TED API field list med `award-value`, `country`, `buyer-country`
- [x] `CPV_DESCRIPTIONS` map med 20+ kategorier
- [x] `formatEstimatedValue()` med valuta-konvertering (DKK→EUR)

### OPGAVE 3: Landing Page ✅
- [x] `landing-page/index.html` oprettet
- [x] Hero sektion med stats (74+ udbud, 18 virksomheder)
- [x] Email signup form med `POST /api/signup`
- [x] Tre pris-tiers: 99/199/499 kr/md (Starter/Pro/Business)
- [x] "Hvordan det virker" sektion med 3 steps
- [x] Features strip (push alerts, AI-matching, lokalt fokus, dashboard)
- [x] `landing-page/server.js` — lokal dev server på port 3000
- [x] `landing-page/signup-handler.js` — CLI tool til at tilføje signups
- [x] Signups gemmes til `data/profiles.json` med status='pending'
- [ ] **GitHub Pages deployment** — kræver GitHub repo og GitHub Actions
- [ ] **Stripe integration** — STOP her, kræver Claus' godkendelse

## FASE 3: Email Delivery (PENDING)
- [ ] SendGrid / Mailgun integration
- [ ] Email templates (HTML)
- [ ] Unsubscribe handling
- [ ] Email scheduling (daglig/ugevis)

## FASE 4: Payment & Dashboard (PENDING)
- [ ] **Stripe integration** — STOPPET, kræver Claus' godkendelse
- [ ] Web dashboard (React/Vue)
- [ ] User onboarding flow
- [ ] Payment webhooks

---

## Changelog

### 2026-03-22 — Minimax 😸
- FASE 2 påbegyndt
- OPGAVE 1: `generateTelegramAlert()` tilføjet til `alert.ts`
- OPGAVE 2: Scraper udvidet med estimatedValue, deadline, country, cpvDescriptions
- OPGAVE 3: Landing page oprettet (HTML + dev server + signup handler)
- Types opdateret med `status`, `plan`, `source` felter
- **STOP**: Stripe integration ikke påbegyndt (kræver Claus' godkendelse)
