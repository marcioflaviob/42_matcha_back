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

const getLocationFromIP = async (req) => {
    try {
        // Get the client's IP address from the request object
        const clientIp = req.headers['x-forwarded-for']?.split(',')[0] || 
                        req.socket.remoteAddress || 
                        req.ip;
                        
        // Remove IPv6 prefix if present
        const ipAddress = clientIp.replace(/^::ffff:/, '');

        // Try ipapi.co first
        try {
            const response = await fetch(`https://ipapi.co/${ipAddress}/json/`);
            const data = await response.json();
            
            if (!data.error) {
                const location = await getCityAndCountry(data.latitude, data.longitude);
                return {
                    ...location,
                    latitude: data.latitude,
                    longitude: data.longitude
                };
            }
        } catch (ipapiError) {
            console.log('ipapi.co failed, trying fallback service');
        }

        // Fallback to ip-api.com (different free service with higher rate limits)
        const fallbackResponse = await fetch(`http://ip-api.com/json/${ipAddress}`);
        const fallbackData = await fallbackResponse.json();
        
        if (fallbackData.status === 'success') {
            const location = await getCityAndCountry(fallbackData.lat, fallbackData.lon);
            return {
                ...location,
                latitude: fallbackData.lat,
                longitude: fallbackData.lon
            };
        }

        throw new Error('All IP geolocation services failed');
    } catch (err) {
        console.error('Error getting location from IP:', err);
        
        // If all else fails, return a default location (Paris, since your users are in Île-de-France)
        return {
            city: 'Paris',
            country: 'France',
            latitude: 48.8566,
            longitude: 2.3522
        };
    }
};

module.exports = {
	getLocationByUserId,
    createLocation,
    getCityAndCountry,
    getLocationFromIP
};