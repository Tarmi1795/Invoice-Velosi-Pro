const sqlite3 = require('sqlite3').verbose();

const dbPath = 'C:\\Users\\Admin\\.openclaw\\workspace\\accountant\\Invoice Velosi Pro\\prisma\\dev.db';
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) { console.error("DB open error:", err.message); process.exit(1); }
});

console.log("=== INDEX CHECK ===");
db.all("SELECT name, tbl_name, sql FROM sqlite_master WHERE type='index' AND sql IS NOT NULL", [], (err, indexes) => {
  if (err) { console.error("Error:", err.message); }
  else { 
    console.log("Indexes found:", indexes.length);
    indexes.forEach(idx => console.log(`  ${idx.tbl_name}.${idx.name}`));
  }

  console.log("\n=== ASEP HENDRA ===");
  const asepQuery = `SELECT id, full_name, job_title, base_location, created_at FROM inspectors WHERE full_name LIKE '%ASEP%' AND full_name LIKE '%HENDRA%'`;
  db.all(asepQuery, [], (e, rows) => {
    if (e) { console.error("Error:", e.message); }
    else { 
      console.log("Results:", rows.length);
      rows.forEach(r => console.log(JSON.stringify(r, null, 2)));
    }

    console.log("\n=== JOIN TEST (inspections -> inspector) ===");
    const joinQuery = `
      SELECT i.id, i.report_no, i.vendor_location, insp.full_name as inspector_name, insp.job_title
      FROM inspections_summary i
      LEFT JOIN inspectors insp ON i.inspector_id = insp.id
      LIMIT 5`;
    db.all(joinQuery, [], (e2, rows2) => {
      if (e2) { console.error("Join error:", e2.message); }
      else { 
        console.log("Joined rows:", rows2.length);
        rows2.forEach(r => console.log(JSON.stringify(r, null, 2)));
      }
      db.close();
    });
  });
});
