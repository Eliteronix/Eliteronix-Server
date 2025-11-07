module.exports = {
	async execute(req, res) {
		const response = await fetch('http://localhost:8080/metrics');
		const body = await response.text();
		
		res.setHeader('Content-Type', 'text/plain');
		res.end(body);
	}
};