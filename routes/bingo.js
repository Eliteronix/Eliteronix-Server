const fs = require('fs');

module.exports = {
	async execute(req, res) {
		// Send back an HTML file
		res.setHeader('Content-Type', 'text/html');
		res.end(fs.readFileSync('./webpages/bingo.html'));
	}
};