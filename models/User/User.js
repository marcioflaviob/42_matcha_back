const db = require('../../config/db');
const { updateInterests, updatePhotos } = require('./helper');

class User {

    static async findAll() {
        try {
            const result = await db.query('SELECT * FROM users');
            return result.rows;
        } catch (error) {
            console.log(error);
            return [];
        }
    }

    static async findById(id) {
        try {
            const result = await db.query('SELECT * FROM users WHERE id = $1', [id]);
            return result.rows[0] || null;
        } catch (error) {
            console.log(error);
            return null;
        }
    }

    static async create(userData) {
        try {
            // Extract and separate keys and values for SQL
            const keys = Object.keys(userData);
            const values = Object.values(userData);
            
            // Create parameterized query
            const placeholders = keys.map((_, i) => `$${i+1}`).join(', ');
            const columns = keys.join(', ');
            
            const query = `
                INSERT INTO users (${columns})
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

    static async update(userData) {
        const result = {};
        const id = userData.id;
        const interests = userData.interests;
        const photos = userData.photos;
        delete userData.photos;
        delete userData.interests;
        delete userData.id;
        
        try {
            // Extract keys and values for the SET clause
            const keys = Object.keys(userData);
            const values = Object.values(userData);
            
            // Create SET clause with parameters
            const setClause = keys.map((key, i) => `${key} = $${i+2}`).join(', ');
            
            const query = `
                UPDATE users 
                SET ${setClause}
                WHERE id = $1
                RETURNING *
            `;
            
            const updateResult = await db.query(query, [id, ...values]);
            result.userData = updateResult.rows[0];
            
            if (interests && Array.isArray(interests)) {
                await updateInterests(id, interests, result);
            }
            
            if (photos && Array.isArray(photos)) {
                await updatePhotos(id, photos, result);
            }
            
            return result;
        } catch (error) {
            console.log(error);
            result.userError = error;
            return result;
        }
    }

    static async delete(id) {
        try {
            await db.query('DELETE FROM users WHERE id = $1', [id]);
            return { success: true };
        } catch (error) {
            console.log(error);
            return { success: false, error };
        }
    }
}

module.exports = User;