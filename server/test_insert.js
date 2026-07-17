import db from './src/database/db.js';
async function test() {
  const res = await db.run("INSERT INTO orders (table_id, staff_id, status) VALUES (1, 1, 'active')");
  console.log("res:", res);
  const order = await db.get("SELECT * FROM orders WHERE id = $1", [res.lastInsertRowid]);
  console.log("order:", order);
}
test();
