const fs = require('fs');

module.exports = {
	async execute(req, res) {
		const urlParams = new URLSearchParams(req.url.split('?')[1]);
		const playerId = urlParams.get('u');

		if (isNaN(playerId)) {
			res.setHeader('Content-Type', 'text/plain');
			res.end('Invalid player id');
			return;
		}

		// Check if the json exists 
		if (!fs.existsSync(`${process.env.ELITEBOTIXROOTPATH}/currentbingo/${playerId}.json`)) {
			res.setHeader('Content-Type', 'application/json');
			res.end(JSON.stringify({}));
			return;
		}

		// Send the json from the currentbingo folder
		res.setHeader('Content-Type', 'application/json');
		res.end(fs.readFileSync(`${process.env.ELITEBOTIXROOTPATH}/currentbingo/${playerId}.json`));
	}
};