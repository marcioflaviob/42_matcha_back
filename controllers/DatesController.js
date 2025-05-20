const DatesService = require('../services/DatesService');

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

exports.removeDate = async (req, res) => {
    try {
        const date_id = req.params.id;
        const date = await DatesService.removeDate(date_id);
        res.status(200).send(date);
    } catch (err) {
        res.status(404).send({ error: err.message });
    }
}

exports.acceptDate = async (req, res) => {
    try {
        const date_id = req.params.id;
        const date = await DatesService.acceptDate(date_id);
        res.status(200).send(date);
    } catch (err) {
        res.status(404).send({ error: err.message });
    }
}
