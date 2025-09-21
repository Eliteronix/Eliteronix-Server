const { DBGamifyCategories, DBGamifyTasks, DBGamifyTaskCategories } = require('../dbObjects');

module.exports = {
	async execute(req, res) {
		const urlParams = new URLSearchParams(req.url.split('?')[1]);
		const guildId = urlParams.get('g');

		if (!guildId || isNaN(guildId)) {
			res.setHeader('Content-Type', 'text/plain');
			res.end('Invalid guildId');
			return;
		}

		let categories = await DBGamifyCategories.findAll({
			attributes: [
				'id',
				'name',
				'streakStartDate',
				'streakEndDate'
			],
			where: {
				guildId: guildId
			}
		});

		if (categories.length === 0) {
			res.setHeader('Content-Type', 'application/json');
			res.end(JSON.stringify({}));
			return;
		}

		categories = categories.map(c => {
			return {
				id: c.id,
				name: c.name,
				streakStartDate: c.streakStartDate,
				streakEndDate: c.streakEndDate
			};
		});

		let tasks = await DBGamifyTasks.findAll({
			attributes: [
				'id',
				'name',
				'type',
				'amount',
				'reductionPerHour',
				'done',
				'dateLastDone',
				'dateReopen',
				'resetEveryHours',
				'resetEveryDays',
				'dateOfLastReminder',
				'remindEveryHours',
				'peopleToRemind',
				'streakStartDate',
				'streakEndDate',
				'streak'
			],
			where: {
				guildId: guildId
			},
			order: [
				['done', 'ASC']
			]
		});

		if (tasks.length === 0) {
			res.setHeader('Content-Type', 'application/json');
			res.end(JSON.stringify(categories));
			return;
		}

		tasks = tasks.map(t => {
			return {
				id: t.id,
				name: t.name,
				type: t.type,
				amount: t.amount,
				reductionPerHour: t.reductionPerHour,
				done: t.done,
				dateLastDone: t.dateLastDone,
				dateReopen: t.dateReopen,
				resetEveryHours: t.resetEveryHours,
				resetEveryDays: t.resetEveryDays,
				dateOfLastReminder: t.dateOfLastReminder,
				remindEveryHours: t.remindEveryHours,
				peopleToRemind: t.peopleToRemind,
				streakStartDate: t.streakStartDate,
				streakEndDate: t.streakEndDate,
				streak: t.streak
			};
		});

		let taskCategoryConnections = await DBGamifyTaskCategories.findAll({
			attributes: [
				'id',
				'guildId',
				'categoryId',
				'taskId',
				'weight',
				'type'
			],
			where: {
				guildId: guildId
			}
		});

		categories.unshift({
			id: 0,
			name: 'uncategorized'
		});

		for (let i = 0; i < categories.length; i++) {
			let tasksInCategory = [];

			if (categories[i].name === 'uncategorized') {
				tasksInCategory = tasks.filter(t => taskCategoryConnections.filter(tc => tc.taskId === t.id).length === 0);
			} else {
				tasksInCategory = tasks.filter(t => taskCategoryConnections.find(tc => tc.taskId === t.id && tc.categoryId === categories[i].id));
			}

			let percentageDone = 'None';

			if (tasksInCategory.length > 0) {
				if (categories[i].name === 'uncategorized') {
					percentageDone = (tasksInCategory.filter(t => t.done).length / tasksInCategory.length * 100).toFixed(0) + '%';
				} else {
					let totalWeight = 0;
					let doneWeight = 0;

					for (let j = 0; j < tasksInCategory.length; j++) {
						let taskCategoryConnection = taskCategoryConnections.find(tc => tc.taskId === tasksInCategory[j].id && tc.categoryId === categories[i].id);

						tasksInCategory[j].weight = taskCategoryConnection.weight;
						tasksInCategory[j].weightType = taskCategoryConnection.type;

						totalWeight += taskCategoryConnection.weight;

						if (tasksInCategory[j].done) {
							doneWeight += taskCategoryConnection.weight;
						}
					}

					percentageDone = (doneWeight / totalWeight * 100).toFixed(0) + '%';
				}
			}

			categories[i].tasks = tasksInCategory;

			categories[i].percentageDone = percentageDone;
		}

		// Send back a json
		res.setHeader('Content-Type', 'application/json');
		res.end(JSON.stringify(categories));
	}
};