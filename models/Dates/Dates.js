const db = require('../../config/db.js');
const ApiException = require('../../exceptions/ApiException.js');

class Dates {
    static async getDatesByUserId(userId) {
        try {
            const result = await db.query(
                'SELECT * FROM dates WHERE receiver_id = $1 OR sender_id = $1',
                [userId]
            );
            return result.rows;
        } catch (error) {
            console.log(error);
            throw new ApiException(500, 'Failed to fetch dates');
        }
    }

    static async getUnansweredDatesByReceiverId(userId) {
        try {
            const result = await db.query(
                'SELECT * FROM dates WHERE receiver_id = $1 AND status = $2',
                [userId, 'pending']
            );
            return result.rows;
        } catch (error) {
            console.log(error);
            throw new ApiException(500, 'Failed to fetch unanswered dates');
        }
    }

    static async createDate(date) {
        try {
            const result = await db.query('INSERT INTO dates (sender_id, receiver_id, scheduled_date, address, latitude, longitude, status) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
                [date.senderId, date.receiverId, date.scheduledDate, date.address, date.latitude, date.longitude, 'pending']);
            return result.rows[0];
        } catch (error) {
            console.log(error);
            throw new ApiException(500, 'Failed to create date');
        }
    }

    static async getDateById(id) {
        try {
            const result = await db.query('SELECT * FROM dates WHERE id = $1',
                [id]);
            if (result.rows.length === 0) throw new ApiException(404, 'Date not found');
            return result.rows[0];
        } catch (error) {
            if (error instanceof ApiException) throw error;
            console.log(error);
            throw new ApiException(500, 'Failed to fetch date by ID');
        }
    }

    static async updateDate(id, status) {
        try {
            const result = await db.query('UPDATE dates SET status = $1 WHERE id = $2 RETURNING *',
                [status, id]);
            return result.rows[0];
        } catch (error) {
            console.log(error);
            throw new ApiException(500, 'Failed to update date');
        }
    }
}

module.exports = Dates;