const db = require('../../config/db.js');
const ApiException = require('../../exceptions/ApiException.js');

class User {

    static async findAll() {
        try {
            const queryResult = await db.query('SELECT * FROM users');
            return queryResult.rows;

        } catch {
            throw new ApiException(500, 'Failed to fetch users');
        }
    }

    static async findById(id) {
        try {
            const queryResult = await db.query('SELECT * FROM users WHERE id = $1', [id]);
            if (queryResult.rows.length === 0) throw new ApiException(404, 'User not found');
            return queryResult.rows[0];
        } catch (error) {
            if (error instanceof ApiException) throw error;
            throw new ApiException(500, 'Failed to fetch user by ID');
        }
    }

    static async findByEmail(email) {
        try {
            const queryResult = await db.query('SELECT * FROM users WHERE email = $1', [email]);

            return queryResult.rows[0];
        } catch {
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
        } catch {
            throw new ApiException(500, 'Failed to fetch potential matches');
        }
    }

    static async create(userData) {
        try {
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
        } catch {
            throw new ApiException(500, 'Failed to create user');
        }
    }

    static async checkUserExists(email) {
        try {
            const queryResult = await db.query('SELECT * FROM users WHERE email = $1', [email]);

            return queryResult.rows.length > 0;
        } catch {
            throw new ApiException(500, 'Failed to check if user exists');
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
            if (error instanceof ApiException) throw error;
            throw new ApiException(500, 'Failed to update user in database');
        }
    }

    static async delete(id) {
        try {
            await db.query('DELETE FROM users WHERE id = $1', [id]);
            return { success: true };
        } catch {
            throw new ApiException(500, 'Failed to delete user');
        }
    }

    static async resetPassword(userId, newPassword) {
        if (!userId || !newPassword) {
            throw new ApiException(400, 'User ID and new password are required');
        }

        try {
            const result = await db.query(
                'UPDATE users SET password = $1 WHERE id = $2 RETURNING *',
                [newPassword, userId]
            );

            if (result.rows.length === 0) throw new ApiException(404, 'User not found');

            return result.rows[0];
        } catch (error) {
            if (error instanceof ApiException) throw error;
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
            if (error instanceof ApiException) throw error;
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
            if (error instanceof ApiException) throw error;
            throw new ApiException(500, 'Failed to add fame rating');
        }
    }

    static async updateLastConnection(userId) {
        try {
            const result = await db.query(
                'UPDATE users SET last_connection = NOW() WHERE id = $1 RETURNING *',
                [userId]
            );

            if (result.rows.length === 0) throw new ApiException(404, 'User not found');

            return result.rows[0];
        } catch (error) {
            if (error instanceof ApiException) throw error;
            throw new ApiException(500, 'Failed to update last connection');
        }
    }

    static async getPotentialMatches(filters) {
        try {
            const query = `
                SELECT users.*,
                    CASE 
                        WHEN user_location.latitude IS NULL OR current_user_location.latitude IS NULL THEN 999999
                        ELSE 6371 * acos(
                            cos(radians(current_user_location.latitude)) 
                            * cos(radians(user_location.latitude)) 
                            * cos(radians(user_location.longitude) - radians(current_user_location.longitude)) 
                            + sin(radians(current_user_location.latitude)) 
                            * sin(radians(user_location.latitude))
                        )
                    END AS distance_km
                FROM users
                LEFT JOIN locations user_location 
                    ON users.id = user_location.user_id
                LEFT JOIN locations current_user_location 
                    ON current_user_location.user_id = $1
                JOIN (
                    SELECT DISTINCT ui.user_id 
                    FROM user_interests ui
                    WHERE ui.interest_id IN (
                        SELECT interest_id 
                        FROM user_interests 
                        WHERE user_id = $1
                    )
                ) matching_interests ON matching_interests.user_id = users.id
                
                WHERE users.id != $1
                    AND users.status = 'complete'
                    AND (users.sexual_interest = $2 OR users.sexual_interest = 'Any')
                    AND (users.gender = $3 OR $3 = 'Any')
                    AND users.age_range_min <= $4
                    AND users.age_range_max >= $4
                    AND $5 <= EXTRACT(YEAR FROM AGE(users.birthdate))
                    AND $6 >= EXTRACT(YEAR FROM AGE(users.birthdate))
                    AND users.rating >= $7
                    AND users.min_desired_rating <= $8
                    
                    -- Location distance filter using Haversine formula
                    AND (
                        user_location.latitude IS NULL 
                        OR current_user_location.latitude IS NULL
                        OR (
                            6371 * acos(
                                cos(radians(current_user_location.latitude)) 
                                * cos(radians(user_location.latitude)) 
                                * cos(radians(user_location.longitude) - radians(current_user_location.longitude)) 
                                + sin(radians(current_user_location.latitude)) 
                                * sin(radians(user_location.latitude))
                            ) <= $10
                        )
                    )
                    AND users.id NOT IN (
                        SELECT CASE 
                            WHEN user1 = $1 THEN user2 
                            ELSE user1 
                        END
                        FROM user_interactions 
                        WHERE (user1 = $1 OR user2 = $1) 
                        AND interaction_type = 'block'
                    )
                    AND users.id NOT IN (
                        SELECT user2 
                        FROM user_interactions 
                        WHERE user1 = $1 
                        AND interaction_type = 'like'
                    )
                    
                ORDER BY distance_km ASC, users.rating DESC
                LIMIT $9
            `;

            const result = await db.query(query, [
                filters.userId,
                filters.gender,
                filters.sexual_interest,
                filters.age,
                filters.age_range_min,
                filters.age_range_max,
                filters.min_desired_rating,
                filters.rating,
                10,
                filters.location_range || 20
            ]);

            return result.rows;
        }
        catch (error) {
            if (error instanceof ApiException) throw error;
            throw new ApiException(500, 'Failed to fetch potential matches');
        }
    }
}



module.exports = User;