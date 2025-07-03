const fs = require('fs');

module.exports = {
	async execute(req, res) {
		const urlParams = new URLSearchParams(req.url.split('?')[1]);
		const userId = urlParams.get('u');

		if (!userId || isNaN(userId)) {
			// Send back an HTML file
			res.setHeader('Content-Type', 'text/html');
			res.end(fs.readFileSync('./webpages/matchoverlay-setup.html'));
			return;
		}

		// Send back an HTML file
		res.setHeader('Content-Type', 'text/html; charset=utf-8');
		res.end(fs.readFileSync('./webpages/matchoverlay.html'));
	}
};