const fs = require('fs');

module.exports = {
	async execute(req, res) {
		const urlParams = new URLSearchParams(req.url.split('?')[1]);
		const year = urlParams.get('y');
		const osuUserId = urlParams.get('u');

		if (!year || isNaN(year)) {
			res.setHeader('Content-Type', 'text/plain');
			res.end('Invalid osu! user id | y parameter must be a number');
			return;
		}

		if (!osuUserId || isNaN(osuUserId)) {
			res.setHeader('Content-Type', 'text/plain');
			res.end('Invalid osu! user id | u parameter must be a number');
			return;
		}

		// Check if the image exists
		if (!fs.existsSync(`${process.env.ELITEBOTIXROOTPATH}/wrappedcards/${year}/${osuUserId}.png`)) {
			res.setHeader('Content-Type', 'text/plain');
			res.end(`Please create the image using /osu-wrapped year:${year}`);
			return;
		}

		// Send the image from the duelratingcards folder
		res.setHeader('Content-Type', 'image/png');
		res.end(fs.readFileSync(`${process.env.ELITEBOTIXROOTPATH}/wrappedcards/${year}/${osuUserId}.png`));
	}
};