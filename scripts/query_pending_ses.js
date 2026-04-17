const db = require('../acsi_db');

async function main() {
  // Pending SES query
  const result = await db.runRaw(`
    SELECT 
      sr.ses_no,
      sr.ses_date,
      sr.ses_value,
      sr.status,
      sr.po_no,
      p.client_name
    FROM ses_records sr
    LEFT JOIN proformas_and_invoices pai ON sr.proforma_inv_id = pai.id
    LEFT JOIN inspections_summary iss ON pai.inspection_id = iss.id
    LEFT JOIN projects proj ON iss.project_id = proj.id
    LEFT JOIN clients_and_contracts p ON proj.contract_id = p.id
    WHERE sr.status = 'Pending'
    ORDER BY sr.ses_date DESC
  `);

  const records = result.data || [];
  const total = records.reduce((sum, r) => sum + (Number(r.ses_value) || 0), 0);

  console.log('=== PENDING SES (Till Today) ===');
  console.log(`Total Records: ${records.length}`);
  console.log(`Total Value: QAR ${total.toLocaleString()}\n`);
  
  records.forEach(r => {
    console.log(`${r.ses_no || 'N/A'} | ${r.client_name || 'N/A'} | ${r.po_no || 'N/A'} | QAR ${(Number(r.ses_value)||0).toLocaleString()} | ${r.ses_date ? new Date(r.ses_date).toLocaleDateString() : 'N/A'}`);
  });

  // Group by client for chart data
  const byClient = {};
  records.forEach(r => {
    const c = r.client_name || 'Unknown';
    byClient[c] = (byClient[c] || 0) + (Number(r.ses_value) || 0);
  });

  const chartData = {
    labels: Object.keys(byClient),
    values: Object.values(byClient)
  };

  console.log('\n=== BY CLIENT ===');
  Object.entries(byClient).forEach(([k, v]) => {
    console.log(`${k}: QAR ${v.toLocaleString()}`);
  });

  // Generate HTML chart
  const fs = require('fs');
  const html = `<!DOCTYPE html>
<html>
<head>
  <title>Pending SES - Chart</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #111827; color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; }
    .container { max-width: 900px; margin: 0 auto; }
    h1 { color: #f97316; font-size: 24px; margin-bottom: 8px; }
    .subtitle { color: #9ca3af; font-size: 14px; margin-bottom: 32px; }
    .summary { display: flex; gap: 24px; margin-bottom: 32px; }
    .stat { background: #1f2937; border: 1px solid #374151; border-radius: 12px; padding: 20px 28px; }
    .stat-value { font-size: 28px; font-weight: 700; color: #f97316; }
    .stat-label { font-size: 12px; color: #9ca3af; margin-top: 4px; text-transform: uppercase; letter-spacing: 0.05em; }
    .card { background: #1f2937; border: 1px solid #374151; border-radius: 12px; padding: 24px; margin-bottom: 24px; }
    .card h2 { font-size: 16px; color: #f3f4f6; margin-bottom: 16px; border-bottom: 1px solid #374151; padding-bottom: 12px; }
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; font-size: 11px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em; padding: 8px 12px; border-bottom: 1px solid #374151; }
    td { padding: 10px 12px; font-size: 13px; border-bottom: 1px solid #374151/30; }
    tr:last-child td { border-bottom: none; }
    .badge { display: inline-block; background: #f97316/10; color: #f97316; font-size: 11px; padding: 2px 8px; border-radius: 999px; }
    canvas { max-height: 300px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Pending SES Summary</h1>
    <p class="subtitle">As of ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>

    <div class="summary">
      <div class="stat">
        <div class="stat-value">${records.length}</div>
        <div class="stat-label">Pending SES Records</div>
      </div>
      <div class="stat">
        <div class="stat-value">QAR ${total.toLocaleString()}</div>
        <div class="stat-label">Total Outstanding Value</div>
      </div>
      <div class="stat">
        <div class="stat-value">${Object.keys(byClient).length}</div>
        <div class="stat-label">Clients Affected</div>
      </div>
    </div>

    <div class="card">
      <h2>Value by Client (QAR)</h2>
      <canvas id="clientChart"></canvas>
    </div>

    <div class="card">
      <h2>All Pending SES Records</h2>
      <table>
        <thead>
          <tr>
            <th>SES No</th>
            <th>Client</th>
            <th>PO No</th>
            <th>SES Date</th>
            <th>Value (QAR)</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${records.map(r => `
          <tr>
            <td><span class="badge">${r.ses_no || 'N/A'}</span></td>
            <td>${r.client_name || 'Unknown'}</td>
            <td>${r.po_no || 'N/A'}</td>
            <td>${r.ses_date ? new Date(r.ses_date).toLocaleDateString() : 'N/A'}</td>
            <td>${(Number(r.ses_value)||0).toLocaleString()}</td>
            <td><span class="badge">${r.status}</span></td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
  </div>

  <script>
    const ctx = document.getElementById('clientChart').getContext('2d');
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ${JSON.stringify(chartData.labels)},
        datasets: [{
          label: 'Outstanding Value (QAR)',
          data: ${JSON.stringify(chartData.values)},
          backgroundColor: '#f97316',
          borderRadius: 6,
          borderSkipped: false,
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: ctx => 'QAR ' + ctx.raw.toLocaleString()
            }
          }
        },
        scales: {
          x: {
            grid: { color: '#374151' },
            ticks: { color: '#9ca3af', callback: v => 'QAR ' + v.toLocaleString() }
          },
          y: {
            grid: { display: false },
            ticks: { color: '#f3f4f6' }
          }
        }
      }
    });
  </script>
</body>
</html>`;

  fs.writeFileSync('C:/Users/Admin/.openclaw/workspace/accountant/Invoice Velosi Pro/temp/pending_ses_report.html', html);
  console.log('\n✅ Chart saved to: Invoice Velosi Pro/temp/pending_ses_report.html');
}

main().then(() => db.close()).catch(console.error);
