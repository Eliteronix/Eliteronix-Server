const fs = require('fs');

module.exports = {
	async execute(req, res) {

		// Send the font from the assets folder
		// allow cors
		res.setHeader('Access-Control-Allow-Origin', '*');
		res.setHeader('Content-Type', 'font/ttf');
		res.end(fs.readFileSync('./assets/Comfortaa-Regular.ttf'));
	}
};