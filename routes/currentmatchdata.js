const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const osu = require('node-osu');

let playerNames;

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

		// Fetch the current match data
		await fetch(`https://osu.ppy.sh/mp/${matchId}`)
			.then(async (res) => {
				let htmlCode = await res.text();
				htmlCode = htmlCode.replace(/&quot;/gm, '"');
				const matchRunningRegex = /{"match".+,"current_game_id":\d+}/gm;
				const matchPausedRegex = /{"match".+,"current_game_id":null}/gm;
				const matchesRunning = matchRunningRegex.exec(htmlCode);
				const matchesPaused = matchPausedRegex.exec(htmlCode);

				let regexMatch = null;
				if (matchesRunning && matchesRunning[0]) {
					regexMatch = matchesRunning[0];
				}

				if (matchesPaused && matchesPaused[0]) {
					regexMatch = matchesPaused[0];
				}

				let json = null;
				let latestEventId = null;

				if (regexMatch) {
					if (json) {
						// Theoretically something could be missing in between this batch of 100 events and the last batch
						// The chance for that happening is so low though that its not worth checking as it
						// would require a major delay between the two requests
						let oldJson = json;

						json = JSON.parse(regexMatch);

						let firstIdNewJson = json.events[0].id;

						// Add all old events that are not in the new array to the new array
						for (let i = 0; i < oldJson.events.length; i++) {
							if (oldJson.events[i].id < firstIdNewJson) {
								json.events.push(oldJson.events[i]);
							}
						}

						// Sort the array by id
						json.events.sort((a, b) => a.id - b.id);
					} else {
						json = JSON.parse(regexMatch);
					}

					if (!latestEventId) {
						latestEventId = json.latest_event_id - 1;
					}

					while (json.first_event_id !== json.events[0].id) {
						let earlierEvents = await fetch(`https://osu.ppy.sh/community/matches/${match.id}?before=${json.events[0].id}&limit=100`)
							.then(async (res) => {
								let htmlCode = await res.text();
								htmlCode = htmlCode.replace(/&quot;/gm, '"');
								const matchRunningRegex = /{"match".+,"current_game_id":\d+}/gm;
								const matchPausedRegex = /{"match".+,"current_game_id":null}/gm;
								const matchesRunning = matchRunningRegex.exec(htmlCode);
								const matchesPaused = matchPausedRegex.exec(htmlCode);

								if (matchesRunning && matchesRunning[0]) {
									regexMatch = matchesRunning[0];
								}

								if (matchesPaused && matchesPaused[0]) {
									regexMatch = matchesPaused[0];
								}

								let json = JSON.parse(regexMatch);

								return json.events;
							});

						json.events = earlierEvents.concat(json.events);
					}

					if (json.latest_event_id > latestEventId) {
						let playerUpdates = [];
						let currentPlayers = [];
						let redScore = 0; //Score on the left side / first slots
						let blueScore = 0; //Score on the right side / last slots
						let lastMapsetId = null;

						for (let i = 0; i < json.events.length; i++) {
							if (json.events[i].detail.type === 'other') {
								//Get the last map id
								if (json.events[i].game.beatmap_id) {
									lastMapsetId = json.events[i].game.beatmap.beatmapset.id;
								}

								//Reset player updates
								playerUpdates = [];

								//Get the scores of the teams
								let blueScores = json.events[i].game.scores.filter(score => score.match.team === 'blue');
								let redScores = json.events[i].game.scores.filter(score => score.match.team === 'red');

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

									if (blueTotalScore > redTotalScore) {
										blueScore++;
									} else if (blueTotalScore < redTotalScore) {
										redScore++;
									}
								} else if (json.events[i].game.scores.length === 2) {
									//Head to head
									let playerNames = match.name.split(/\) ?vs.? ?\(/gm);
									//basically a check if its a tourney match (basically)
									if (playerNames[1]) {
										let redPlayer = playerNames[0].replace(/.+\(/gm, '');
										let bluePlayer = playerNames[1].replace(')', '');

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

										if (blueTotal > redTotal) {
											blueScore++;
										} else if (blueTotal < redTotal) {
											redScore++;
										}
									}
								}
							} else if (json.events[i].detail.type === 'host-changed' && json.events[i].user_id) {
								let playerName = await getOsuPlayerName(json.events[i].user_id);
								playerUpdates.push(`<:exchangealtsolid:1005141205069344859> \`${playerName}\` became the host.`);
							} else if (json.events[i].detail.type === 'host-changed') {
								playerUpdates.push('<:exchangealtsolid:1005141205069344859> The host has been reset.');

								if (json.events[i].user_id === 0) {
									redScore = 0;
									blueScore = 0;
								}
							} else if (json.events[i].detail.type === 'player-joined') {
								let playerName = await getOsuPlayerName(json.events[i].user_id);
								playerUpdates.push(`<:arrowrightsolid:1005141207879536761> \`${playerName}\` joined the match.`);
								currentPlayers.push(playerName);
							} else if (json.events[i].detail.type === 'player-left') {
								let playerName = await getOsuPlayerName(json.events[i].user_id);
								playerUpdates.push(`<:arrowleftsolid:1005141359008682024> \`${playerName}\` left the match.`);
								currentPlayers = currentPlayers.filter(player => player !== playerName);
							} else if (json.events[i].detail.type === 'player-kicked') {
								let playerName = await getOsuPlayerName(json.events[i].user_id);
								playerUpdates.push(`<:bansolid:1032747189941829683> \`${playerName}\` has been kicked from the match.`);
								currentPlayers = currentPlayers.filter(player => player !== playerName);
							} else if (json.events[i].detail.type === 'match-disbanded') {
								playerUpdates.push('<:timessolid:1005141203819434104> The match has been closed.');
								finished = true;
							} else if (json.events[i].detail.type === 'match-created') {
								playerUpdates.push('<:plussolid:1005142572823494677> The match has been created.');
							} else {
								playerUpdates.push(`${json.events[i].detail.type}, ${json.events[i].user_id}`);
							}
						}

						responseJson = {
							"title": json.match.name,
							"redScore": redScore,
							"blueScore": blueScore,
							"playerUpdates": playerUpdates,
							"currentPlayers": currentPlayers,
							"finished": json.match.end_time,
							"lastMapsetId": lastMapsetId
						};
					}
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