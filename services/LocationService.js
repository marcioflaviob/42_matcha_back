const Location = require('../models/Location/Location.js');

const getLocationByUserId = async (userId) => {
	const location = await Location.findByUserId(userId);
	return location;
}

const removeLocation = async (userId) => {
	const result = await Location.removeLocation(userId);
	return result;
}

const updateLocation = async (userId, locationData) => {
	await removeLocation(userId);
	const locationId = await Location.createLocation(locationData);
	return true;
}

const createLocation = async (userId, locationData) => {
    const locationId = await Location.createLocation(locationData);
    return locationId;
};

module.exports = {
	getLocationByUserId,
	removeLocation,
	updateLocation,
    createLocation
};