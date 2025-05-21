const Dates = require('../models/Dates/Dates.js');
const NotificationService = require('./NotificationService.js');

exports.createDate = async (senderId, receiverId, date) => {
    try {
        const newDate = await Dates.createDate(senderId, receiverId, date);
        await NotificationService.newDateNotification(senderId, receiverId);

        return newDate;
    } catch (error) {
        throw new Error('Failed to create date');
    }
}

exports.getDatesByUserId = async (userId) => {
    try {
        const dates = await Dates.getDatesByUserId(userId);
        return dates;
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

// exports.getUnansweredDatesByReceiverId = async (userId) => {
//     try {
//         const dates = await Dates.getUnansweredDatesByReceiverId(userId);
//         return dates;
//     } catch (error) {
//         throw new Error('Failed to fetch dates');
//     }
// }

exports.updateDate = async (dateId, status) => {
    try {
        const date = await Dates.updateDate(dateId, status);
        return date;
    } catch (error) {
        throw new Error('Failed to accept date');
    }
}