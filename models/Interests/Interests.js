const db = require('../../config/db');

class Interests {
    static async findAll() {
        try {
            const result = await db.query('SELECT * FROM interests');
            return result.rows;
        } catch (error) {
            console.log(error);
            throw new Error(error);
        }
    }

    static async findByUserId(userId) {
        try {
            const result = await db.query(
                'SELECT interest_id FROM user_interests WHERE user_id = $1',
                [userId]
            );
            const interestIds = result.rows.map(row => row.interest_id);
            return interestIds;
        } catch (error) {
            console.log(error);
            throw new Error(error);
        }
    }

    static async addInterest(userId, interestId) {
        try {
            await db.query(
                'INSERT INTO user_interests (user_id, interest_id) VALUES ($1, $2)',
                [userId, interestId]
            );
            return true;
        } catch (error) {
            console.log(error);
            throw new Error('Failed to add interest');
        }
    }

    static async removeInterest(userId, interestId) {
        try {
            await db.query(
                'DELETE FROM user_interests WHERE user_id = $1 AND interest_id = $2',
                [userId, interestId]
            );
            return true;
        } catch (error) {
            console.log(error);
            throw new Error('Failed to remove interest');
        }
    }

    static async removeAllInterests(userId) {
        try {
            await db.query('DELETE FROM user_interests WHERE user_id = $1', [userId]);
            return true;
        } catch (error) {
            console.log(error);
            throw new Error('Failed to remove all interests');
        }
    }

}

module.exports = Interests;