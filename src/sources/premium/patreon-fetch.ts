#!/usr/bin/env node
import { execSync } from 'child_process';
import fs from 'fs';

const [,, url, out] = process.argv;
const cookieFile = '.patreon-session';

if (!fs.existsSync(cookieFile)) {
  console.log('No session cookie — running browser auth...');
  execSync('node extract-cookie.js', { stdio: 'inherit' });
}

const session = fs.readFileSync(cookieFile, 'utf8').trim();
console.log('Downloading with patreon-dl...');
execSync(`npx patreon-dl -c "session_id=${session}" -o "${out}" "${url}"`, { stdio: 'inherit' });
