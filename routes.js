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
const LocationController = require('./controllers/LocationController.js');
const DatesController = require('./controllers/DatesController.js');
const asyncHandler = require('./utils/AsyncHandler.js');

const router = express.Router();

// Authentication
router.post('/auth/login', asyncHandler(AuthController.login));
router.get('/auth/verify', asyncHandler(AuthController.verify));
router.get('/auth/me', Authenticate, asyncHandler(AuthController.getCurrentUser));
router.get('/auth/google', asyncHandler(AuthController.googleAuth));
router.get('/auth/google/callback', asyncHandler(AuthController.googleCallback));

// Pusher
router.post('/auth/pusher', Authenticate, asyncHandler(PusherController.pusherAuthentication));
router.post('/status/online', Authenticate, asyncHandler(PusherController.broadcastOnlineStatus));
router.post('/status/offline', Authenticate, asyncHandler(PusherController.broadcastOfflineStatus));

// User
router.get('/users', asyncHandler(UserController.getAllUsers));
router.post('/new-user', ValidateUser, asyncHandler(UserController.createUser));
router.get('/users/:id', asyncHandler(UserController.getUserById));
router.get('/users/email/:email', asyncHandler(UserController.getUserByEmail));
router.put('/update-user', Authenticate, ValidateUser, asyncHandler(UserController.updateUser));
router.patch('/users/reset-password', Authenticate, asyncHandler(UserController.resetPassword));

// User Pictures
router.post('/upload/single/', Authenticate, upload.single('picture'), asyncHandler(UserPicturesController.uploadPicture));
router.get('/pictures/:userId', asyncHandler(UserPicturesController.getUserPictures));
router.delete('/pictures/:userId/:pictureId', asyncHandler(UserPicturesController.deleteUserPicture));
router.put('/pictures/:userId/:pictureId/profile', asyncHandler(UserPicturesController.setProfilePicture));

// User Interactions
router.post('/like/:id', Authenticate, asyncHandler(UserInteractionsController.likeUser));
router.get('/seen/', Authenticate, asyncHandler(UserInteractionsController.getProfileViewsByUserId));
router.get('/matches/', Authenticate, asyncHandler(UserInteractionsController.getMatchesByUserId));
router.get('/matches/potential', Authenticate, asyncHandler(UserInteractionsController.getPotentialMatches));
router.post('/block/:id', Authenticate, asyncHandler(UserInteractionsController.blockUser));

// Interests
router.get('/interests', asyncHandler(InterestsController.getAllInterests));
router.get('/interests/:userId', asyncHandler(InterestsController.getInterestsByUserId));

// Messages
router.post('/messages/', Authenticate, asyncHandler(MessagesController.createMessage));
router.get('/messages/:id', Authenticate, asyncHandler(MessagesController.getMessagesByUserId));
router.patch('/messages/read/:id', Authenticate, asyncHandler(MessagesController.readAllMessages));

// Notification
router.get('/notifications', Authenticate, asyncHandler(NotificationController.getNotSeenNotificationsByUserId));
router.patch('/notifications/', Authenticate, asyncHandler(NotificationController.markNotificationAsSeen));
router.post('/call/:id', Authenticate, asyncHandler(NotificationController.sendNewCallNotification));
router.post('/seen/:id', Authenticate, asyncHandler(NotificationController.sendSeenNotification));
router.post('/refuse-call/:id', Authenticate, asyncHandler(NotificationController.sendRefuseCallNotification));
router.post('/stop-call/:id', Authenticate, asyncHandler(NotificationController.sendStopCallNotification));

// Email
router.post('/email/forgot-password', asyncHandler(EmailController.sendForgotPasswordEmail));
router.post('/email/validate', Authenticate, asyncHandler(EmailController.sendValidationEmail));
router.patch('/email/validate', Authenticate, asyncHandler(UserController.validateUser));

// Location
router.post('/location/ip/:id', Authenticate, LocationController.setUserLocation);
router.post('/location/city', Authenticate, LocationController.setCityAndCountry);
router.get('/location/address', Authenticate, LocationController.getAddress)

//Dates
router.post('/dates', Authenticate, asyncHandler(DatesController.createDate));
router.get('/dates', Authenticate, asyncHandler(DatesController.getDatesByUserId));
router.patch('/dates', Authenticate, asyncHandler(DatesController.updateDate));
router.get('/date/:id', Authenticate, asyncHandler(DatesController.getDateById));

module.exports = router;