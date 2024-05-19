const fs = require('fs');

module.exports = {
	async execute(req, res, args) {
		const year = args[0];

		if (isNaN(year)) {
			res.setHeader('Content-Type', 'text/plain');
			res.end('Invalid year');
			return;
		}

		const osuUserId = args[1];

		if (isNaN(osuUserId)) {
			res.setHeader('Content-Type', 'text/plain');
			res.end('Invalid osu! user id');
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