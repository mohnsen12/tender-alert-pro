#!/usr/bin/env node
/**
 * Landing Page Dev Server
 * Serves the landing page and handles signup form submissions
 * Saves signups to ../data/profiles.json
 * 
 * Usage: node server.js [port]
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.argv[2] || 3000;
const LANDING_DIR = __dirname;
const PROFILES_FILE = path.join(__dirname, '../data/profiles.json');

function generateId(email) {
  const slug = email.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
  return `pending-${slug}-${Math.random().toString(36).slice(2, 6)}`;
}

function loadProfiles() {
  try {
    return JSON.parse(fs.readFileSync(PROFILES_FILE, 'utf8'));
  } catch {
    return { profiles: [] };
  }
}

function saveProfiles(data) {
  fs.writeFileSync(PROFILES_FILE, JSON.stringify(data, null, 2));
}

function addSignup(email, plan = 'starter') {
  const data = loadProfiles();
  const existing = data.profiles?.find(p => p.email === email && p.status === 'pending');
  if (existing) return { status: 'exists', id: existing.id };

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

  if (!data.profiles) data.profiles = [];
  data.profiles.push(profile);
  saveProfiles(data);
  return { status: 'ok', id: profile.id };
}

function serveFile(res, filePath, contentType = 'text/html') {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://localhost:${PORT}`);

  // API: POST /api/signup
  if (req.method === 'POST' && url.pathname === '/api/signup') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      try {
        const { email, plan } = JSON.parse(body);
        if (!email || !email.includes('@')) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid email' }));
          return;
        }
        const result = addSignup(email, plan);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // Serve landing page
  if (url.pathname === '/' || url.pathname === '/index.html') {
    serveFile(res, path.join(LANDING_DIR, 'index.html'));
    return;
  }

  // Static assets
  const staticFile = path.join(LANDING_DIR, url.pathname);
  if (fs.existsSync(staticFile) && fs.statSync(staticFile).isFile()) {
    const ext = path.extname(staticFile);
    const mimeTypes = {
      '.css': 'text/css',
      '.js': 'application/javascript',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.svg': 'image/svg+xml',
    };
    serveFile(res, staticFile, mimeTypes[ext] || 'text/plain');
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

server.listen(PORT, () => {
  console.log(`🌐 Landing page server running at http://localhost:${PORT}`);
  console.log(`📋 Signups will be saved to: ${PROFILES_FILE}`);
});
