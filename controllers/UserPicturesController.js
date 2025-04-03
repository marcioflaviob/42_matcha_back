const UserPictureService = require('../services/UserPictureService');

exports.uploadPicture = async (req, res) => {
    try {

        const userId = req.user.id;

        if (!req.file) {
            return res.status(400).send({ error: 'No file uploaded' });
        }

        const isProfilePicture = req.body.isProfilePicture === 'true';

        const photo = {
            file: req.file,
            isProfilePicture: isProfilePicture
        };

        const result = await UserPictureService.uploadAndPersistPicture(userId, photo);

        return res.status(201).send(result);
    } catch (err) {
        console.error(err);
        return res.status(500).send({ error: err.message || 'Server error during upload' });
    }
};

exports.getUserPictures = async (req, res) => {
    try {
        const userId = req.params.userId;
        
        const pictures = await UserPictureService.getUserPictures(userId);
        
        return res.status(200).send(pictures);
    } catch (err) {
        console.error(err);
        return res.status(500).send({ error: err.message || 'Server error' });
    }
};

exports.deleteUserPicture = async (req, res) => {
    try {
        const { userId, pictureId } = req.params;
        
        const result = await UserPictureService.deleteUserPicture(userId, pictureId);
        
        return res.status(200).send(result);
    } catch (err) {
        console.error(err);
        return res.status(500).send({ error: err.message || 'Server error' });
    }
};

exports.setProfilePicture = async (req, res) => {
    try {
        const { userId, pictureId } = req.params;
        
        const updatedPicture = await UserPictureService.setProfilePicture(userId, pictureId);
        
        return res.status(200).send(updatedPicture);
    } catch (err) {
        console.error(err);
        return res.status(500).send({ error: err.message || 'Server error' });
    }
};