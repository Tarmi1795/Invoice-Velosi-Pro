const http = require('http');

const postData = JSON.stringify({
  entityType: 'inspectors',
  headers: ['name', 'title'],
  sampleRows: [['John', 'Engineer']]
});

const options = {
  hostname: 'localhost',
  port: 3002,
  path: '/api/batch-ai-map',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = http.request(options, (res) => {
  console.log('Status:', res.statusCode);
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Response:', data);
  });
});

req.on('error', (e) => {
  console.error('Error:', e.message);
});

req.write(postData);
req.end();