const InterestsService = require('../services/InterestsService');

exports.getAllInterests = async (req, res) => {
	try {
		const interests = await InterestsService.getAllInterests();
		res.send(interests);
	} catch (err) {
		res.status(404).send({ error: err.message });
	}
}

exports.getInterestsByUserId = async (req, res) => {
	try {
		const interests = await InterestsService.getInterestsByUserId(req.params.userId);
		res.send(interests);
	} catch (err) {
		res.status(404).send({ error: err.message });
	}
}