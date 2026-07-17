import db from './server/src/database/db.js';
async function test() {
  const cats = await db.all('SELECT * FROM categories');
  console.log(cats);
}
test();
