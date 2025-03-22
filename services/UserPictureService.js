const { put } = require('@vercel/blob');
const UserPictures = require('../models/User/UserPictures');

exports.uploadPicture = async (userId, file, isProfile) => {
    try {
        const filename = `${userId}_${Date.now()}_${file.originalname}`;

		if (this.getUserPictures(userId).length >= 5) {
			return res.status(400).send({ error: 'Maximum 5 pictures allowed' });
		}
        
        // Upload to BLOB
        const blob = await put(filename, file.buffer, {
            access: 'public',
            contentType: file.mimetype
        });

		const urlPath = new URL(blob.url).pathname.substring(1);

        const pictureData = {
            user_id: userId,
            url: urlPath,
            is_profile: isProfile === 'true'
        };

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

exports.uploadPictures = async (req, res) => {
    try {
        const userId = req.params.userId;
        
        // Check if any files were uploaded
        if (!req.files || req.files.length === 0) {
            return res.status(400).send({ error: 'No files uploaded' });
        }
        
        // Check if trying to upload more than allowed
        if (req.files.length > 5 || this.getUserPictures(userId).length >= 5) {
            return res.status(400).send({ error: 'Maximum 5 pictures allowed' });
        }
        
        // Get profile picture flag - usually for the first image
        const isProfilePicture = req.body.isProfile === 'true';
        
        // Process all uploaded files
        const uploadPromises = req.files.map((file, index) => {
            // Make only the first image profile picture if isProfile is true
            const makeProfile = isProfilePicture && index === 0;
            return UserPictureService.uploadPicture(userId, file, makeProfile);
        });
        
        // Wait for all uploads to complete
        const results = await Promise.all(uploadPromises);
        
        return res.status(201).send(results);
    } catch (err) {
        console.error(err);
        return res.status(500).send({ error: err.message || 'Server error during upload' });
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
    // First reset all profile pictures for this user
    await UserPictures.resetProfilePictures(userId);
    
    // Then set the new profile picture
    const updatedPicture = await UserPictures.setAsProfile(userId, pictureId);
    
    if (!updatedPicture) {
        throw new Error('Failed to update profile picture');
    }
    
    return updatedPicture;
};