const Interests = require('../models/Interests/Interests');

const getAllInterests = async () => {
	const interests = await Interests.findAll();
	return interests;
}

const getInterestsByUserId = async (userId) => {
	const interests = await Interests.findByUserId(userId);
	return interests;
}

const addInterest = async (userId, interestId) => {
	const result = await Interests.addInterest(userId, interestId);
	return result;
}

const removeInterest = async (userId, interestId) => {
	const result = await Interests.removeInterest(userId, interestId);
	return result;
}

const removeAllInterests = async (userId) => {
	const result = await Interests.removeAllInterests(userId);
	return result;
}

const updateInterests = async (userId, interests) => {
	const allInterests = await getAllInterests();

	const interestIds = interests.map(interestName => {
		const matchingInterest = allInterests.find(
			dbInterest => dbInterest.name.toLowerCase() === interestName.toLowerCase()
		);
		
		if (matchingInterest) {
			return matchingInterest.id;
		} else {
			console.log(`Interest "${interestName}" not found in database`);
			throw new Error(`Interest "${interestName}" not found in database`);
		}
	}).filter(id => id !== null);
	
	await removeAllInterests(userId);
	
	for (const interestId of interestIds) {
		await addInterest(userId, interestId);
	}
	
	return true;
}

const getInterestsNamesByUserId = async (userId) => {
	const interests = await getInterestsByUserId(userId);
	const allInterests = await getAllInterests();
	const interestNames = interests.map(interestId => {
		const matchingInterest = allInterests.find(
			dbInterest => dbInterest.id === interestId
		);
		
		if (matchingInterest) {
			return matchingInterest.name;
		} else {
			console.log(`Interest with ID "${interestId}" not found in database`);
			throw new Error(`Interest with ID "${interestId}" not found in database`);
		}
	}).filter(name => name !== null);
	return interestNames;
}

module.exports = {
	getAllInterests,
	getInterestsByUserId,
	getInterestsNamesByUserId,
	addInterest,
	removeInterest,
	removeAllInterests,
	updateInterests
};