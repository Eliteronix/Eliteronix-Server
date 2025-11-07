module.exports = {
	async execute(req, res) {
		const response = await fetch('http://localhost:9090/metrics');
		const body = await res.text();

		console.log(body);
	}
};