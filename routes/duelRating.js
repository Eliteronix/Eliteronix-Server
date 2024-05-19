const fs = require('fs');

module.exports = {
	async execute(req, res, args) {
		const osuUserId = args[0];

		if (isNaN(osuUserId)) {
			res.setHeader('Content-Type', 'text/plain');
			res.end('Invalid osu! user id');
			return;
		}

		// Check if the image exists 
		if (!fs.existsSync(`${process.env.ELITEBOTIXROOTPATH}/duelratingcards/${osuUserId}.png`)) {
			res.setHeader('Content-Type', 'text/plain');
			res.end('Please create the image using /osu-duel rating');
			return;
		}

		// Send the image from the duelratingcards folder
		res.setHeader('Content-Type', 'image/png');
		res.end(fs.readFileSync(`${process.env.ELITEBOTIXROOTPATH}/duelratingcards/${osuUserId}.png`));
	}
};