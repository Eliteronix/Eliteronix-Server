const fs = require('fs');

module.exports = {
	async execute(req, res) {
		const urlParams = new URLSearchParams(req.url.split('?')[1]);
		const asset = urlParams.get('a');

		if (!asset || fs.existsSync(`./assets/${asset}`) === false) {
			res.statusCode = 404;
			res.end('Asset not found');
			return;
		}

		const assetPath = `./assets/${asset}`;
		const assetType = assetPath.split('.').pop();
		let contentType;
		switch (assetType) {
			case 'ttf':
				contentType = 'font/ttf';
				break;
			case 'png':
				contentType = 'image/png';
				break;
			case 'jpg':
			case 'jpeg':
				contentType = 'image/jpeg';
				break;
			default:
				contentType = 'application/octet-stream';
		}

		res.setHeader('Content-Type', contentType);
		res.end(fs.readFileSync(assetPath));
	}
};