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
        const receiver_id = req.user.id;
        const sender_id = req.body.senderId;
        const date_data = req.body.dateData;

        const date = await DatesService.removeDate(sender_id, receiver_id, date_data);
        res.status(200).send(date);
    } catch (err) {
        res.status(404).send({ error: err.message });
    }
}
