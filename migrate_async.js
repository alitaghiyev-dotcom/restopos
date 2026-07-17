import fs from 'fs';
import path from 'path';

const dir = './server/src/routes';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.js'));

for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf-8');

  // Convert route handlers to async
  content = content.replace(/(router\.(?:get|post|patch|delete|put)\([^,]+(?:,\s*[A-Za-z_]+(?:\([^)]*\))?)*,\s*)\(req,\s*res\)\s*=>/g, '$1async (req, res) =>');

  // Also convert `db.transaction(fn)` usages. Actually we don't have transaction wrappers with req/res, let's see.
  // Wait, db.transaction is usually used inside the route block.
  // The route is already async, inside the transaction it uses a tempDb.
  // Let's just fix the basic db calls:
  content = content.replace(/(?<!await\s+)db\.(all|get|run)\(/g, 'await db.$1(');

  // If there's an async fn inside transaction, we need to await db.transaction.
  content = content.replace(/(?<!await\s+)db\.transaction\(/g, 'await db.transaction(');

  fs.writeFileSync(filePath, content);
  console.log(`Migrated ${file}`);
}
