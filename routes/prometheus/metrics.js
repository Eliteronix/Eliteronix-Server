module.exports = {
	async execute(req, res) {
		const response = await fetch('http://localhost:9090/metrics');

		console.log(response);
	}
};