const db = require('../../config/db.js');
const ApiException = require('../../exceptions/ApiException.js');

class UserPictures {
    static async findByUserId(userId) {
        try {
            const result = await db.query(
                'SELECT * FROM user_pictures WHERE user_id = $1',
                [userId]
            );

            if (result.rows.length === 0) throw new ApiException(404, 'No pictures found for this user');
            
            return result.rows;
        } catch (error) {
            console.log(error);
            throw new ApiException(500, 'Failed to fetch user pictures');
        }
    }
    
    static async create(pictureData) {
        try {
            const keys = Object.keys(pictureData);
            const values = Object.values(pictureData);
            
            const placeholders = keys.map((_, i) => `$${i+1}`).join(', ');
            const columns = keys.join(', ');
            
            const query = `
                INSERT INTO user_pictures (${columns})
                VALUES (${placeholders})
                RETURNING *
            `;

            
            const result = await db.query(query, values);
            if (result.rows.length === 0) throw new ApiException(500, 'Failed to create user picture');

            return result.rows[0];
        } catch (error) {
            console.log(error);
            throw new ApiException(500, 'Failed to create user picture');
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
            throw new ApiException(500, 'Failed to delete user picture');
        }
    }
    
    static async resetProfilePicture(userId) {
        try {
            await db.query(
                'UPDATE user_pictures SET is_profile = false WHERE user_id = $1',
                [userId]
            );
            return true;
        } catch (error) {
            console.log(error);
            throw new ApiException(500, 'Failed to reset profile picture');
        }
    }
    
    static async setAsProfile(userId, pictureId) {
        try {
            const result = await db.query(
                'UPDATE user_pictures SET is_profile = true WHERE id = $1 AND user_id = $2 RETURNING *',
                [pictureId, userId]
            );

            if (result.rows.length === 0) throw new ApiException(404, 'Picture not found or not owned by user');
            return result.rows[0];
        } catch (error) {
            console.log(error);
            throw new ApiException(500, 'Failed to set picture as profile');
        }
    }
    
    static async findById(pictureId) {
        try {
            const result = await db.query(
                'SELECT * FROM user_pictures WHERE id = $1',
                [pictureId]
            );
            if (result.rows.length === 0) throw new ApiException(404, 'Picture not found');
            return result.rows[0];
        } catch (error) {
            console.log(error);
            throw new ApiException(500, 'Failed to fetch picture by ID');
        }
    }
}

module.exports = UserPictures;