const { put, del } = require('@vercel/blob');
const UserPictures = require('../models/User/UserPictures.js');
const ApiException = require('../exceptions/ApiException.js');
const fetch = require('node-fetch');
const path = require('path');

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
        throw new ApiException(500, err.message || 'Failed to upload picture');
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
    if (!userId) throw new ApiException(400, 'User ID is required');

    const pictures = await UserPictures.findByUserId(userId);

    return pictures;
};

async function deleteFile(url) {
    try {
        await del(url);
        return true;
    } catch (error) {
        throw new ApiException(500, error.message || 'Failed to delete file');
    }
}

exports.deleteUserPicture = async (userId, pictureId) => {
    const userPictures = await this.getUserPictures(userId);
    const picture = userPictures.find(pic => pic.id == pictureId);
    if (!picture) throw new ApiException(404, 'Picture not found');
    if (picture.user_id != userId) throw new ApiException(403, 'You do not have permission to delete this picture');
    if (userPictures.length <= 1) throw new ApiException(400, 'You must have at least one picture');

    if (picture.is_profile) {
        const anotherPicture = userPictures.find(pic => pic.id !== pictureId);
        this.setProfilePicture(userId, anotherPicture.id);
    }

    const deleted = await UserPictures.delete(userId, pictureId);
    const filename = `${process.env.BLOB_URL}/${picture.url}`;

    deleteFile(filename).catch(error => {
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

exports.uploadAndPersistPictureFromUrl = async (userId, url) => {
    const userPictures = await exports.getUserPictures(userId);
    if (userPictures.length >= 5) {
        throw new ApiException(400, 'You can only upload up to 5 pictures');
    }
    let response;

    let parsedUrl;
    try {
        parsedUrl = new URL(url);
    } catch (err) {
        throw new ApiException(400, err.message || 'Invalid URL format');
    }

    try {
        response = await fetch(parsedUrl, { method: 'GET', timeout: 10000 });
    } catch (err) {
        throw new ApiException(500, err.message || 'Failed to fetch image from URL');
    }
    if (!response.ok) {
        if (response.status === 404) {
            throw new ApiException(404, 'Image not found at URL');
        }
        throw new ApiException(500, 'Failed to fetch image from URL');
    }
    const contentType = response.headers.get('content-type');
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(contentType)) {
        throw new ApiException(400, 'URL does not point to a valid web image');
    }
    const buffer = await response.buffer();
    if (buffer.length > 5 * 1024 * 1024) {
        throw new ApiException(400, 'Image exceeds 5MB size limit');
    }
    const filename = path.basename(url.split('?')[0]) || `image_${Date.now()}`;
    const file = {
        originalname: filename,
        mimetype: contentType,
        buffer: buffer
    };
    const photo = {
        file,
        isProfilePicture: false
    };
    return await exports.uploadAndPersistPicture(userId, photo);
};