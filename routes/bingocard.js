const fs = require('fs');

module.exports = {
	async execute(req, res) {
		const urlParams = new URLSearchParams(req.url.split('?')[1]);
		const bingoId = urlParams.get('b');

		// Check if the image exists or if its older than 15 minutes
		if (!bingoId ||
			!fs.existsSync(`${process.env.ELITEBOTIXROOTPATH}/bingocards/${bingoId}.png`) ||
			(Date.now() - fs.statSync(`${process.env.ELITEBOTIXROOTPATH}/bingocards/${bingoId}.png`).mtimeMs) > 900000) {
			// Send the default image from the assets folder
			res.setHeader('Content-Type', 'image/png');
			res.end(fs.readFileSync('./assets/bingo-default.png'));
			return;
		}

		// Send the image from the bingocards folder
		res.setHeader('Content-Type', 'image/png');
		res.end(fs.readFileSync(`${process.env.ELITEBOTIXROOTPATH}/bingocards/${bingoId}.png`));
	}
};