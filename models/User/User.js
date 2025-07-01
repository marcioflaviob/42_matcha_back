const db = require('../../config/db.js');
const bcrypt = require('bcrypt');
const ApiException = require('../../exceptions/ApiException.js');

class User {

    static async findAll() {
        try {
            const queryResult = await db.query('SELECT * FROM users');
            return queryResult.rows;

        } catch (error) {
            console.log(error);
            throw new ApiException(500, 'Failed to fetch users');
        }
    }

    static async findById(id) {
        try {
            const queryResult = await db.query('SELECT * FROM users WHERE id = $1', [id]);
            if (queryResult.rows.length === 0) throw new ApiException(404, 'User not found');
            return queryResult.rows[0];
        } catch (error) {
            console.log(error);
            throw new ApiException(500, 'Failed to fetch user by ID');
        }
    }

    static async findByEmail(email) {
        try {
            const queryResult = await db.query('SELECT * FROM users WHERE email = $1', [email]);
            if (queryResult.rows.length === 0) throw new ApiException(404, 'User not found');
            return queryResult.rows[0];
        } catch (error) {
            if (error instanceof ApiException) throw error;
            throw new ApiException(500, 'Failed to fetch user by email');
        }
    }

    static async findAllValidUsers(userId) {
        try {
            const result = await db.query(
                `SELECT * FROM users WHERE id != $1 AND status = 'complete'`,
                [userId]
            );
            return result.rows;
        } catch (error) {
            console.error('Error fetching potential matches:', error);
            throw new ApiException(500, 'Failed to fetch potential matches');
        }
    }

    static async create(userData) {
        try {

            if (userData.password) {
                const salt = await bcrypt.genSalt(10);
                userData.password = await bcrypt.hash(userData.password, salt);
            }

            const keys = Object.keys(userData);
            const values = Object.values(userData);

            const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
            const columns = keys.join(', ');

            const query = `
                INSERT INTO users (${columns})
                VALUES (${placeholders})
                RETURNING *
            `;

            const result = await db.query(query, values);
            if (result.rows.length === 0) throw new ApiException(500, 'Failed to create user');
            return result.rows[0];
        } catch (error) {
            console.log(error);
            throw new ApiException(500, 'Failed to create user');
        }
    }

    static async updateUserData(userId, userData) {
        try {
            if (!Object.keys(userData).length) {
                return await this.findById(userId);
            }

            const keys = Object.keys(userData);
            const values = Object.values(userData);
            const setClause = keys.map((key, i) => `${key} = $${i + 2}`).join(', ');

            const query = `
                UPDATE users 
                SET ${setClause}
                WHERE id = $1
                RETURNING *
            `;

            const result = await db.query(query, [userId, ...values]);
            if (result.rows.length === 0) throw new ApiException(404, 'User not found');
            return result.rows[0];
        } catch (error) {
            console.log('Database update error:', error);
            throw new ApiException(500, 'Failed to update user in database');
        }
    }

    static async delete(id) {
        try {
            await db.query('DELETE FROM users WHERE id = $1', [id]);
            return { success: true };
        } catch (error) {
            console.log(error);
            throw new ApiException(500, 'Failed to delete user');
        }
    }

    static async resetPassword(userId, newPassword) {
        try {

            const salt = await bcrypt.genSalt(10);

            const hashedPassword = await bcrypt.hash(newPassword, salt);

            const result = await db.query(
                'UPDATE users SET password = $1 WHERE id = $2 RETURNING *',
                [hashedPassword, userId]
            );

            if (result.rows.length === 0) throw new ApiException(404, 'User not found');

            return result.rows[0];
        } catch (error) {
            console.log(error);
            throw new ApiException(500, 'Failed to reset password');
        }
    }

    static async validateUser(userId) {
        try {
            const result = await db.query(
                'UPDATE users SET status = $1 WHERE id = $2 RETURNING *',
                ['complete', userId]
            );

            if (result.rows.length === 0) throw new ApiException(404, 'User not found');

            return result.rows[0];
        } catch (error) {
            console.log(error);
            throw new ApiException(500, 'Failed to validate user');
        }
    }

    static async addFameRating(userId, rating) {
        try {
            const result = await db.query(
                'UPDATE users SET rating = rating + $1 WHERE id = $2 RETURNING *',
                [rating, userId]
            );

            if (result.rows.length === 0) throw new ApiException(404, 'User not found');

            return result.rows[0];
        } catch (error) {
            console.log(error);
            throw new ApiException(500, 'Failed to add fame rating');
        }
    }

    static async findPotentialMatches(userId, filters) {
        try {
            const query = `
                SELECT DISTINCT u.*, 
                    COALESCE(u.rating, 0) as rating
                FROM users u
                WHERE u.id != $1 
                    AND u.status = 'complete'
                    AND u.gender = ANY($2::text[])
                    AND COALESCE(u.rating, 0) >= $3
                    AND (u.sexual_interest = 'Any' OR u.sexual_interest = $4)
                    AND u.id NOT IN (
                        SELECT CASE WHEN user1 = $1 THEN user2 ELSE user1 END 
                        FROM user_interactions 
                        WHERE (user1 = $1 OR user2 = $1) AND interaction_type = 'like'
                    )
                    AND u.id NOT IN (
                        SELECT CASE WHEN user1 = $1 THEN user2 ELSE user1 END 
                        FROM user_interactions 
                        WHERE (user1 = $1 OR user2 = $1) AND interaction_type = 'block'
                    )
                    AND EXISTS (
                        SELECT 1 FROM user_interests ui1
                        JOIN user_interests ui2 ON ui1.interest_id = ui2.interest_id
                        WHERE ui1.user_id = $1 AND ui2.user_id = u.id
                    )
                ORDER BY 
                    COALESCE(u.rating, 0) DESC
            `;

            const params = [
                userId,
                filters.sexual_interest,
                filters.min_desired_rating || 0,
                filters.gender,
            ];

            const result = await db.query(query, params);
            return result.rows;
        } catch (error) {
            console.error('Error finding potential matches:', error);
            throw new ApiException(500, 'Failed to find potential matches');
        }
    }
}

module.exports = User;