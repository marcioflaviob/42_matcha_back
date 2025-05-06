const LocationService = require('../services/LocationService.js');

exports.getLocationByUserId = async (req, res) => {
    try {
        const location = await LocationService.getLocationByUserId(req.params.userId);
        res.send(location);
    } catch (err) {
        res.status(404).send({ error: err.message });
    }
}

exports.updateLocation = async (req, res) => {
    try {
        const location = await LocationService.updateLocation(req.params.userId, req.body);
        res.send(location);
    } catch (err) {
        res.status(400).send({ error: err.message });
    }
};

exports.createLocation = async (req, res) => {
    try {
        const location = await LocationService.createLocation(req.params.userId, req.body);
        return res.status(201).send(location);
    } catch (err) {
        return res.status(400).send({ error: err.message });
    }
};

exports.removeLocation = async (req, res) => {
    try {
        const location = await LocationService.removeLocation(req.params.userId);
        res.send(location);
    } catch (err) {
        res.status(400).send({ error: err.message });
    }
};
