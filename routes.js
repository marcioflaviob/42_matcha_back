const express = require('express');
const UserController = require('./controllers/UserController.js');
const InterestsController = require('./controllers/InterestsController.js');
const ValidateUser = require('./utils/ValidateUser.js');
const UserPicturesController = require('./controllers/UserPicturesController.js');
const AuthController = require('./controllers/AuthController.js');
const upload = require('./utils/Multer.js');
const Authenticate = require('./utils/AuthMiddleware.js');
const UserInteractionsController = require('./controllers/UserInteractionsController.js');
const MessagesController = require('./controllers/MessagesController.js');
const PusherController = require('./controllers/PusherController.js');
const NotificationController = require('./controllers/NotificationController.js');
const EmailController = require('./controllers/EmailController.js');

const router = express.Router();

// Authentication
router.post('/auth/login', AuthController.login);
router.get('/auth/verify', AuthController.verify);
router.get('/auth/me', Authenticate, AuthController.getCurrentUser);

// Pusher
router.post('/auth/pusher', Authenticate, PusherController.pusherAuthentication);
router.post('/status/online', Authenticate, PusherController.broadcastOnlineStatus);
router.post('/status/offline', Authenticate, PusherController.broadcastOfflineStatus);

// User
router.get('/users', UserController.getAllUsers);
router.post('/new-user', ValidateUser, UserController.createUser);
router.get('/users/:id', UserController.getUserById);
router.get('/users/email/:email', UserController.getUserByEmail);
router.put('/update-user', Authenticate, ValidateUser, UserController.updateUser);
router.delete('/users/:id', ValidateUser, UserController.deleteUser); // TODO Remove this
router.patch('/users/reset-password', Authenticate, UserController.resetPassword);

// User Pictures
router.post('/upload/single/', Authenticate, upload.single('picture'), UserPicturesController.uploadPicture);
router.get('/pictures/:userId', UserPicturesController.getUserPictures);
router.delete('/pictures/:userId/:pictureId', UserPicturesController.deleteUserPicture);
router.put('/pictures/:userId/:pictureId/profile', UserPicturesController.setProfilePicture);

// User Interactions
router.post('/like/:id', Authenticate, UserInteractionsController.likeUser);
router.post('/seen/:id', Authenticate, UserInteractionsController.seeProfile);
router.get('/seen/', Authenticate, UserInteractionsController.getProfileViewsByUserId);
router.get('/matches/', Authenticate, UserInteractionsController.getMatchesByUserId);
router.get('/matches/potential', Authenticate, UserInteractionsController.getPotentialMatches);
router.post('/block/:id', Authenticate, UserInteractionsController.blockUser);

// Interests
router.get('/interests', InterestsController.getAllInterests);
router.get('/interests/:userId', InterestsController.getInterestsByUserId);

// Messages
router.post('/messages/', Authenticate, MessagesController.createMessage);
router.get('/messages/:id', Authenticate, MessagesController.getMessagesByUserId);
router.patch('/messages/read/:id', Authenticate, MessagesController.readAllMessages);

// Notification
router.get('/notifications', Authenticate, NotificationController.getNotSeenNotificationsByUserId);
router.patch('/notifications/', Authenticate, NotificationController.markNotificationAsSeen);

// Email
router.post('/email/forgot-password', EmailController.sendForgotPasswordEmail);
router.post('/email/validate', Authenticate, EmailController.sendValidationEmail);
router.patch('/email/validate', Authenticate, UserController.validateUser);

module.exports = router;