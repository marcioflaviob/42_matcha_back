const express = require('express');
const UserController = require('./controllers/UserController');
const InterestsController = require('./controllers/InterestsController');
const ValidateUser = require('./utils/ValidateUser');
const UserPicturesController = require('./controllers/UserPicturesController');
const upload = require('./utils/Multer');

const router = express.Router();

// User
router.get('/users', UserController.getAllUsers);
router.post('/new-user', ValidateUser, UserController.createUser);
router.get('/users/:id', UserController.getUserById);
router.put('/users/:id', ValidateUser, UserController.updateUser);
router.delete('/users/:id', ValidateUser, UserController.deleteUser);

// User Pictures
router.post('/upload/single/:userId', upload.single('picture'), UserPicturesController.uploadPicture);
router.post('/upload/multiple/:userId', upload.single('picture'), UserPicturesController.uploadPicture);
router.get('/pictures/:userId', UserPicturesController.getUserPictures);
router.delete('/pictures/:userId/:pictureId', UserPicturesController.deleteUserPicture);
router.put('/pictures/:userId/:pictureId/profile', UserPicturesController.setProfilePicture);

// Interests
router.get('/interests', InterestsController.getAllInterests);
router.get('/interests/:userId', InterestsController.getInterestsByUserId);

module.exports = router;