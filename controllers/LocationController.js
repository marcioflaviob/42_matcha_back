const LocationService = require('../services/LocationService.js');

exports.setUserLocation = async (req, res) => {
    const userId = req.user.id;
    const location = await LocationService.getLocationFromIP(userId);
    res.status(200).send({ location });
};

exports.setCityAndCountry = async (req, res) => {
    const userId = req.user.id;
    const { latitude, longitude } = req.body;
    const location = await LocationService.getCityAndCountry(latitude, longitude, userId);
    res.status(200).send(location);
};

exports.getAddress = async (req, res) => {
    const { latitude, longitude } = req.query;
    const location = await LocationService.getAddress(latitude, longitude);
    res.status(200).send(location);
}