const url = require('url');
const https = require('https');
const http = require('http');
const fs = require('fs');
require('dotenv').config();
const Greenlock = require('greenlock-express');

// Define the HTTP server
const requestHandler = async (req, res) => {
	// Retrieve route from request object
	const route = url.parse(req.url).pathname;

	try {
		if (req.url.startsWith('/grafana')) {
			return proxyToGrafana(req, res);
		}

		if (req.url.startsWith('/prometheus')) {
			return proxyToPrometheus(req, res);
		}

		let endpoint = require(`./routes/${route}.js`);

		endpoint.execute(req, res).catch((e) => {
			console.error(e);

			// If an error occurs, return a 500
			res.statusCode = 500;
			res.setHeader('Content-Type', 'text/plain');
			res.end('Internal server error');
		});
	} catch (error) {
		if (error.code === 'MODULE_NOT_FOUND') {
			// console.error('Route not found:', route);
		} else {
			console.error(route, error);
		}

		// If the route does not exist, return a 404
		res.statusCode = 404;
		res.setHeader('Content-Type', 'text/plain');
		res.end(`Not found | ${route}`);
	}
};

if (returnBoolean(process.env.STAGING)) {
	// eslint-disable-next-line no-console
	console.log('Running in staging mode without greenlock');

	const options = {
		key: fs.readFileSync('localcert/localhost.key'),
		cert: fs.readFileSync('localcert/localhost.crt'),
	};

	const browserSourceServer = https.createServer(options, requestHandler);
	browserSourceServer.listen(443, () => {
		// eslint-disable-next-line no-console
		console.log('HTTPS server running on https://localhost:443');
	});
} else {
	// Greenlock setup
	Greenlock.init({
		packageRoot: __dirname,
		configDir: './greenlock.d',
		maintainerEmail: 'zimmermann.mariomarvin@gmail.com',
		cluster: false,
		agreeToTerms: true,
		staging: returnBoolean(process.env.STAGING),
		debug: false,
		notify: (event, details) => {
			if (event !== 'servername_unknown') {
				// eslint-disable-next-line no-console
				console.log('Greenlock event:', event, details);
			}
		},
	}).serve(requestHandler);
}

function returnBoolean(value) {
	if (value === 'false') return false;
	if (value === 'true') return true;
	return value;
}

function proxyToGrafana(req, res) {
	const url = new URL(req.url.replace(/^\/grafana/, '') || '/', 'http://localhost:3000');

	const proxyReq = http.request(
		{
			hostname: 'localhost',
			port: 3000,
			path: url.pathname + url.search,
			method: req.method,
			headers: {
				...req.headers,
				host: 'localhost:3000',
			},
		},
		proxyRes => {
			res.writeHead(proxyRes.statusCode, proxyRes.headers);
			proxyRes.pipe(res, { end: true });
		}
	);

	proxyReq.on('error', err => {
		res.writeHead(502);
		res.end(`Grafana proxy error: ${err.message}`);
	});

	req.pipe(proxyReq, { end: true });
}

function proxyToPrometheus(req, res) {
	const url = req.url.replace(/^\/prometheus/, ''); // remove /prometheus prefix

	const proxyReq = http.request({
		hostname: 'localhost',
		port: 9090,
		path: url,
		method: req.method,
		headers: {
			...req.headers,
			host: 'localhost:9090',
		},
	}, proxyRes => {
		res.writeHead(proxyRes.statusCode, proxyRes.headers);
		proxyRes.pipe(res, { end: true });
	});

	proxyReq.on('error', err => {
		res.writeHead(502);
		res.end(`Prometheus proxy error: ${err.message}`);
	});

	req.pipe(proxyReq, { end: true });
}