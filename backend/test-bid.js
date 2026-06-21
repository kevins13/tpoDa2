const http = require('http');

const data = JSON.stringify({ amount: 46000 });

const req = http.request({
  hostname: 'localhost',
  port: 3000,
  path: '/api/bids/auction/0d49ff05-8263-4dca-b9e9-b36bcbb80523',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
}, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Body:', body);
  });
});

req.on('error', e => console.error(e));
req.write(data);
req.end();
