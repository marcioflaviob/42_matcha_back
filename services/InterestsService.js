const Interests = require('../models/Interests/Interests');

const getAllInterests = async () => {
	const interests = await Interests.findAll();
	return interests;
}

const getInterestsByUserId = async (userId) => {
	const interestsIds = await Interests.findByUserId(userId);
	return interestsIds;
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

	await removeAllInterests(userId);
	
	for (const interest of interests) {
		await addInterest(userId, interest.id);
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

const getInterestsListByUserId = async (userId) =>
{
	const interestIds = await getInterestsByUserId(userId);
	const allInterests = await getAllInterests();
	const interestsList = interestIds.map(interestId => {
		const matchingInterest = allInterests.find(
			dbInterest => dbInterest.id === interestId
		);
		
		if (matchingInterest) {
			return { id: matchingInterest.id, name: matchingInterest.name };
		} else {
			console.log(`Interest with ID "${interestId}" not found in database`);
			throw new Error(`Interest with ID "${interestId}" not found in database`);
		}
	}).filter(name => name !== null);
	return interestsList
}

module.exports = {
	getAllInterests,
	getInterestsByUserId,
	getInterestsNamesByUserId,
	getInterestsListByUserId,
	addInterest,
	removeInterest,
	removeAllInterests,
	updateInterests
};