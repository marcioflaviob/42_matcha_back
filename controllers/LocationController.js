const LocationService = require('../services/LocationService.js');

exports.setUserLocation = async (req, res) => {
    const userId = req.params.id;
    try {
        const location = await LocationService.getLocationFromIP(userId);
        res.status(200).send(location);
    } catch (err) {
        console.error('Error in getUserLocation:', err);
        res.status(500).send({ error: 'Failed to get location' });
    }
};

exports.setCityAndCountry = async (req, res) => {
    try {
        const { latitude, longitude, userId } = req.body;
        const location = await LocationService.getCityAndCountry(latitude, longitude, userId);
        res.status(200).send(location);
    }
    catch (err) {
        console.error('Error:', err);
        res.status(500).send({ error: 'Failed to get city and country' });
    }
}