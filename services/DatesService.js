const Dates = require('../models/Dates/Dates.js');
const NotificationService = require('./NotificationService.js');
const MessagesService = require('./MessagesService.js')

exports.createDate = async (userId, date) => {
    try {
        if (userId !== date.senderId)
            throw new Error('User not authorized');
        const newDate = await Dates.createDate(date);
        await NotificationService.newDateNotification(date.senderId, date.receiverId);
        await MessagesService.createDateMessage(userId, date.receiverId, "Date", newDate.id)
        return newDate;
    } catch (error) {
        throw new Error('Failed to create date in service');
    }
}

exports.getDatesByUserId = async (userId) => {
    try {
        const dates = await Dates.getDatesByUserId(userId);
        const now = new Date();
        const filteredDates = dates.filter(date =>
            new Date(date.scheduled_date) > now && date.status !== 'refused');
        return filteredDates;
    } catch (error) {
        throw new Error('Failed to fetch dates');
    }
}

exports.getDateById = async (id) => {
    try {
        const date = await Dates.getDateById(id);
        return date;
    } catch (error) {
        throw new Error('Failed to fetch dates');
    }
}

exports.updateDate = async (dateId, status) => {
    try {
        const date = await Dates.updateDate(dateId, status);
        return date;
    } catch (error) {
        throw new Error('Failed to accept date');
    }
}