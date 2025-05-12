const LocationService = require('../services/LocationService.js');

exports.createLocation = async (req, res) => {
    try {
        const location = await LocationService.createLocation(req.params.userId, req.body);
        return res.status(201).send(location);
    } catch (err) {
        return res.status(400).send({ error: err.message });
    }
};
