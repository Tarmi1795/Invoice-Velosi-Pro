const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('C:\\Users\\Admin\\.openclaw\\workspace\\accountant\\Invoice Velosi Pro\\prisma\\dev.db');

db.all("SELECT sql FROM sqlite_master WHERE type='index'", [], (err, rows) => {
  if (err) { console.error("ERROR:", err.message); }
  else { console.log(JSON.stringify(rows, null, 2)); }
  db.close();
});
