module.exports = {
	async execute(req, res) {
		const response = await fetch('http://localhost:9000/metrics');

		console.log(response);
	}
};