const fs = require('fs');

module.exports = {
	async execute(req, res) {
		const urlParams = new URLSearchParams(req.url.split('?')[1]);
		const bingoId = urlParams.get('b');

		if (isNaN(bingoId)) {
			res.setHeader('Content-Type', 'text/plain');
			res.end('Invalid bingo id');
			return;
		}

		// Check if the image exists 
		if (!fs.existsSync(`${process.env.ELITEBOTIXROOTPATH}/bingocards/${bingoId}.png`)) {
			res.setHeader('Content-Type', 'text/plain');
			res.end('The bingo card does not exist');
			return;
		}

		// Send the image from the duelratingcards folder
		res.setHeader('Content-Type', 'image/png');
		res.end(fs.readFileSync(`${process.env.ELITEBOTIXROOTPATH}/bingocards/${bingoId}.png`));
	}
};