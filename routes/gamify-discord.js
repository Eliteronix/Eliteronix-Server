const fs = require('fs');
const { DBGamifyTasks } = require('../dbObjects');

module.exports = {
	async execute(req, res) {
		const urlParams = new URLSearchParams(req.url.split('?')[1]);
		const code = urlParams.get('code');

		if (!code) {
			res.setHeader('Content-Type', 'text/plain');
			res.end('Invalid response');
			return;
		}

		// If the code is valid, get the access token and guilds
		let accessToken = await fetch('https://discord.com/api/oauth2/token', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
			},
			body: new URLSearchParams({
				'client_id': process.env.DISCORDCLIENTID,
				'client_secret': process.env.DISCORDCLIENTSECRET,
				'grant_type': 'authorization_code',
				'code': code,
				'redirect_uri': process.env.REDIRECTURI,
			}),
		}).then(res => res.json()).catch(err => {
			console.error('Error fetching access token:', err);
			res.setHeader('Content-Type', 'text/plain');
			res.end('Error fetching access token');
			return null;
		});

		if (!accessToken || !accessToken.access_token) {
			res.setHeader('Content-Type', 'text/plain');
			res.end('Failed to retrieve access token');
			return;
		}

		// Fetch the user's guilds
		let guilds = await fetch('https://discord.com/api/users/@me/guilds', {
			method: 'GET',
			headers: {
				'Authorization': `Bearer ${accessToken.access_token}`,
				'Content-Type': 'application/json',
			},
		}).then(res => res.json()).catch(err => {
			console.error('Error fetching guilds:', err);
			res.setHeader('Content-Type', 'text/plain');
			res.end('Error fetching guilds');
			return null;
		});

		let gamifyGuilds = await DBGamifyTasks.findAll({
			attributes: ['guildId'],
			distinct: true,
			where: {
				guildId: guilds.map(guild => guild.id),
			},
		});

		let guildsWithGamifyData = guilds.filter(guild => {
			return gamifyGuilds.some(gamifyGuild => gamifyGuild.guildId === guild.id);
		});

		// Remove the unnecessary properties from the guild objects
		guildsWithGamifyData = guildsWithGamifyData.map(guild => ({
			id: guild.id,
			name: guild.name,
			icon: guild.icon,
		}));

		const oauthData = {
			userGuilds: guildsWithGamifyData,
			accessToken: accessToken.access_token,
			refreshToken: accessToken.refresh_token,
			expiresIn: accessToken.expires_in,
			tokenType: accessToken.token_type,
			scope: accessToken.scope,
		};

		let gamifyHtml = fs.readFileSync('./webpages/gamify.html', 'utf8');
		gamifyHtml = gamifyHtml
			.replace('{{DISCORDCLIENTID}}', process.env.DISCORDCLIENTID)
			.replace('{{OAUTH_DATA}}', JSON.stringify(oauthData));

		// Send back an html page
		res.setHeader('Content-Type', 'text/html');
		res.end(gamifyHtml);
	}
};