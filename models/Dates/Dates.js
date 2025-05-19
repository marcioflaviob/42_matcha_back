const db = require('../../config/db.js');

class Dates {
    static async getDatesByUserId(userId) {
        try {
            const result = await db.query(
                'SELECT * FROM date WHERE receiver_id = $1 OR sender_id = $1',
                [userId]
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
                'SELECT * FROM date WHERE receiver_id = $1 AND accepted = false',
                [userId]
            );
            return result.rows;
        } catch (error) {
            console.error('Error fetching dates:', error);
            throw new Error('Failed to fetch dates');
        }
    }

    static async createDate(sender_id, receiver_id, date_data) {
        try {
            const result = await db.query('INSERT INTO date (sender_id, receiver_id, date_data) VALUES ($1, $2, $3) RETURNING *',
            [sender_id, receiver_id, date_data]);
            return result.rows[0];
        } catch (error) {
            console.error('Error creating date:', error);
            throw new Error('Failed to create date');
        }
    }

    static async removeDate(sender_id, receiver_id, date_data)
    {
        try {
            const result = await db.query('DELETE FROM date WHERE sender_id = $1 AND receiver_id = $2 AND date_data = $3 RETURNING *',
            [sender_id, receiver_id, date_data]);
            return result.rows[0];
        }
        catch (error) {
            console.error('Error removing date:', error);
            throw new Error('Failed to remove date');
        }
    }

    static async getDateById(sender_id, receiver_id, date_data) {
        try {
            const result = await db.query('SELECT * FROM date WHERE sender_id = $1 AND receiver_id = $2 AND date_data = $3',
            [sender_id, receiver_id, date_data]);
            return result.rows[0];
        } catch (error) {
            console.error('Error fetching date by composite key:', error);
            throw new Error('Failed to fetch date');
        }
    }
}

module.exports = Dates;