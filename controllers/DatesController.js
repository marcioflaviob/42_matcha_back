const DatesService = require('../services/DatesService');

exports.createDate = async (req, res) => {
    try {
        const userId = req.user.id;
        const date = await DatesService.createDate(userId, req.body);
        res.status(201).send(date);
    } catch (err) {
        res.status(400).send({ error: err.message });
    }
}

exports.getDatesByUserId = async (req, res) => {
    try {
        const userId = req.user.id;
        const dates = await DatesService.getDatesByUserId(userId);
        res.status(200).send(dates);
    } catch (err) {
        res.status(404).send({ error: err.message });
    }
}

exports.getUnansweredDatesByReceiverId = async (req, res) => {
    try {
        const userId = req.user.id;
        const dates = await DatesService.getUnansweredDatesByReceiverId(userId);
        res.status(200).send(dates);
    } catch (err) {
        res.status(404).send({ error: err.message });
    }
}

exports.updateDate = async (req, res) => {
    try {
        const dateId = req.body.id;
        const status = req.body.status;
        const date = await DatesService.updateDate(dateId, status);
        res.status(200).send(date);
    } catch (err) {
        res.status(404).send({ error: err.message });
    }
}

exports.getDateById = async (req, res) => {
    try {
        const dateId = req.params.id;
        const date = await DatesService.getDateById(dateId);
        res.status(200).send(date);
    } catch (err) {
        res.status(404).send({ error: err.message });
    }
}
