const { DBGamifyTasks, DBGamifyProcessQueue } = require('../dbObjects');

module.exports = {
	async execute(req, res) {
		const urlParams = new URLSearchParams(req.url.split('?')[1]);
		const guildId = urlParams.get('g');

		if (!guildId || isNaN(guildId)) {
			res.setHeader('Content-Type', 'text/plain');
			res.end('Invalid guildId');
			return;
		}

		const task = urlParams.get('t');

		if (!task) {
			res.setHeader('Content-Type', 'text/plain');
			res.end('Invalid task');
			return;
		}

		// Get the task from the database
		const taskEntry = await DBGamifyTasks.findOne({
			where: {
				guildId: guildId,
				name: task
			}
		});

		if (!taskEntry) {
			res.setHeader('Content-Type', 'text/plain');
			res.end('Task not found');
			return;
		}

		// Update task status and trigger update
		await DBGamifyProcessQueue.create({
			guildId: guildId,
			task: 'setOpen',
			additions: taskEntry.id,
			date: new Date()
		});

		res.setHeader('Content-Type', 'text/plain');
		res.end('updated task status');
	}
};