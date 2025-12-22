
const http = require('http');

const options = {
  hostname: 'localhost',
  port: 18081,
  path: '/licensing/status?t=1766260887763',
  method: 'GET'
};

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  res.setEncoding('utf8');
  res.on('data', (chunk) => {
    console.log(`BODY: ${chunk}`);
  });
  res.on('end', () => {
    console.log('No more data in response.');
  });
});

req.on('error', (e) => {
  console.error(`problem with request:`, e);
});

req.end();

