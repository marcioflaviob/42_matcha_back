const ApiException = require('../exceptions/ApiException.js');
const Location = require('../models/Location/Location.js');
const fetch = require('node-fetch');

const validateUserId = (userId) => {
    if (!userId) throw new ApiException(400, 'User ID is required');
};

const validateCoordinates = (latitude, longitude) => {
    if (!latitude || !longitude) {
        throw new ApiException(400, 'Latitude and longitude are required');
    }
};

const createLocationData = (userId, latitude, longitude, city, country) => {
    return {
        userId,
        latitude,
        longitude,
        city: city || 'Unknown',
        country: country || 'Unknown'
    };
};

const extractCityFromComponents = (components) => {
    return components.city || components.town || components.village || 'Unknown';
};

const fetchGeocodeData = async (latitude, longitude) => {
    const response = await fetch(
        `https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=${process.env.GEOCODE_API_KEY}`
    );
    return await response.json();
};

const fetchPublicIP = async () => {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
};

const fetchLocationFromIPApi = async (ip) => {
    const response = await fetch(`http://ip-api.com/json/${ip}`);
    return await response.json();
};

const fetchLocationFromFallbackApi = async (ip) => {
    const response = await fetch(`https://ipapi.co/${ip}/json/`);
    return await response.json();
};

const getLocationByUserId = async (userId) => {
    validateUserId(userId);
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
                await updateLocation(location);
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
    validateCoordinates(latitude, longitude);
    validateUserId(userId);

    try {
        const data = await fetchGeocodeData(latitude, longitude);
        if (data.results) {
            const components = data.results[0].components;
            const locationData = createLocationData(
                userId,
                latitude,
                longitude,
                extractCityFromComponents(components),
                components.country
            );
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
    validateCoordinates(latitude, longitude);

    try {
        const data = await fetchGeocodeData(latitude, longitude);
        return data;
    } catch (err) {
        console.error('Error fetching city and country:', err);
        return { city: 'Unknown', country: 'Unknown' };
    }
}

const getLocationFromIP = async (userId) => {
    validateUserId(userId);

    try {
        const publicIp = await fetchPublicIP();

        try {
            const data = await fetchLocationFromIPApi(publicIp);
            if (data.status === 'success') {
                const locationData = createLocationData(
                    userId,
                    data.lat,
                    data.lon,
                    data.city,
                    data.country
                );
                return await createLocation(locationData);
            }
        } catch (ipApiError) {
            console.log('ip-api.com failed:', ipApiError.message);
        }

        try {
            const fallbackData = await fetchLocationFromFallbackApi(publicIp);
            if (!fallbackData.error && fallbackData.latitude && fallbackData.longitude) {
                const locationData = createLocationData(
                    userId,
                    fallbackData.latitude,
                    fallbackData.longitude,
                    fallbackData.city,
                    fallbackData.country
                );
                return await createLocation(locationData);
            }
        } catch (ipapiError) {
            console.log('ipapi.co failed:', ipapiError.message);
        }

        const parisLocationData = createLocationData(
            userId,
            48.8566,
            2.3522,
            'Paris',
            'France'
        );
        return await createLocation(parisLocationData);
    } catch (err) {
        console.error('Error getting location from IP:', err);
    }
};

const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

module.exports = {
    getLocationByUserId,
    createLocation,
    getCityAndCountry,
    getLocationFromIP,
    updateLocation,
    getAddress,
    updateUserLocation,
    calculateDistance
};