const client = require('prom-client');

// Create a Registry which registers the metrics
const register = new client.Registry();

// Add default labels to all metrics
register.setDefaultLabels({
	app: 'eliteronix-server'
});

// Enable default Node.js metrics
client.collectDefaultMetrics({ register });

// Define metrics
const osuApiRequests = new client.Counter({
	name: 'osu_api_requests',
	help: 'osu! API requests',
});
register.registerMetric(osuApiRequests);

const gamifyProcessQueueAccesses = new client.Counter({
	name: 'database_gamify_processQueue',
	help: 'Database gamify-processQueue accessed',
});
register.registerMetric(gamifyProcessQueueAccesses);

const multiGameScoresAccesses = new client.Counter({
	name: 'database_multiGameScores',
	help: 'Database multiGameScores accessed',
});
register.registerMetric(multiGameScoresAccesses);

const mainDataAccesses = new client.Counter({
	name: 'database_mainData',
	help: 'Database mainData accessed',
});
register.registerMetric(mainDataAccesses);

// Export everything you need
module.exports = {
	client,
	register,
	osuApiRequests,
	gamifyProcessQueueAccesses,
	multiGameScoresAccesses,
	mainDataAccesses,
};