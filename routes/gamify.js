const fs = require('fs');

module.exports = {
	async execute(req, res) {
		const urlParams = new URLSearchParams(req.url.split('?')[1]);
		const guildId = urlParams.get('g');

		if (!guildId || isNaN(guildId)) {
			let gamifyHtml = fs.readFileSync('./webpages/gamify.html', 'utf8');
			gamifyHtml = gamifyHtml
				.replace('{{DISCORDCLIENTID}}', process.env.DISCORDCLIENTID)
				.replace('{{OAUTH_DATA}}', '{}');

			// Send back an html page
			res.setHeader('Content-Type', 'text/html');
			res.end(gamifyHtml);
			return;
		}
		
		let gamifyGuildHtml = fs.readFileSync('./webpages/gamify-guild.html', 'utf8');
		gamifyGuildHtml = gamifyGuildHtml
			.replace('{{DISCORDCLIENTID}}', process.env.DISCORDCLIENTID);

		// Send back an html page
		res.setHeader('Content-Type', 'text/html');
		res.end(gamifyGuildHtml);
	}
};