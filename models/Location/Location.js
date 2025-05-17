const db = require('../../config/db.js');

class Location {

    static async createLocation(locationData) {
        try {
            const result = await db.query(
                'INSERT INTO location (user_id, longitude, latitude, city, country) VALUES ($1, $2, $3, $4, $5) RETURNING user_id',
                [locationData.userId, locationData.longitude, locationData.latitude, locationData.city, locationData.country]
            );
            return result.rows[0].id; // Return the newly created location ID
        } catch (error) {
            console.log(error);
            throw new Error('Failed to create location');
        }
    }

    static async findByUserId(userId) {
        try {
            const result = await db.query(
                'SELECT * FROM location WHERE user_id = $1',
                [userId]
            );
            if (result.rows.length === 0) {
                throw new Error('Location not found for the given user ID');
            }
            return result.rows[0];
        } catch (error) {
            console.log(error);
            throw new Error('Failed to find location by user ID');
        }
    }

    static async updateLocation(userId, locationData) {
        try {
            const result = await db.query(
                'UPDATE location SET longitude = $1, latitude = $2, city = $3, country = $4 WHERE user_id = $5 RETURNING *',
                [locationData.longitude, locationData.latitude, locationData.city, locationData.country, userId]
            );
            if (result.rows.length === 0) {
                throw new Error('Location not found for the given user ID');
            }
            return result.rows[0];
        } catch (error) {
            console.log(error);
            throw new Error('Failed to update location');
        }
    }
}

module.exports = Location;