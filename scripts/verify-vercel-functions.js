import { readdirSync, existsSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const HOBBY_FUNCTION_LIMIT = 12;
const FUNCTION_EXTENSION = /\.(?:[cm]?js|[cm]?ts|py|go|rb)$/;

export function listVercelFunctionEntrypoints(root = process.cwd()) {
  const entries = [];
  const scan = (directory) => {
    if (!existsSync(directory)) return;
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      // Vercel does not deploy private API helpers as independent functions.
      if (entry.name.startsWith('_') || entry.name.startsWith('.')) continue;
      const path = join(directory, entry.name);
      if (entry.isDirectory()) scan(path);
      else if (FUNCTION_EXTENSION.test(entry.name) && !entry.name.endsWith('.d.ts')) {
        entries.push(relative(root, path));
      }
    }
  };
  scan(join(root, 'api'));
  // The project's Node.js routing middleware consumes a function slot too.
  // Reserve this slot for any middleware runtime, so this check stays conservative.
  for (const name of ['middleware.js', 'middleware.ts']) {
    if (existsSync(join(root, name))) entries.push(name);
  }
  return entries.sort();
}

export function verifyVercelFunctionBudget(root = process.cwd()) {
  const entries = listVercelFunctionEntrypoints(root);
  if (entries.length > HOBBY_FUNCTION_LIMIT) {
    throw new Error(
      `Vercel Hobby deployment blocked: ${entries.length} functions exceed the limit of ${HOBBY_FUNCTION_LIMIT}. ` +
      'Move new handlers into api/_lib and route them through an existing function.\n' +
      entries.join('\n'),
    );
  }
  return entries;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const entries = verifyVercelFunctionBudget();
  console.log(`Vercel function budget: ${entries.length}/${HOBBY_FUNCTION_LIMIT} (including routing middleware).`);
}
