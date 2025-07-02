const Dates = require('../models/Dates/Dates.js');
const NotificationService = require('./NotificationService.js');
const ApiException = require('../exceptions/ApiException.js');
const UserService = require('./UserService.js');
const PusherService = require('./PusherService.js');


exports.createDate = async (userId, date) => {
    const MessagesService = require('./MessagesService.js');
    if (userId !== date.senderId)
        throw new ApiException(403, "You are not allowed to create this date");
    const newDate = await Dates.createDate(date);
    await NotificationService.newDateNotification(date.senderId, date.receiverId);
    const newMessage = await MessagesService.createDateMessage(userId, date.receiverId, "Date", newDate);
    await PusherService.sendDateMessage(newMessage);
    await UserService.addFameRating(date.receiverId, 10);
    return newDate;
}

exports.getDatesByUserId = async (userId) => {
    const dates = await Dates.getDatesByUserId(userId);
    return dates;
}

exports.getDateById = async (id) => {
    const date = await Dates.getDateById(id);
    return date;
}

exports.updateDate = async (dateId, status) => {
    const date = await Dates.updateDate(dateId, status);
    if (date.status === 'accepted')
        await UserService.addFameRating(date.sender_id, 10);
    return date;
}