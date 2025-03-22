const db = require('../../config/db');

class UserPictures {
    static async findByUserId(userId) {
        try {
            const result = await db.query(
                'SELECT * FROM user_pictures WHERE user_id = $1',
                [userId]
            );
            return result.rows;
        } catch (error) {
            console.log(error);
            return [];
        }
    }
    
    static async create(pictureData) {
        try {
            // Extract and separate keys and values for SQL
            const keys = Object.keys(pictureData);
            const values = Object.values(pictureData);
            
            // Create parameterized query
            const placeholders = keys.map((_, i) => `$${i+1}`).join(', ');
            const columns = keys.join(', ');
            
            const query = `
                INSERT INTO user_pictures (${columns})
                VALUES (${placeholders})
                RETURNING *
            `;
            
            const result = await db.query(query, values);
            return result.rows[0] || null;
        } catch (error) {
            console.log(error);
            return null;
        }
    }
    
    static async delete(userId, pictureId) {
        try {
            await db.query(
                'DELETE FROM user_pictures WHERE id = $1 AND user_id = $2',
                [pictureId, userId]
            );
            return true;
        } catch (error) {
            console.log(error);
            return false;
        }
    }
    
    static async resetProfilePictures(userId) {
        try {
            await db.query(
                'UPDATE user_pictures SET is_profile = false WHERE user_id = $1',
                [userId]
            );
            return true;
        } catch (error) {
            console.log(error);
            return false;
        }
    }
    
    static async setAsProfile(userId, pictureId) {
        try {
            const result = await db.query(
                'UPDATE user_pictures SET is_profile = true WHERE id = $1 AND user_id = $2 RETURNING *',
                [pictureId, userId]
            );
            return result.rows[0] || null;
        } catch (error) {
            console.log(error);
            return null;
        }
    }
    
    static async findById(pictureId) {
        try {
            const result = await db.query(
                'SELECT * FROM user_pictures WHERE id = $1',
                [pictureId]
            );
            return result.rows[0] || null;
        } catch (error) {
            console.log(error);
            return null;
        }
    }
}

module.exports = UserPictures;