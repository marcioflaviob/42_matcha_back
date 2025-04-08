const express = require('express');
const UserController = require('./controllers/UserController');
const InterestsController = require('./controllers/InterestsController');
const ValidateUser = require('./utils/ValidateUser');
const UserPicturesController = require('./controllers/UserPicturesController');
const AuthController = require('./controllers/AuthController');
const upload = require('./utils/Multer');
const Authenticate = require('./utils/AuthMiddleware'); // Add Authenticate to the routes that need authentication

const router = express.Router();

// Authentication
router.post('/auth/login', AuthController.login);
router.get('/auth/verify', AuthController.verify);
router.get('/auth/me', Authenticate, AuthController.getCurrentUser);

// User
router.get('/users', UserController.getAllUsers);
router.post('/new-user', ValidateUser, UserController.createUser);
router.get('/users/:id', UserController.getUserById);
router.get('/users/email/:email', UserController.getUserByEmail);
router.put('/update-user', Authenticate, ValidateUser, UserController.updateUser);
router.delete('/users/:id', ValidateUser, UserController.deleteUser);

// User Pictures
router.post('/upload/single/', Authenticate, upload.single('picture'), UserPicturesController.uploadPicture);
router.get('/pictures/:userId', UserPicturesController.getUserPictures);
router.delete('/pictures/:userId/:pictureId', UserPicturesController.deleteUserPicture);
router.put('/pictures/:userId/:pictureId/profile', UserPicturesController.setProfilePicture);

// Interests
router.get('/interests', InterestsController.getAllInterests);
router.get('/interests/:userId', InterestsController.getInterestsByUserId);

module.exports = router;