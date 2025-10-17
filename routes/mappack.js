const fs = require('fs');

module.exports = {
	async execute(req, res) {
		const urlParams = new URLSearchParams(req.url.split('?')[1]);
		const mappackId = urlParams.get('m');

		if (!mappackId) {
			res.setHeader('Content-Type', 'text/plain');
			res.end('Invalid mappack id | m parameter must be a given');
			return;
		}

		// Check if the zip exists
		if (!fs.existsSync(`${process.env.ELITEBOTIXROOTPATH}/mappacks/${mappackId}.zip`)) {
			res.setHeader('Content-Type', 'text/plain');
			res.end('Please create the mappack using /osu-mappool mappack');
			return;
		}

		// Provide the zip file
		res.setHeader('Content-Type', 'application/zip');
		res.end(fs.readFileSync(`${process.env.ELITEBOTIXROOTPATH}/mappacks/${mappackId}.zip`));
	}
};