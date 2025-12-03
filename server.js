const url = require('url');
const https = require('https');
const http = require('http');
const fs = require('fs');

const originalConsoleError = console.error;
const { totalErrorCount } = require('./metrics.js');

console.error = function (...args) {
	totalErrorCount.inc();
	originalConsoleError.apply(console, args);
};

require('dotenv').config();
const Greenlock = require('greenlock-express');

const { register } = require('./metrics.js');

// Define the HTTP server
const server = http.createServer(async (req, res) => {
	// Retrieve route from request object
	const route = url.parse(req.url).pathname;

	if (route === '/metrics') {
		// Return all metrics the Prometheus exposition format
		res.setHeader('Content-Type', register.contentType);
		res.end(await register.metrics());
	}
});

// Start the HTTP server which exposes the metrics on http://localhost:8083/metrics
server.listen(8083);

// Define the HTTP server
const requestHandler = async (req, res) => {
	// Retrieve route from request object
	const route = url.parse(req.url).pathname;

	try {
		if (req.url.startsWith('/grafana')) {
			return proxyToGrafana(req, res);
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
	const proxyReq = http.request(
		{
			hostname: 'localhost',
			port: 3000,
			path: req.url, // forward the full /grafana/... path
			method: req.method,
			headers: {
				...req.headers,
				host: 'www.eliteronix.de',                  // match public domain
				origin: 'https://www.eliteronix.de/grafana' // match root_url
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