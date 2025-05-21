const Dates = require('../models/Dates/Dates.js');

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

exports.getUnansweredDatesByReceiverId = async (userId) => {
    try {
        const dates = await Dates.getUnansweredDatesByReceiverId(userId);
        return dates;
    } catch (error) {
        throw new Error('Failed to fetch dates');
    }
}

exports.removeDate = async (date_id) => {
    try {
        const date = await Dates.removeDate(date_id);
        return date;
    } catch (error) {
        throw new Error('Failed to remove date');
    }
}

exports.acceptDate = async (date_id) => {
    try {
        const date = await Dates.acceptDate(date_id);
        return date;
    } catch (error) {
        throw new Error('Failed to accept date');
    }
}