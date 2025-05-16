module.exports = {
	async execute(req, res) {
		const urlParams = new URLSearchParams(req.url.split('?')[1]);
		const guildId = urlParams.get('g');

		if (!guildId || isNaN(guildId)) {
			res.setHeader('Content-Type', 'text/plain');
			res.end('Invalid guildId');
			return;
		}

		// Send back an html page
		res.setHeader('Content-Type', 'text/html');
		res.end('./webpages/gamify.html');
	}
};