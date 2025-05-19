const db = require('../../config/db.js');

class Dates {
    static async getDatesByUserId(userId) {
        try {
            const result = await db.query(
                'SELECT * FROM date WHERE user_id = $1',
                [userId]
            );
            return result.rows;
        } catch (error) {
            console.error('Error fetching dates:', error);
            throw new Error('Failed to fetch dates');
        }
    }

    static async createDate(user1, user2, date_data) {
        try {
            const result = await db.query('INSERT INTO date (user1, user2, date_data) VALUES ($1, $2, $3) RETURNING *',
            [user1, user2, date_data]);
            return result.rows[0];
        } catch (error) {
            console.error('Error creating date:', error);
            throw new Error('Failed to create date');
        }
    }
}

module.exports = Dates;