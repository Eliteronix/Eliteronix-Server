const http = require('http');
const url = require('url');
require('dotenv').config();
const Greenlock = require('greenlock');

// Define the HTTP server
const browserSourceServer = http.createServer(async (req, res) => {
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
});

// eslint-disable-next-line no-console
//console.log('Server running on port 80');

// Start the HTTP server which exposes the browsersources on http://localhost:80/duelRating/1234
//browserSourceServer.listen(80);

// Start the HTTPS server which exposes the browsersources on https://localhost:443/duelRating/1234
// browserSourceServer.listen(443);

// Greenlock setup
Greenlock.create({
	packageRoot: __dirname,
	configDir: './greenlock.d',
	maintainerEmail: 'you@example.com',
	cluster: false,
	agreeToTerms: true,
	sites: [
		{
			subject: 'yourdomain.com',
			altnames: ['yourdomain.com', 'www.yourdomain.com']
		}
	]
}).ready(glx => {
	// Start HTTP server (needed for Let's Encrypt challenge)
	http.createServer(glx.middleware(requestHandler)).listen(80, () => {
		console.log('HTTP server running on port 80');
	});

	// Start HTTPS server
	require('https')
		.createServer(glx.httpsOptions, glx.middleware(requestHandler))
		.listen(443, () => {
			console.log('HTTPS server running on port 443');
		});
});