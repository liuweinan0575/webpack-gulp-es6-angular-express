import express from 'express';
import path from 'path';
import http from 'http';

import datasets from './datasets';

let production = (process.env.NODE_ENV === 'production');

let app = express();

let server = http.createServer(app);

app.use('/datasets', datasets);

if (!production) {
  let httpProxy = require('http-proxy');
  let proxy = httpProxy.createProxyServer();

  app.all('*', function(req, res) {
    proxy.web(req, res, {
      target: 'http://localhost:3000'
    });
  });

  proxy.on('error', function(e) {
    console.log('Could not connect to proxy, please try again...');
  });

} else {
  app.use(express.static(path.join(__dirname, '../../build/website')));
}

export default server;
