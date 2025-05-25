const LocationService = require('../services/LocationService.js');

exports.createLocation = async (req, res) => {
    const location = await LocationService.createLocation(req.params.userId, req.body);
    res.status(201).send(location);
};

exports.getUserLocation = async (req, res) => {
    const location = await LocationService.getLocationFromIP(req);
    res.status(200).json(location);
};

exports.getCityAndCountry = async (req, res) => {
    const { latitude, longitude } = req.query;
    const location = await LocationService.getCityAndCountry(latitude, longitude);
    res.status(200).json(location);
}