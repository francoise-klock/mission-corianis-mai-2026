const http = require('http');
const fs = require('fs');
const path = require('path');
const https = require('https');

const PORT = process.env.PORT || 3000;
const BIN_ID = '69fb276daaba8821977a1fb3';
const MASTER_KEY = process.env.JSONBIN_KEY;

function jsonbinGet(cb) {
  var options = {
    hostname: 'api.jsonbin.io',
    path: '/v3/b/' + BIN_ID + '/latest',
    method: 'GET',
    headers: {
      'X-Master-Key': MASTER_KEY
    }
  };
  var req = https.request(options, function(res) {
    var body = '';
    res.on('data', function(c){ body += c; });
    res.on('end', function() {
      try { cb(null, JSON.parse(body).record); }
      catch(e) { cb(e); }
    });
  });
  req.on('error', cb);
  req.end();
}

function jsonbinSet(data, cb) {
  var body = JSON.stringify(data);
  var options = {
    hostname: 'api.jsonbin.io',
    path: '/v3/b/' + BIN_ID,
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Master-Key': MASTER_KEY,
      'Content-Length': Buffer.byteLength(body)
    }
  };
  var req = https.request(options, function(res) {
    var b = '';
    res.on('data', function(c){ b += c; });
    res.on('end', function() { cb(null); });
  });
  req.on('error', cb);
  req.write(body);
  req.end();
}

http.createServer(function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  if (req.url === '/api/data' && req.method === 'GET') {
    jsonbinGet(function(err, data) {
      if (err) { res.writeHead(500); res.end('Error'); return; }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(data));
    });
    return;
  }

  if (req.url === '/api/data' && req.method === 'POST') {
    var body = '';
    req.on('data', function(c){ body += c; });
    req.on('end', function() {
      try {
        var data = JSON.parse(body);
        jsonbinSet(data, function(err) {
          if (err) { res.writeHead(500); res.end('Error'); return; }
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end('{"ok":true}');
        });
      } catch(e) { res.writeHead(400); res.end('Bad JSON'); }
    });
    return;
  }

  if (req.url.match(/\.(png|jpg|jpeg|gif|svg|ico)$/)) {
    var ext = req.url.split('.').pop().toLowerCase();
    var types = { png:'image/png', jpg:'image/jpeg', jpeg:'image/jpeg', gif:'image/gif', svg:'image/svg+xml', ico:'image/x-icon' };
    fs.readFile(path.join(__dirname, req.url), function(err, data) {
      if (err) { res.writeHead(404); res.end('Not found'); return; }
      res.writeHead(200, { 'Content-Type': types[ext] });
      res.end(data);
    });
    return;
  }

  if (req.url === '/' || req.url === '/index.html') {
    fs.readFile(path.join(__dirname, 'index.html'), function(err, data) {
      if (err) { res.writeHead(404); res.end('Not found'); return; }
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(data);
    });
    return;
  }

  res.writeHead(404); res.end('Not found');
}).listen(PORT, function() {
  console.log('Serveur lance sur le port ' + PORT);
});
