const db = require('../../config/db');

module.exports.updateInterests = async function updateInterests(id, interests, result) {
    try {
        // Remove all existing interests for this user
        await db.query('DELETE FROM user_interests WHERE user_id = $1', [id]);
        
        // Add the new interests
        if (interests && interests.length > 0) {
            // Build values for batch insert
            const values = [];
            const placeholders = [];
            let counter = 1;
            
            interests.forEach((interestId, index) => {
                values.push(id, interestId);
                placeholders.push(`($${counter}, $${counter + 1})`);
                counter += 2;
            });
            
            // Insert all new interests
            const query = `
                INSERT INTO user_interests (user_id, interest_id)
                VALUES ${placeholders.join(', ')}
                RETURNING *
            `;
            
            const interestData = await db.query(query, values);
            result.interestsData = interestData.rows;
        }
    } catch (error) {
        console.log(error);
        result.interestsError = error;
    }
    
    return result;
};

module.exports.updatePhotos = async function updatePhotos(id, photos, result) {
    try {
        // Remove all existing photos for this user
        await db.query('DELETE FROM user_pictures WHERE user_id = $1', [id]);
        
        // Add the new photos
        if (photos && photos.length > 0) {
            // Build values for batch insert
            const values = [];
            const placeholders = [];
            let counter = 1;
            
            photos.forEach((photoUrl) => {
                values.push(id, photoUrl, false); // user_id, url, is_profile
                placeholders.push(`($${counter}, $${counter + 1}, $${counter + 2})`);
                counter += 3;
            });
            
            // Insert all new photos
            const query = `
                INSERT INTO user_pictures (user_id, url, is_profile)
                VALUES ${placeholders.join(', ')}
                RETURNING *
            `;
            
            const photoData = await db.query(query, values);
            result.photosData = photoData.rows;
        }
    } catch (error) {
        console.log(error);
        result.photosError = error;
    }
    
    return result;
};