const LocationService = require('../services/LocationService.js');

exports.createLocation = async (req, res) => {
    try {
        const location = await LocationService.createLocation(req.params.userId, req.body);
        return res.status(201).send(location);
    } catch (err) {
        return res.status(400).send({ error: err.message });
    }
};

exports.getUserLocation = async (req, res) => {
    try {
        const location = await LocationService.getLocationFromIP(req);
        res.status(200).json(location);
    } catch (err) {
        console.error('Error in getUserLocation:', err);
        res.status(500).json({ error: 'Failed to get location' });
    }
};

exports.getCityAndCountry = async (req, res) => {
    try {
        const { latitude, longitude } = req.query;
        const location = await LocationService.getCityAndCountry(latitude, longitude);
        res.status(200).json(location);
    }
    catch (err) {
        console.error('Error:', err);
        res.status(500).json({ error: 'Failed to get city and country' });
    }
}