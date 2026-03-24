const fs   = require('fs');
const path = require('path');

// ── Read all markdown files from _names/ folder ──────────────────────
const namesDir = path.join(__dirname, '_names');
const outFile  = path.join(__dirname, 'names.json');

if(!fs.existsSync(namesDir)){
  console.log('No _names/ folder found — writing empty names.json');
  fs.writeFileSync(outFile, JSON.stringify([], null, 2));
  process.exit(0);
}

const files = fs.readdirSync(namesDir).filter(f => f.endsWith('.md'));
console.log(`Found ${files.length} name file(s)`);

const names = [];

files.forEach((file, i) => {
  const raw = fs.readFileSync(path.join(namesDir, file), 'utf8');

  // Parse YAML front matter between --- markers
  const match = raw.match(/^---\n([\s\S]*?)\n---/);
  if(!match) return;

  const fm   = match[1];
  const data = {};

  // Simple YAML parser for flat key: value pairs
  fm.split('\n').forEach(line => {
    const colon = line.indexOf(':');
    if(colon === -1) return;
    const key = line.slice(0, colon).trim();
    const val = line.slice(colon + 1).trim().replace(/^["']|["']$/g, '');
    data[key] = val;
  });

  if(!data.name) return;

  // Convert syllables string to array
  const syllables = data.syllables
    ? data.syllables.split('-').map(s => s.trim()).filter(Boolean)
    : [];

  // Build tags array from region and gender fields
  const tags = [];
  if(data.region) tags.push(data.region);
  if(data.gender) tags.push(data.gender);

  names.push({
    id:        'cms_' + (i + 1),
    name:      data.name      || '',
    phonetic:  data.phonetic  || '',
    origin:    data.origin    || '',
    country:   data.country   || '',
    meaning:   data.meaning   || '',
    syllables,
    tags,
    audio_url: data.audio_url || null,
    points:    100 + syllables.length * 10,
    status:    data.status    || 'approved',
    created_at:data.date      || new Date().toISOString()
  });
});

// Sort by name alphabetically
names.sort((a, b) => a.name.localeCompare(b.name));

fs.writeFileSync(outFile, JSON.stringify(names, null, 2));
console.log(`✓ names.json written with ${names.length} approved name(s)`);
