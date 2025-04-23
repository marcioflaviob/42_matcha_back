const { put } = require('@vercel/blob');
const UserPictures = require('../models/User/UserPictures.js');

exports.uploadPicture = async (userId, file) => {
    try {
        const filename = `${userId}_${Date.now()}_${file.originalname}`;
        
        const blob = await put(filename, file.buffer, {
            access: 'public',
            contentType: file.mimetype
        });

        const urlPath = new URL(blob.url).pathname.substring(1);

        return urlPath;
    } catch (err) {
        throw err;
    }
};

exports.uploadAndPersistPicture = async (userId, photo) => {
    try {

		if (this.getUserPictures(userId).length >= 5) {
			return res.status(400).send({ error: 'Maximum 5 pictures allowed' });
		}

		const urlPath = await this.uploadPicture(userId, photo.file);

        const pictureData = {
            user_id: userId,
            url: urlPath,
            is_profile: photo.isProfilePicture || false,
        };

        if (photo.isProfilePicture) {
            await UserPictures.resetProfilePicture(userId);
        }

		// Save picture information to database
        const picture = await UserPictures.create(pictureData);

        if (!picture) {
            throw new Error('Failed to save picture information');
        }

        return picture;
    } catch (err) {
        throw err;
    }
};

exports.getUserPictures = async (userId) => {
    const pictures = await UserPictures.findByUserId(userId);
    
    if (!pictures) {
        throw new Error('Failed to fetch pictures');
    }
    
    return pictures;
};

exports.deleteUserPicture = async (userId, pictureId) => {
    const deleted = await UserPictures.delete(userId, pictureId);
    
    if (!deleted) {
        throw new Error('Failed to delete picture');
    }
    
    return { message: 'Picture deleted successfully' };
};

exports.setProfilePicture = async (userId, pictureId) => {
    await UserPictures.resetProfilePicture(userId);
    
    const updatedPicture = await UserPictures.setAsProfile(userId, pictureId);
    
    if (!updatedPicture) {
        throw new Error('Failed to update profile picture');
    }
    
    return updatedPicture;
};