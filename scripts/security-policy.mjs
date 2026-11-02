import { existsSync, readFileSync } from 'node:fs';
import { extname } from 'node:path';

const errors = [];
const warnings = [];
const error = (message) => errors.push(message);
const warning = (message) => warnings.push(message);

function mustExist(path) {
  if (!existsSync(path)) error(`Missing required file: ${path}`);
}

for (const path of ['manifest.json', 'content.js', 'xslt-extension.js', 'xslt-polyfill.min.js']) {
  mustExist(path);
}

if (existsSync('manifest.json')) {
  let manifest;
  try {
    manifest = JSON.parse(readFileSync('manifest.json', 'utf8'));
  } catch (e) {
    error(`Cannot parse manifest.json: ${e.message}`);
  }
  if (manifest) {
    if (manifest.manifest_version !== 3) error('Chrome Manifest V3 is required.');
    if (!Array.isArray(manifest.content_scripts) || manifest.content_scripts.length === 0) {
      error('Missing content_scripts.');
    }
    const forbiddenPermissions = new Set([
      'debugger', 'nativeMessaging', 'management', 'proxy', 'history',
      'cookies', 'webRequest', 'webRequestBlocking', 'downloads',
    ]);
    const permissions = [...(manifest.permissions ?? []), ...(manifest.optional_permissions ?? [])];
    for (const permission of permissions) {
      if (forbiddenPermissions.has(permission)) error(`Sensitive Chrome permission added: ${permission}`);
    }
    if ((manifest.host_permissions ?? []).length || (manifest.optional_host_permissions ?? []).length) {
      warning('Review host_permissions / optional_host_permissions for unnecessary access.');
    }
    if (manifest.externally_connectable) {
      warning('externally_connectable enabled: review message origin validation.');
    }
    for (const [i, script] of (manifest.content_scripts ?? []).entries()) {
      if (!Array.isArray(script.js)) {
        error(`content_scripts[${i}].js is missing or invalid.`);
      } else {
        for (const path of script.js) {
          if (typeof path !== 'string' || extname(path) !== '.js') {
            error(`Unexpected content script path: ${String(path)}`);
          } else {
            mustExist(path);
          }
        }
      }
      if (script.matches?.includes('<all_urls>')) {
        warning('content_scripts matches <all_urls>: extremely broad coverage by design; review scope.');
      }
      if (script.all_frames === true) {
        warning('content_scripts all_frames=true: runs in matching iframes as well.');
      }
      if (script.world === 'MAIN') {
        warning('content_scripts world=MAIN: same JavaScript world as the page.');
      }
    }
  }
}

if (existsSync('content.js')) {
  const source = readFileSync('content.js', 'utf8');
  if (/\beval\s*\(|\bnew\s+Function\s*\(/.test(source)) {
    error('Dynamic code evaluation detected in content.js: inspect eval/new Function.');
  }
  if (!source.includes('document.contentType')) {
    warning('No explicit contentType check found in content.js.');
  }
  if (source.includes('response.arrayBuffer()')) {
    warning('Response is read into memory using arrayBuffer(): enforce a size limit in fetchAndTransform().');
  }
}

for (const message of warnings) {
  console.warn(`WARNING: ${message}`);
  if (process.env.GITHUB_ACTIONS) console.log(`::warning::${message}`);
}
for (const message of errors) {
  console.error(`ERROR: ${message}`);
  if (process.env.GITHUB_ACTIONS) console.log(`::error::${message}`);
}
console.log(`Policy result: ${errors.length} errors, ${warnings.length} warnings`);
if (errors.length) process.exitCode = 1;
