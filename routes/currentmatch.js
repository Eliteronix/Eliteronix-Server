const { DBOsuMultiGameScores } = require('../dbObjects');

module.exports = {
	async execute(req, res) {
		const urlParams = new URLSearchParams(req.url.split('?')[1]);
		const playerId = urlParams.get('u');

		if (isNaN(playerId)) {
			res.setHeader('Content-Type', 'text/plain');
			res.end('Invalid player id');
			return;
		}

		let lastMatchScore = await DBOsuMultiGameScores.findOne({
			attributes: ['matchId', 'osuUserId'],
			where: {
				osuUserId: playerId,
				tourneyMatch: true
			},
			order: [['gameId', 'DESC']]
		});

		res.setHeader('Content-Type', 'application/json');
		res.end(JSON.stringify(lastMatchScore.dataValues));
	}
};