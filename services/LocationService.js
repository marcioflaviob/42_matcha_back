const ApiException = require('../exceptions/ApiException.js');
const Location = require('../models/Location/Location.js');
const fetch = require('node-fetch');

const getLocationByUserId = async (userId) => {
    if (!userId) throw new ApiException(400, 'User ID is required');
    const location = await Location.findByUserId(userId);
    return location;
}

const createLocation = async (locationData) => {
    let locationId;
    const location = await getLocationByUserId(locationData.userId);
    if (location)
        locationId = await Location.updateLocation(locationData)
    else
        locationId = await Location.createLocation(locationData);
    return locationId;
};

const updateLocation = async (locationData) => {
    const location = await Location.updateLocation(locationData);
    return location;
};

const updateUserLocation = async (location, userId) => {
    if (location !== undefined) {
        try {
            if (location) {
                await updateLocation(userId, location);
                const result = await getLocationByUserId(userId);
                return result;
            }
        } catch (locationError) {
            console.log('Location update error:', locationError);
            throw new Error(locationError);
        }
    }
}

const getCityAndCountry = async (latitude, longitude, userId) => {
    if (!latitude || !longitude) {
        throw new ApiException(400, 'Latitude and longitude are required');
    }

    if (!userId) throw new ApiException(400, 'User ID is required');

    try {
        const response = await fetch(
            `https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=${process.env.GEOCODE_API_KEY}`
        );
        const data = await response.json();
        if (data.results) {
            const components = data.results[0].components;
            const locationData = {
                userId: userId,
                latitude: latitude,
                longitude: longitude,
                city: components.city || components.town || components.village || 'Unknown',
                country: components.country || 'Unknown',
            }
            await createLocation(locationData);
            return data;
        } else {
            throw new ApiException(500, 'Failed to fetch location');
        }
    } catch (err) {
        console.error('Error fetching city and country:', err);
        return { city: 'Unknown', country: 'Unknown' };
    }
}

const getAddress = async (latitude, longitude) => {
    if (!latitude || !longitude) {
        throw new ApiException(400, 'Latitude and longitude are required');
    }

    try {
        const response = await fetch(
            `https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=${process.env.GEOCODE_API_KEY}`
        );
        const data = await response.json();
        return data;
    } catch (err) {
        console.error('Error fetching city and country:', err);
        return { city: 'Unknown', country: 'Unknown' };
    }
}

const getLocationFromIP = async (userId) => {
    if (!userId) throw new ApiException(400, 'User ID is required');
    try {
        const publicIpResponse = await fetch('https://api.ipify.org?format=json');
        const publicIpData = await publicIpResponse.json();
        const publicIp = publicIpData.ip;

        try {
            const response = await fetch(`http://ip-api.com/json/${publicIp}`);
            const data = await response.json();

            if (data.status === 'success') {
                const locationData = {
                    userId: userId,
                    city: data.city || 'Unknown',
                    country: data.country || 'Unknown',
                    latitude: data.lat,
                    longitude: data.lon
                }
                const locate = await createLocation(locationData);
                return locate;
            }
        } catch (ipApiError) {
            console.log('ip-api.com failed:', ipApiError.message);
        }
        try {
            const fallbackResponse = await fetch(`https://ipapi.co/${publicIp}/json/`);
            const fallbackData = await fallbackResponse.json();

            if (!fallbackData.error && fallbackData.latitude && fallbackData.longitude) {
                const locationData = {
                    userId: userId,
                    city: fallbackData.city || 'Unknown',
                    country: fallbackData.country || 'Unknown',
                    latitude: fallbackData.latitude,
                    longitude: fallbackData.longitude
                }
                const locate = await createLocation(locationData);
                return locate;
            }
        } catch (ipapiError) {
            console.log('ipapi.co failed:', ipapiError.message);
        }
        const locationData = {
            userId: userId,
            city: 'Paris',
            country: 'France',
            latitude: 48.8566,
            longitude: 2.3522
        }
        const locate = await createLocation(locationData);
        return locate;
    } catch (err) {
        console.error('Error getting location from IP:', err);
    }
};

module.exports = {
    getLocationByUserId,
    createLocation,
    getCityAndCountry,
    getLocationFromIP,
    updateLocation,
    getAddress,
    updateUserLocation
};