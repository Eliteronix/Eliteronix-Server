const fs = require('fs');

module.exports = {
	async execute(req, res) {
		const urlParams = new URLSearchParams(req.url.split('?')[1]);
		const mod = urlParams.get('m');

		if (!mod) {
			res.setHeader('Content-Type', 'text/plain');
			res.end('Invalid mod | m parameter must be given');
			return;
		}

		// Check if the zip exists
		if (!fs.existsSync(`${process.env.ELITEBOTIXROOTPATH}/other/mods/${mod}.png`)) {
			res.setHeader('Content-Type', 'text/plain');
			res.end('Invalid mod');
			return;
		}

		// Provide the zip file
		res.setHeader('Content-Type', 'image/png');
		res.end(fs.readFileSync(`${process.env.ELITEBOTIXROOTPATH}/other/mods/${mod}.png`));
	}
};