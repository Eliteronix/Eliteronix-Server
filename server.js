const url = require('url');
require('dotenv').config();
const Greenlock = require('greenlock-express');

// Define the HTTP server
const requestHandler = async (req, res) => {
	// Retrieve route from request object
	const route = url.parse(req.url).pathname;

	let args = route.substring(1).split('/');

	try {
		let endpoint = require(`./routes/${args.shift()}.js`);

		endpoint.execute(req, res, args).catch((e) => {
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

	// Start the HTTP server which exposes the browsersources on http://localhost:80/duelRating/1234
	// const http = require('http');
	// const browserSourceServer = http.createServer(requestHandler);
	// browserSourceServer.listen(80, () => {
	// 	console.log('HTTP server running on http://localhost:80');
	// });

	// Uncomment the following lines to start an HTTPS server with self-signed certificates
	const https = require('https');
	const fs = require('fs');
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
	}).serve(requestHandler);
}

function returnBoolean(value) {
	if (value === 'false') return false;
	if (value === 'true') return true;
	return value;
}