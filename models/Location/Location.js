const db = require('../../config/db.js');
const ApiException = require('../../exceptions/ApiException.js');

class Location {

    static async createLocation(locationData) {
        try {
            const result = await db.query(
                'INSERT INTO locations (user_id, longitude, latitude, city, country) VALUES ($1, $2, $3, $4, $5) RETURNING user_id',
                [locationData.userId, locationData.longitude, locationData.latitude, locationData.city, locationData.country]
            );
            return result.rows[0].user_id;
        } catch (error) {
            console.log(error);
            throw new ApiException(500, 'Failed to create location');
        }
    }

    static async findByUserId(userId) {
        try {
            const result = await db.query(
                'SELECT * FROM locations WHERE user_id = $1',
                [userId]
            );
            if (result.rows.length === 0)
                 throw new ApiException(404, 'Location not found for the given user ID');
            return result.rows[0];
        } catch (error) {
            if (error instanceof ApiException) throw error;
            console.log(error);
            throw new ApiException(500, 'Failed to find location by user ID');
        }
    }

    static async updateLocation(locationData) {
        try {
            const result = await db.query(
                'UPDATE locations SET longitude = $1, latitude = $2, city = $3, country = $4 WHERE user_id = $5 RETURNING *',
                [locationData.longitude, locationData.latitude, locationData.city, locationData.country, locationData.userId]
            );
            if (result.rows.length === 0)
                throw new ApiException(404, 'Location not found for the given user ID');
            return result.rows[0];
        } catch (error) {
            if (error instanceof ApiException) throw error;
            console.log(error);
            throw new ApiException(500, 'Failed to update location');
        }
    }
}

module.exports = Location;
