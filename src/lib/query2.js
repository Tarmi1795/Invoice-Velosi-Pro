const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('C:\\Users\\Admin\\.openclaw\\workspace\\accountant\\Invoice Velosi Pro\\prisma\\dev.db');

const sql = 'SELECT full_name, job_title, base_location FROM inspectors WHERE full_name LIKE ? OR full_name LIKE ?';

db.all(sql, ['%Jhoni%', '%Kirno%'], (e, r) => {
  if (e) { console.error('ERROR:', e.message); }
  else { console.log(JSON.stringify(r, null, 2)); }
  db.close();
});
