const InterestsService = require('../services/InterestsService.js');

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
		const interests = await InterestsService.getInterestsListByUserId(req.params.userId);
		res.send(interests);
	} catch (err) {
		res.status(404).send({ error: err.message });
	}
}