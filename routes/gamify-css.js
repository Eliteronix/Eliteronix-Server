const fs = require('fs');

module.exports = {
	async execute(req, res) {
		// Send back an HTML file
		res.setHeader('Content-Type', 'text/css');
		res.end(fs.readFileSync('./css/gamify.css'));
	}
};