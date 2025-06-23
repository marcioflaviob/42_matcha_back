const Dates = require('../models/Dates/Dates.js');
const NotificationService = require('./NotificationService.js');
const MessagesService = require('./MessagesService.js');
const ApiException = require('../exceptions/ApiException.js');
const UserDataAccess = require('../utils/UserDataAccess.js');

exports.createDate = async (userId, date) => {
    if (userId !== date.senderId)
        throw new ApiException(403, "You are not allowed to create this date");
    const newDate = await Dates.createDate(date);
    await NotificationService.newDateNotification(date.senderId, date.receiverId);
    await MessagesService.createDateMessage(userId, date.receiverId, "Date", newDate.id);
    await UserDataAccess.addFameRating(date.receiverId, 10);
    return newDate;
}

exports.getDatesByUserId = async (userId) => {
    const dates = await Dates.getDatesByUserId(userId);
    const now = new Date();
    const filteredDates = dates.filter(date =>
        new Date(date.scheduled_date) > now && date.status !== 'refused');
    return filteredDates;
}

exports.getDateById = async (id) => {
    const date = await Dates.getDateById(id);
    return date;
}

exports.updateDate = async (dateId, status) => {
    const date = await Dates.updateDate(dateId, status);
    if (date.status === 'accepted')
        await UserDataAccess.addFameRating(date.sender_id, 10);
    return date;
}