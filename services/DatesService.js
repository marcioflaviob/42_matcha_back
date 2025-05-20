const Dates = require('../models/Dates/Dates.js');

exports.getDatesByUserId = async (userId) => {
    try {
        const dates = await Dates.getDatesByUserId(userId);
        return dates;
    } catch (error) {
        throw new Error('Failed to fetch dates');
    }
}

exports.getUnansweredDatesByReceiverId = async (userId) => {
    try {
        const dates = await Dates.getUnansweredDatesByReceiverId(userId);
        return dates;
    } catch (error) {
        throw new Error('Failed to fetch dates');
    }
}

exports.removeDate = async (sender_id, receiver_id, date_data) => {
    try {
        const date = await Dates.removeDate(sender_id, receiver_id, date_data);
        return date;
    } catch (error) {
        throw new Error('Failed to remove date');
    }
}

exports.acceptDate = async (sender_id, receiver_id, date_data) => {
    try {
        const date = await Dates.acceptDate(sender_id, receiver_id, date_data);
        return date;
    } catch (error) {
        throw new Error('Failed to accept date');
    }
}