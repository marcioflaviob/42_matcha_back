const ApiException = require('../exceptions/ApiException.js');
const Location = require('../models/Location/Location.js');
const fetch = require('node-fetch');

const getLocationByUserId = async (userId) => {
    if (!userId) throw new ApiException(400, 'User ID is required');
	const location = await Location.findByUserId(userId);
    if (!location) throw new ApiException(404, 'Location not found for user');
	return location;
}

const createLocation = async (userId, locationData) => {
    if (!userId) throw new ApiException(400, 'User ID is required');
    const locationId = await Location.createLocation(locationData);
    return locationId;
};

const updateLocation = async (userId, locationData) => {
    if (!userId) throw new ApiException(400, 'User ID is required');
    const location = await Location.updateLocation(userId, locationData);
    return location;
};

const getCityAndCountry = async (latitude, longitude) => {
    if (!latitude || !longitude) {
        throw new ApiException(400, 'Latitude and longitude are required');
    }
    try {
        const response = await fetch(
            `https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=${process.env.GEOCODE_API_KEY}`
        );
        return await response.json();
    } catch (err) {
        console.error('Error fetching city and country:', err);
        return { city: 'Unknown', country: 'Unknown' };
    }
}

const getLocationFromIP = async () => {
    try {
        const publicIpResponse = await fetch('https://api.ipify.org?format=json');
        const publicIpData = await publicIpResponse.json();
        const publicIp = publicIpData.ip;

        try {
            const response = await fetch(`http://ip-api.com/json/${publicIp}`);
            const data = await response.json();
            
            if (data.status === 'success') {
                return {
                    city: data.city || 'Unknown',
                    country: data.country || 'Unknown',
                    latitude: data.lat,
                    longitude: data.lon
                };
            }
        } catch (ipApiError) {
            console.log('ip-api.com failed:', ipApiError.message);
            throw new ApiException('Geolocation service failed', 500);
        }

        try {
            const fallbackResponse = await fetch(`https://ipapi.co/${publicIp}/json/`);
            const fallbackData = await fallbackResponse.json();
            
            if (!fallbackData.error && fallbackData.latitude && fallbackData.longitude) {
                return {
                    city: fallbackData.city || 'Unknown',
                    country: fallbackData.country || 'Unknown',
                    latitude: fallbackData.latitude,
                    longitude: fallbackData.longitude
                };
            }
        } catch (ipapiError) {
            console.log('ipapi.co failed:', ipapiError.message);
        }

        console.log('All geolocation services failed, using default location');
        return {
            city: 'Paris',
            country: 'France',
            latitude: 48.8566,
            longitude: 2.3522
        };
    } catch (err) {
        console.error('Error getting location from IP:', err);
    }
};

module.exports = {
	getLocationByUserId,
    createLocation,
    getCityAndCountry,
    getLocationFromIP,
    updateLocation
};