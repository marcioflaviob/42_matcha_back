const db = require('../../config/db.js');

class Dates {
    static async getDatesByUserId(userId) {
        try {
            const result = await db.query(
                'SELECT * FROM dates WHERE receiver_id = $1 OR sender_id = $1',
                [userId]
            );
            return result.rows;
        } catch (error) {
            console.error('Error fetching dates:', error);
            throw new Error('Failed to fetch dates');
        }
    }

    static async getDatesByData(receiverId, senderId, scheduledDate, address) {
        try {
            const result = await db.query(
                'SELECT * FROM dates WHERE receiver_id = $1 AND sender_id = $2 AND scheduled_date = $3 AND address = $4',
                [receiverId, senderId, scheduledDate, address]
            );
            return result.rows;
        } catch (error) {
            console.error('Error fetching dates:', error);
            throw new Error('Failed to fetch dates');
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
            console.error('Error fetching dates:', error);
            throw new Error('Failed to fetch dates');
        }
    }

    static async createDate(date) {
        try {
            const result = await db.query('INSERT INTO dates (sender_id, receiver_id, scheduled_date, address, latitude, longitude, status) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [date.senderId, date.receiverId, date.scheduledDate, date.address, date.latitude, date.longitude, 'pending']);
            return result.rows[0];
        } catch (error) {
            console.error('Error creating date:', error);
            throw new Error('Failed to create date');
        }
    }

    // static async removeDate(id)
    // {
    //     try {
    //         const result = await db.query('DELETE FROM dates WHERE id = $1 RETURNING *',
    //         [id]);
    //         return result.rows[0];
    //     }
    //     catch (error) {
    //         console.error('Error removing date:', error);
    //         throw new Error('Failed to remove date');
    //     }
    // }

    static async getDateById(id) {
        try {
            const result = await db.query('SELECT * FROM dates WHERE id = $1',
            [id]);
            return result.rows[0];
        } catch (error) {
            console.error('Error fetching date by composite key:', error);
            throw new Error('Failed to fetch date');
        }
    }

    static async updateDate(id, status) {
        try {
            const result = await db.query('UPDATE dates SET status = $1 WHERE id = $2 RETURNING *',
            [status, id]);
            return result.rows[0];
        } catch (error) {
            console.error('Error accepting date:', error);
            throw new Error('Failed to accept date');
        }
    }
}

module.exports = Dates;