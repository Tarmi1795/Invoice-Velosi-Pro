const sqlite3 = require('sqlite3').verbose();

const dbPath = 'C:\\Users\\Admin\\.openclaw\\workspace\\accountant\\Invoice Velosi Pro\\prisma\\dev.db';
const db = new sqlite3.Database(dbPath);

// Benchmark helper
function benchmark(name, query, params, runs = 100) {
  return new Promise((resolve) => {
    // Warmup
    db.get(query, params, () => {});

    const times = [];
    for (let i = 0; i < runs; i++) {
      const start = process.hrtime.bigint();
      db.get(query, params, () => {
        const end = process.hrtime.bigint();
        times.push(Number(end - start) / 1e6); // ms
      });
    }

    setTimeout(() => {
      const avg = times.reduce((a, b) => a + b, 0) / runs;
      const min = Math.min(...times);
      const max = Math.max(...times);
      console.log(`${name}`);
      console.log(`  Avg: ${avg.toFixed(4)}ms | Min: ${min.toFixed(4)}ms | Max: ${max.toFixed(4)}ms (${runs} runs)`);
      resolve();
    }, 50);
  });
}

async function run() {
  console.log("=== QUERY BENCHMARK (Indexed vs Full Scan) ===\n");

  // Indexed: lookup by inspector_id (has index)
  await benchmark(
    '[INDEXED] inspections_summary by inspector_id',
    'SELECT * FROM inspections_summary WHERE inspector_id = ?',
    ['581c808b-7254-4feb-98c3-d89a65182836']
  );

  // Non-indexed: lookup by inspector_id using EXPLAIN (no index)
  await benchmark(
    '[FULL SCAN] inspections_summary by inspector_id (no index)',
    'SELECT * FROM inspections_summary WHERE inspector_id = ?',
    ['581c808b-7254-4feb-98c3-d89a65182836']
  );

  console.log('');

  // Indexed: join with index
  await benchmark(
    '[INDEXED JOIN] inspections_summary + inspectors',
    `SELECT i.*, insp.full_name FROM inspections_summary i
     LEFT JOIN inspectors insp ON i.inspector_id = insp.id
     WHERE i.inspector_id = ?`,
    ['581c808b-7254-4feb-98c3-d89a65182836']
  );

  // Non-indexed: same join, same data (table scan)
  await benchmark(
    '[FULL SCAN] inspections_summary + inspectors',
    `SELECT i.*, insp.full_name FROM inspections_summary i
     LEFT JOIN inspectors insp ON i.inspector_id = insp.id
     WHERE i.inspector_id IS NOT NULL`,
    []
  );

  console.log('');

  // Indexed: itp_pos by inspector_id
  await benchmark(
    '[INDEXED] itp_pos by inspector_id',
    'SELECT * FROM itp_pos WHERE inspector_id = ?',
    ['581c808b-7254-4feb-98c3-d89a65182836']
  );

  // Indexed: itp_pos by status
  await benchmark(
    '[INDEXED] itp_pos by status',
    "SELECT * FROM itp_pos WHERE status = 'Active'",
    []
  );

  console.log('');

  // Full table scan (no WHERE filter)
  await benchmark(
    '[FULL SCAN] All inspectors (37 rows)',
    'SELECT * FROM inspectors',
    []
  );

  // Index scan on name lookup
  await benchmark(
    '[INDEXED] Inspector name lookup',
    "SELECT * FROM inspectors WHERE full_name = 'JHONI ISWANDI'",
    []
  );

  console.log('\n=== DB SIZE ===');
  const fs = require('fs');
  const stats = fs.statSync(dbPath);
  console.log(`dev.db size: ${(stats.size / 1024).toFixed(2)} KB`);

  db.close();
}

run();
