const DatesService = require('../services/DatesService');

exports.createDate = async (req, res) => {
    const userId = req.user.id;
    const date = await DatesService.createDate(userId, req.body);
    res.status(201).send(date);
}

exports.getDatesByUserId = async (req, res) => {
    const userId = req.user.id;
    const dates = await DatesService.getDatesByUserId(userId);
    res.status(200).send(dates);
}

exports.updateDate = async (req, res) => {
    const dateId = req.body.id;
    const status = req.body.status;
    const date = await DatesService.updateDate(dateId, status);
    res.status(200).send(date);
}

exports.getDateById = async (req, res) => {
    const dateId = req.params.id;
    const date = await DatesService.getDateById(dateId);
    res.status(200).send(date);
}
