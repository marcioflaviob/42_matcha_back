const UserPictureService = require('../services/UserPictureService.js');

exports.uploadPicture = async (req, res) => {
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
};

exports.getUserPictures = async (req, res) => {
    const userId = req.params.userId;
    
    const pictures = await UserPictureService.getUserPictures(userId);
    
    return res.status(200).send(pictures);
};

exports.deleteUserPicture = async (req, res) => {
    const { userId, pictureId } = req.params;
    
    const result = await UserPictureService.deleteUserPicture(userId, pictureId);
    
    return res.status(200).send(result);
};

exports.setProfilePicture = async (req, res) => {
    const { userId, pictureId } = req.params;
    
    const updatedPicture = await UserPictureService.setProfilePicture(userId, pictureId);
    
    return res.status(200).send(updatedPicture);
};

exports.uploadPictureFromUrl = async (req, res) => {
    const userId = req.user.id;
    const { url } = req.body;
    if (!url) return res.status(400).send({ error: 'No URL provided' });

    const result = await UserPictureService.uploadAndPersistPictureFromUrl(userId, url);
    return res.status(201).send(result);
};