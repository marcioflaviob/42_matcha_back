const Location = require('../models/Location/Location.js');

const getLocationByUserId = async (userId) => {
	const location = await Location.findByUserId(userId);
	return location;
}

const createLocation = async (userId, locationData) => {
    const locationId = await Location.createLocation(locationData);
    return locationId;
};

module.exports = {
	getLocationByUserId,
    createLocation
};