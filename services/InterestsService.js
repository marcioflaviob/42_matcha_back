const Interests = require('../models/Interests/Interests');

const getAllInterests = async () => {
	const interests = await Interests.findAll();
	return interests;
}

const getInterestsByUserId = async (userId) => {
	const interests = await Interests.findByUserId(userId);
	return interests;
}

module.exports = {
	getAllInterests,
	getInterestsByUserId,
};