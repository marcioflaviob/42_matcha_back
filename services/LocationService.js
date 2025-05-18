const Location = require('../models/Location/Location.js');
const fetch = require('node-fetch');

const getLocationByUserId = async (userId) => {
	const location = await Location.findByUserId(userId);
	return location;
}

const createLocation = async (userId, locationData) => {
    const locationId = await Location.createLocation(locationData);
    return locationId;
};

const updateLocation = async (userId, locationData) => {
    const location = await Location.updateLocation(userId, locationData);
    return location;
};

const getCityAndCountry = async (latitude, longitude) => {
    try {
        const response = await fetch(
            `https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=${process.env.GEOCODE_API_KEY}`
        );
        const data = await response.json();
        if (data.results) {
            const components = data.results[0].components;
            return {
                city: components.city || components.town || components.village || 'Unknown',
                country: components.country || 'Unknown',
            };
        } else {
            throw new Error('Unable to fetch city and country.');
        }
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