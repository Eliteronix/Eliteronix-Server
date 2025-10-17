const { DBOsuMultiGameScores } = require('../../../dbObjects');

module.exports = {
	async execute(req, res) {
		const urlParams = new URLSearchParams(req.url.split('?')[1]);
		const osuUserId = urlParams.get('u');

		if (!osuUserId || isNaN(osuUserId)) {
			res.setHeader('Content-Type', 'text/plain');
			res.end('Invalid osu! user id | u parameter must be a number');
			return;
		}

		let tourneyMatch = true;

		if (urlParams.get('tourney') && urlParams.get('tourney') === '0') {
			tourneyMatch = false;
		}

		let playerMatches = await DBOsuMultiGameScores.findAll({
			attributes: ['matchId'],
			where: {
				osuUserId: osuUserId,
				tourneyMatch: tourneyMatch
			},
			group: ['matchId'],
			order: [['matchId', 'ASC']]
		});

		const matchIds = playerMatches.map(pm => pm.matchId);

		let response = {
			osuUserId: osuUserId,
			tourneyMatch: tourneyMatch,
			matchIds: matchIds
		};

		res.setHeader('Content-Type', 'application/json');
		res.end(JSON.stringify(response));
	}
};