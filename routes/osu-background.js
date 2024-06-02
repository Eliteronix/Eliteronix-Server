const fs = require('fs');

module.exports = {
	async execute(req, res) {

		// Send the default image from the assets folder
		res.setHeader('Content-Type', 'image/png');
		res.end(fs.readFileSync('./assets/osu-background.png'));
	}
};