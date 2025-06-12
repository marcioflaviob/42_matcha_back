const InterestsService = require('../services/InterestsService.js');

exports.getAllInterests = async (res) => {
	const interests = await InterestsService.getAllInterests();
	res.send(interests);
}

exports.getInterestsByUserId = async (req, res) => {
	const interests = await InterestsService.getInterestsListByUserId(req.params.userId);
	res.send(interests);
}