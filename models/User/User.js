const db = require('../../config/db');
const bcrypt = require('bcrypt');

class User {

    static async findAll() {
        try {
            const queryResult = await db.query('SELECT * FROM users');

            const result = queryResult.rows.map(row => {
                const { password, ...userWithoutPassword } = row;
                return userWithoutPassword;
            });

            return result;
        } catch (error) {
            console.log(error);
            throw new Error(error);
        }
    }

    static async findById(id) {
        try {
            const queryResult = await db.query('SELECT * FROM users WHERE id = $1', [id]);
            if (queryResult.rows.length === 0) return null;
            const { password, ...userWithoutPassword } = queryResult.rows[0];

            return userWithoutPassword;
        } catch (error) {
            console.log(error);
            throw new Error(error);
        }
    }

    static async findByEmail(email) {
        try {
            const queryResult = await db.query('SELECT * FROM users WHERE email = $1', [email]);
            if (queryResult.rows.length === 0) return null;
            const { password, ...userWithoutPassword } = queryResult.rows[0];

            return userWithoutPassword;
        } catch (error) {
            console.log(error);
            throw new Error(error);
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
            
            const placeholders = keys.map((_, i) => `$${i+1}`).join(', ');
            const columns = keys.join(', ');
            
            const query = `
                INSERT INTO users (${columns})
                VALUES (${placeholders})
                RETURNING *
            `;
            
            const result = await db.query(query, values);
            if (result.rows.length === 0) return null;
            const { password, ...userWithoutPassword } = result.rows[0];
            return userWithoutPassword;
        } catch (error) {
            console.log(error);
            return null;
        }
    }

    static async update(req) {
        const result = {};
        const userData = req.body;
        const id = req.user.id;
        const interests = userData.interests_tags;
        
        // Remove these fields because they will be handled separately since they are stored in different tables
        delete userData.interests_tags;
        delete userData.id;
        
        try {
            if (Object.keys(userData).length > 0) {

                if (userData.password) {
                    const salt = await bcrypt.genSalt(10);
                    userData.password = await bcrypt.hash(userData.password, salt);
                }
                
                const keys = Object.keys(userData);
                const values = Object.values(userData);
                
                const setClause = keys.map((key, i) => `${key} = $${i+2}`).join(', ');
                
                const query = `
                    UPDATE users 
                    SET ${setClause}
                    WHERE id = $1
                    RETURNING *
                `;
                
                const updateResult = await db.query(query, [id, ...values]);
                result.userData = updateResult.rows[0];
            } else {
                const userResult = await db.query('SELECT * FROM users WHERE id = $1', [id]);
                result.userData = userResult.rows[0];
            }
            
            if (interests !== undefined) {
                try {
                    const InterestsService = require('../../services/InterestsService');
                    
                    if (Array.isArray(interests)) {
                        await InterestsService.updateInterests(id, interests);
                        result.userData.interests = await InterestsService.getInterestsNamesByUserId(id);
                    }
                } catch (interestError) {
                    result.interestError = interestError.message;
                    console.log('Interest update error:', interestError);
                    throw new Error(interestError);
                }
            }
            
            delete result.userData.password;
            return result;
        } catch (error) {
            console.log('User update error:', error);
            result.userError = error.message;
            throw new Error(error);
        }
    }

    static async delete(id) {
        try {
            await db.query('DELETE FROM users WHERE id = $1', [id]);
            return { success: true };
        } catch (error) {
            console.log(error);
            throw new Error(error);
        }
    }

    static async changePassword(userId, currentPassword, newPassword) {
        try {
            const user = await this.findById(userId);
            
            if (!user) {
                return { success: false, message: 'User not found' };
            }
            
            // Verify current password
            const isMatch = await bcrypt.compare(currentPassword, user.password);
            
            if (!isMatch) {
                return { success: false, message: 'Current password is incorrect' };
            }
            
            // Hash new password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(newPassword, salt);
            
            // Update password in database
            await db.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, userId]);
            
            return { success: true, message: 'Password updated successfully' };
        } catch (error) {
            console.log(error);
            throw new Error(error);
        }
    }
}

module.exports = User;