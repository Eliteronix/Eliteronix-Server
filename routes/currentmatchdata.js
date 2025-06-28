const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const osu = require('node-osu');

let osuv2_access_token = null;
let playerNames;

const blueColour = '#2299BB';
const redColour = '#BB1177';

module.exports = {
	async execute(req, res) {
		const urlParams = new URLSearchParams(req.url.split('?')[1]);
		const matchId = urlParams.get('m');

		if (isNaN(matchId)) {
			res.setHeader('Content-Type', 'text/plain');
			res.end('Invalid match id');
			return;
		}

		let responseJson = null;

		await getNewOsuAPIv2TokenIfNecessary();

		const url = new URL(
			`https://osu.ppy.sh/api/v2/matches/${matchId}?limit=1`
		);

		const headers = {
			'Content-Type': 'application/json',
			'Accept': 'application/json',
			'Authorization': `Bearer ${osuv2_access_token}`
		};

		await fetch(url, {
			method: 'GET',
			headers,
		}).then(async (response) => {
			let json = await response.json();

			let latestEventId = json.latest_event_id - 1;

			while (json.first_event_id !== json.events[0].id) {
				await getNewOsuAPIv2TokenIfNecessary();

				const url = new URL(
					`https://osu.ppy.sh/api/v2/matches/${matchId}?before=${json.events[0].id}&limit=101`
				);

				const headers = {
					'Content-Type': 'application/json',
					'Accept': 'application/json',
					'Authorization': `Bearer ${osuv2_access_token}`
				};

				let earlierEvents = await fetch(url, {
					method: 'GET',
					headers,
				}).then(async (response) => {
					let json = await response.json();

					return json.events;
				});

				json.events = earlierEvents.concat(json.events);
			}

			if (json.latest_event_id > latestEventId) {
				let playerUpdates = [];
				let currentPlayers = [];
				let redScore = 0; //Score on the left side / first slots
				let blueScore = 0; //Score on the right side / last slots
				let currentMapsetId = null;
				let currentMapMods = null;
				let lastMapWinner = null;
				let redTeam = [];
				let blueTeam = [];

				for (let i = 0; i < json.events.length; i++) {
					currentMapsetId = null;
					currentMapMods = null;

					if (json.events[i].detail.type === 'other') {
						//Get the last map id
						if (json.events[i].game.beatmap_id && json.events[i].game.end_time === null) {
							currentMapsetId = json.events[i].game.beatmap.beatmapset.id;
							currentMapMods = json.events[i].game.mods;
						}

						//Reset player updates
						playerUpdates = [];

						//Get the scores of the teams
						let blueScores = json.events[i].game.scores.filter(score => score.match.team === 'blue');
						let redScores = json.events[i].game.scores.filter(score => score.match.team === 'red');

						for (let j = 0; j < blueScores.length; j++) {
							let playerName = await getOsuPlayerName(blueScores[j].user_id);

							if (blueTeam.indexOf(playerName) === -1) {
								blueTeam.push(playerName);
							}

							let wrongPlayerIndex = redTeam.indexOf(playerName);

							if (wrongPlayerIndex !== -1) {
								redTeam.splice(wrongPlayerIndex, 1);
							}
						}

						for (let j = 0; j < redScores.length; j++) {
							let playerName = await getOsuPlayerName(redScores[j].user_id);

							if (redTeam.indexOf(playerName) === -1) {
								redTeam.push(playerName);
							}

							let wrongPlayerIndex = blueTeam.indexOf(playerName);

							if (wrongPlayerIndex !== -1) {
								blueTeam.splice(wrongPlayerIndex, 1);
							}
						}

						if (blueScores.length || redScores.length) {
							//Team vs
							blueScores.sort((a, b) => b.score - a.score);
							redScores.sort((a, b) => b.score - a.score);

							let blueTotalScore = 0;
							for (let i = 0; i < blueScores.length; i++) {
								blueTotalScore += blueScores[i].score;
							}

							let redTotalScore = 0;
							for (let i = 0; i < redScores.length; i++) {
								redTotalScore += redScores[i].score;
							}

							let blueTeamNames = blueTeam.join(', ');
							let redTeamNames = redTeam.join(', ');

							if (blueTotalScore > redTotalScore) {
								blueScore++;

								lastMapWinner = 'blue';

								playerUpdates.push(`${blueTeamNames} won against ${redTeamNames}`);
								playerUpdates.push(`<span style="color:${blueColour};">${blueTotalScore}</span> to <span style="color:${redColour};">${redTotalScore}</span>`);
							} else if (blueTotalScore < redTotalScore) {
								redScore++;

								lastMapWinner = 'red';

								playerUpdates.push(`${redTeamNames} won against ${blueTeamNames}`);
								playerUpdates.push(`<span style="color:${redColour};">${redTotalScore}</span> to <span style="color:${blueColour};">${blueTotalScore}</span>`);
							}
						} else if (json.events[i].game.scores.length === 2) {
							//Head to head
							let playerNames = json.match.name.split(/\) ?vs.? ?\(/gm);
							//basically a check if its a tourney match (basically)
							if (playerNames[1]) {
								let redPlayer = playerNames[0].replace(/.+\(/gm, '');
								let bluePlayer = playerNames[1].replace(')', '');

								if (redTeam.indexOf(redPlayer) === -1) {
									redTeam.push(redPlayer);
								}

								if (blueTeam.indexOf(bluePlayer) === -1) {
									blueTeam.push(bluePlayer);
								}

								let wrongPlayerIndex = redTeam.indexOf(bluePlayer);

								if (wrongPlayerIndex !== -1) {
									redTeam.splice(wrongPlayerIndex, 1);
								}

								wrongPlayerIndex = blueTeam.indexOf(redPlayer);

								if (wrongPlayerIndex !== -1) {
									blueTeam.splice(wrongPlayerIndex, 1);
								}

								let redTotal = null;
								let blueTotal = null;

								for (let j = 0; j < json.events[i].game.scores.length; j++) {
									json.events[i].game.scores[j].username = await getOsuPlayerName(json.events[i].game.scores[j].user_id);
									if (json.events[i].game.scores[j].username === redPlayer) {
										redTotal = json.events[i].game.scores[j].score;
									}

									if (json.events[i].game.scores[j].username === bluePlayer) {
										blueTotal = json.events[i].game.scores[j].score;
									}
								}

								let blueTeamNames = blueTeam.join(', ');
								let redTeamNames = redTeam.join(', ');

								if (blueTotal > redTotal) {
									blueScore++;

									lastMapWinner = 'blue';

									playerUpdates.push(`${blueTeamNames} won against ${redTeamNames}`);
									playerUpdates.push(`<span style="color:${blueColour};">${blueTotal}</span> to <span style="color:${redColour};">${redTotal}</span>`);
								} else if (blueTotal < redTotal) {
									redScore++;

									lastMapWinner = 'red';

									playerUpdates.push(`${redTeamNames} won against ${blueTeamNames}`);
									playerUpdates.push(`<span style="color:${redColour};">${redTotal}</span> to <span style="color:${blueColour};">${blueTotal}</span>`);
								}
							}
						}
					} else if (json.events[i].detail.type === 'host-changed' && json.events[i].user_id) {
						let playerName = await getOsuPlayerName(json.events[i].user_id);
						playerUpdates.push(`${playerName} became the host.`);
					} else if (json.events[i].detail.type === 'host-changed') {
						playerUpdates.push('The host has been reset.');

						if (json.events[i].user_id === 0) {
							redScore = 0;
							blueScore = 0;

							lastMapWinner = null;
						}
					} else if (json.events[i].detail.type === 'player-joined') {
						let playerName = await getOsuPlayerName(json.events[i].user_id);
						playerUpdates.push(`${playerName} joined`);
						currentPlayers.push(playerName);
					} else if (json.events[i].detail.type === 'player-left') {
						let playerName = await getOsuPlayerName(json.events[i].user_id);
						playerUpdates.push(`${playerName} left`);
						currentPlayers = currentPlayers.filter(player => player !== playerName);
					} else if (json.events[i].detail.type === 'player-kicked') {
						let playerName = await getOsuPlayerName(json.events[i].user_id);
						playerUpdates.push(`${playerName} has been kicked`);
						currentPlayers = currentPlayers.filter(player => player !== playerName);
					} else if (json.events[i].detail.type === 'match-disbanded') {
						playerUpdates.push('');

						let teamNames = json.match.name.split(/\) ?vs.? ?\(/gm);

						if (teamNames[1] && redScore > blueScore) {

							playerUpdates.push(`<b><span style="color:${redColour};">${teamNames[0].replace(/.+\(/gm, '')}</span></b> won the match.`);
						} else if (teamNames[1] && redScore < blueScore) {
							playerUpdates.push(`<b><span style="color:${blueColour};">${teamNames[1].replace(')', '')}</span></b> won the match.`);
						} else {
							playerUpdates.push('The match is over');
						}
					} else if (json.events[i].detail.type === 'match-created') {
						playerUpdates.push('The match has been created.');
					} else {
						playerUpdates.push(`${json.events[i].detail.type}, ${json.events[i].user_id}`);
					}
				}

				for (let i = 0; i < playerUpdates.length; i++) {
					for (let j = 0; j < redTeam.length; j++) {
						if (playerUpdates[i].includes(redTeam[j])) {
							playerUpdates[i] = playerUpdates[i].replace(redTeam[j], `<b><span style="color:${redColour};">${redTeam[j]}</span></b>`);
							break;
						}
					}

					for (let j = 0; j < blueTeam.length; j++) {
						if (playerUpdates[i].includes(blueTeam[j])) {
							playerUpdates[i] = playerUpdates[i].replace(blueTeam[j], `<b><span style="color:${blueColour};">${blueTeam[j]}</span></b>`);
							break;
						}
					}
				}

				responseJson = {
					'title': json.match.name,
					'redScore': redScore,
					'blueScore': blueScore,
					'playerUpdates': playerUpdates,
					'currentPlayers': currentPlayers,
					'finished': json.match.end_time,
					'currentMapsetId': currentMapsetId,
					'currentMapMods': currentMapMods,
					'lastMapWinner': lastMapWinner,
					'redTeam': redTeam,
					'blueTeam': blueTeam
				};
			}
		});

		res.setHeader('Content-Type', 'application/json');
		return res.end(JSON.stringify(responseJson));
	}
};

async function getOsuPlayerName(osuUserId) {
	if (playerNames && playerNames[osuUserId]) {
		return playerNames[osuUserId];
	}

	const osuApi = new osu.Api(process.env.OSUTOKENV1, {
		// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
		notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
		completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
		parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
	});

	const osuUser = await osuApi.getUser({ u: osuUserId });
	if (osuUser) {
		if (!playerNames) {
			playerNames = {};
		}

		playerNames[osuUserId] = osuUser.name;
		return osuUser.name;
	}

	return osuUserId;
}

async function getNewOsuAPIv2TokenIfNecessary() {
	if (osuv2_access_token) {
		return;
	}

	const url = new URL(
		'https://osu.ppy.sh/oauth/token'
	);

	const headers = {
		'Accept': 'application/json',
		'Content-Type': 'application/x-www-form-urlencoded',
	};

	let body = `client_id=${process.env.OSUCLIENTID}&client_secret=${process.env.OSUTOKENV2}&grant_type=client_credentials&scope=public`;

	await fetch(url, {
		method: 'POST',
		headers,
		body: body,
	}).then(async (response) => {
		let json = await response.json();

		osuv2_access_token = json.access_token;

		setTimeout(() => {
			osuv2_access_token = null;
		}, json.expires_in * 1000);
	});
}