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

    static async createDate(sender_id, receiver_id, scheduled_date, address) {
        try {
            const result = await db.query('INSERT INTO date (sender_id, receiver_id, scheduled_date, address) VALUES ($1, $2, $3, $4) RETURNING *',
            [sender_id, receiver_id, scheduled_date, address]);
            return result.rows[0];
        } catch (error) {
            console.error('Error creating date:', error);
            throw new Error('Failed to create date');
        }
    }

    static async removeDate(id)
    {
        try {
            const result = await db.query('DELETE FROM date WHERE id = $1 RETURNING *',
            [id]);
            return result.rows[0];
        }
        catch (error) {
            console.error('Error removing date:', error);
            throw new Error('Failed to remove date');
        }
    }

    static async getDateById(id) {
        try {
            const result = await db.query('SELECT * FROM date WHERE id = $1',
            [id]);
            return result.rows[0];
        } catch (error) {
            console.error('Error fetching date by composite key:', error);
            throw new Error('Failed to fetch date');
        }
    }

    static async acceptDate(id) {
        try {
            const result = await db.query('UPDATE date SET accepted = true WHERE id = $1 RETURNING *',
            [id]);
            return result.rows[0];
        } catch (error) {
            console.error('Error accepting date:', error);
            throw new Error('Failed to accept date');
        }
    }
}

module.exports = Dates;