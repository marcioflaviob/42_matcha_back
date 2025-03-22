const db = require('../../config/db');

class Interests {
    static async findAll() {
        try {
            const result = await db.query('SELECT * FROM interests');
            return result.rows;
        } catch (error) {
            console.log(error);
            return [];
        }
    }

    static async findByUserId(userId) {
        try {
            const result = await db.query(
                'SELECT interest_id FROM user_interests WHERE user_id = $1',
                [userId]
            );
            return result.rows;
        } catch (error) {
            console.log(error);
            return [];
        }
    }
}

module.exports = Interests;