const Sequelize = require('sequelize');
const { multiGameScoresAccesses, gamifyProcessQueueAccesses, mainDataAccesses } = require('../metrics');

const multiGameScores = new Sequelize('database', 'username', 'password', {
	host: 'localhost',
	dialect: 'sqlite',
	logging: async () => {
		multiGameScoresAccesses.inc();
	},
	storage: `${process.env.ELITEBOTIXROOTPATH}/databases/multiGameScores.sqlite`,
	retry: {
		max: 25, // Maximum retry 15 times
		backoffBase: 100, // Initial backoff duration in ms. Default: 100,
		backoffExponent: 1.14, // Exponent to increase backoff each try. Default: 1.1
	},
	pool: {
		max: 7,
	}
});

const gamifyProcessQueue = new Sequelize('database', 'username', 'password', {
	host: 'localhost',
	dialect: 'sqlite',
	logging: async () => {
		gamifyProcessQueueAccesses.inc();
	},
	storage: `${process.env.GAMIFYROOTPATH}/databases/processQueue.sqlite`,
	retry: {
		max: 25, // Maximum retry 15 times
		backoffBase: 100, // Initial backoff duration in ms. Default: 100,
		backoffExponent: 1.14, // Exponent to increase backoff each try. Default: 1.1
	},
	pool: {
		max: 7,
	}
});

const gamifyMainData = new Sequelize('database', 'username', 'password', {
	host: 'localhost',
	dialect: 'sqlite',
	logging: async () => {
		mainDataAccesses.inc();
	},
	storage: `${process.env.GAMIFYROOTPATH}/databases/mainData.sqlite`,
	retry: {
		max: 25, // Maximum retry 15 times
		backoffBase: 100, // Initial backoff duration in ms. Default: 100,
		backoffExponent: 1.14, // Exponent to increase backoff each try. Default: 1.1
	},
	pool: {
		max: 7,
	}
});

const DBOsuMultiGameScores = require(`${process.env.ELITEBOTIXROOTPATH}/models/DBOsuMultiGameScores`)(multiGameScores, Sequelize.DataTypes);

const DBGamifyProcessQueue = require(`${process.env.GAMIFYROOTPATH}/models/DBProcessQueue`)(gamifyProcessQueue, Sequelize.DataTypes);
const DBGamifyCategories = require(`${process.env.GAMIFYROOTPATH}/models/DBCategories`)(gamifyMainData, Sequelize.DataTypes);
const DBGamifyTaskCategories = require(`${process.env.GAMIFYROOTPATH}/models/DBTaskCategories`)(gamifyMainData, Sequelize.DataTypes);
const DBGamifyTasks = require(`${process.env.GAMIFYROOTPATH}/models/DBTasks`)(gamifyMainData, Sequelize.DataTypes);

module.exports = {
	DBOsuMultiGameScores,
	DBGamifyProcessQueue,
	DBGamifyCategories,
	DBGamifyTaskCategories,
	DBGamifyTasks,
};
