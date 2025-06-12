const { put, del } = require('@vercel/blob');
const UserPictures = require('../models/User/UserPictures.js');
const ApiException = require('../exceptions/ApiException.js');

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
        console.error('Error uploading picture:', err);
        throw new ApiException(500, 'Failed to upload picture');
    }
};

exports.uploadAndPersistPicture = async (userId, photo) => {
    const existingPictures = await this.getUserPictures(userId);
    if (existingPictures.length >= 5) {
        throw new ApiException(400, 'You can only upload up to 5 pictures');
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

    const picture = await UserPictures.create(pictureData);

    return picture;
};

exports.getUserPictures = async (userId) => {
    const pictures = await UserPictures.findByUserId(userId);
    return pictures;
};

async function deleteFile(url) {
    try {
        await del(url);
        return true;
    } catch (error) {
        console.error('Error deleting file:', error);
        throw new ApiException(500, 'Failed to delete file');
    }
}

exports.deleteUserPicture = async (userId, pictureId) => {
    const picture = await UserPictures.findById(pictureId);
    const deleted = await UserPictures.delete(userId, pictureId);
    const filename = `${process.env.BLOB_URL}/${picture.url}`;

    // Call deleteFile but don't let it crash the main operation
    deleteFile(filename).catch(error => {
        // Error is already logged in deleteFile function
        console.log('File deletion failed, but database operation completed');
    });

    if (!deleted) throw new ApiException(500, 'Failed to delete picture');

    return { message: 'Picture deleted successfully' };
};

exports.setProfilePicture = async (userId, pictureId) => {
    await UserPictures.resetProfilePicture(userId);

    const updatedPicture = await UserPictures.setAsProfile(userId, pictureId);

    if (!updatedPicture) throw new ApiException(500, 'Failed to set picture as profile');

    return updatedPicture;
};