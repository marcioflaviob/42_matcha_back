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

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: User authentication
 */

/**
 * @swagger
 * tags:
 *   name: Pusher
 *   description: Pusher authentication and status updates
 */

/**
 * @swagger
 * tags:
 *   name: User
 *   description: User management
 */

/**
 * @swagger
 * tags:
 *   name: User Pictures
 *   description: User picture management
 */

/**
 * @swagger
 * tags:
 *   name: User Interactions
 *   description: User likes, matches, blocks, etc.
 */

/**
 * @swagger
 * tags:
 *   name: Interests
 *   description: User interests
 */

/**
 * @swagger
 * tags:
 *   name: Messages
 *   description: Chat messages
 */

/**
 * @swagger
 * tags:
 *   name: Notification
 *   description: User notifications
 */

/**
 * @swagger
 * tags:
 *   name: Email
 *   description: Email services
 */

/**
 * @swagger
 * tags:
 *   name: Location
 *   description: User location services
 */

/**
 * @swagger
 * tags:
 *   name: Dates
 *   description: User dates management
 */

// Authentication
/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login a user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successful login
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.post('/auth/login', asyncHandler(AuthController.login));

/**
 * @swagger
 * /auth/verify:
 *   get:
 *     summary: Verify email address
 *     tags: [Authentication]
 *     parameters:
 *       - in: query
 *         name: token
 *         schema:
 *           type: string
 *         required: true
 *         description: The verification token sent to the user's email
 *     responses:
 *       200:
 *         description: Email verified successfully
 *       400:
 *         description: Invalid or expired token
 */
router.get('/auth/verify', asyncHandler(AuthController.verify));

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get the currently authenticated user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: The authenticated user's data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 */
router.get('/auth/me', Authenticate, asyncHandler(AuthController.getCurrentUser));

/**
 * @swagger
 * /auth/google:
 *   get:
 *     summary: Redirect to Google for authentication
 *     tags: [Authentication]
 *     responses:
 *       302:
 *         description: Redirects to Google's authentication page
 */
router.get('/auth/google', asyncHandler(AuthController.googleAuth));

/**
 * @swagger
 * /auth/google/callback:
 *   get:
 *     summary: Google authentication callback
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Successfully authenticated with Google
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *       500:
 *         description: Internal Server Error
 */
router.get('/auth/google/callback', asyncHandler(AuthController.googleCallback));

// Pusher
/**
 * @swagger
 * /auth/pusher:
 *   post:
 *     summary: Authenticate a user for Pusher
 *     tags: [Pusher]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               socket_id:
 *                 type: string
 *               channel_name:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successfully authenticated for Pusher
 *       401:
 *         description: Unauthorized
 */
router.post('/auth/pusher', Authenticate, asyncHandler(PusherController.pusherAuthentication));

/**
 * @swagger
 * /status/online:
 *   post:
 *     summary: Broadcast that the user is online
 *     tags: [Pusher]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Online status broadcasted
 *       401:
 *         description: Unauthorized
 */
router.post('/status/online', Authenticate, asyncHandler(PusherController.broadcastOnlineStatus));

/**
 * @swagger
 * /status/offline:
 *   post:
 *     summary: Broadcast that the user is offline
 *     tags: [Pusher]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Offline status broadcasted
 *       401:
 *         description: Unauthorized
 */
router.post('/status/offline', Authenticate, asyncHandler(PusherController.broadcastOfflineStatus));

// User
// router.get('/users', asyncHandler(UserController.getAllUsers));
/**
 * @swagger
 * /new-user:
 *   post:
 *     summary: Create a new user
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Bad request
 */
router.post('/new-user', ValidateUser, asyncHandler(UserController.createUser));

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get a user by ID
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The user ID
 *     responses:
 *       200:
 *         description: The user data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 */
router.get('/users/:id', Authenticate, asyncHandler(UserController.getUserById));

/**
 * @swagger
 * /profile/{id}:
 *   get:
 *     summary: Get a user by ID
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The user ID
 *     responses:
 *       200:
 *         description: The user data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 */
router.get('/profile/:id', Authenticate, asyncHandler(UserController.getUserProfileById));

/**
 * @swagger
 * /update-user:
 *   put:
 *     summary: Update the current user's profile
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Bad request
 */
router.put('/update-user', Authenticate, ValidateUser, asyncHandler(UserController.updateUser));

/**
 * @swagger
 * /users/reset-password:
 *   patch:
 *     summary: Reset the user's password
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               oldPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       400:
 *         description: Bad request
 */
router.patch('/users/reset-password', Authenticate, asyncHandler(UserController.resetPassword));

// User Pictures
/**
 * @swagger
 * /upload/single:
 *   post:
 *     summary: Upload a single picture for the user
 *     tags: [User Pictures]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               picture:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Picture uploaded successfully
 *       400:
 *         description: Bad request
 */
router.post('/upload/single', Authenticate, upload.single('picture'), asyncHandler(UserPicturesController.uploadPicture));

/**
 * @swagger
 * /pictures/{userId}:
 *   get:
 *     summary: Get all pictures for a user
 *     tags: [User Pictures]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The user ID
 *     responses:
 *       200:
 *         description: A list of user pictures
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Picture'
 *       404:
 *         description: User not found
 */
router.get('/pictures/:userId', Authenticate, asyncHandler(UserPicturesController.getUserPictures));

/**
 * @swagger
 * /pictures/{userId}/{pictureId}:
 *   delete:
 *     summary: Delete a user's picture
 *     tags: [User Pictures]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The user ID
 *       - in: path
 *         name: pictureId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The picture ID
 *     responses:
 *       200:
 *         description: Picture deleted successfully
 *       404:
 *         description: Picture not found
 */
router.delete('/pictures/:userId/:pictureId', Authenticate, asyncHandler(UserPicturesController.deleteUserPicture));

/**
 * @swagger
 * /pictures/{userId}/{pictureId}/profile:
 *   put:
 *     summary: Set a user's profile picture
 *     tags: [User Pictures]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The user ID
 *       - in: path
 *         name: pictureId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The picture ID
 *     responses:
 *       200:
 *         description: Profile picture set successfully
 *       404:
 *         description: Picture not found
 */
router.put('/pictures/:userId/:pictureId/profile', Authenticate, asyncHandler(UserPicturesController.setProfilePicture));

/**
 * @swagger
 * /pictures/upload-from-url:
 *   post:
 *     summary: Upload a picture from a URL
 *     tags: [User Pictures]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               url:
 *                 type: string
 *                 format: url
 *     responses:
 *       200:
 *         description: Picture uploaded successfully
 *       400:
 *         description: Bad request
 */
router.post('/pictures/upload-from-url', Authenticate, asyncHandler(UserPicturesController.uploadPictureFromUrl));

// User Interactions
/**
 * @swagger
 * /like/{id}:
 *   post:
 *     summary: Like a user
 *     tags: [User Interactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the user to like
 *     responses:
 *       200:
 *         description: User liked successfully
 *       404:
 *         description: User not found
 */
router.post('/like/:id', Authenticate, asyncHandler(UserInteractionsController.likeUser));

/**
 * @swagger
 * /seen:
 *   get:
 *     summary: Get users who have seen the current user's profile
 *     tags: [User Interactions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of profile views
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 */
router.get('/seen/', Authenticate, asyncHandler(UserInteractionsController.getProfileViewsByUserId));

/**
 * @swagger
 * /matches:
 *   get:
 *     summary: Get all matches for the current user
 *     tags: [User Interactions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of matched users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 */
router.get('/matches', Authenticate, asyncHandler(UserInteractionsController.getMatchesByUserId));

/**
 * @swagger
 * /matches/potential:
 *   get:
 *     summary: Get potential matches for the current user
 *     tags: [User Interactions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of potential matches
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 */
router.get('/matches/potential', Authenticate, asyncHandler(UserInteractionsController.getPotentialMatches));

/**
 * @swagger
 * /block/{id}:
 *   post:
 *     summary: Block a user
 *     tags: [User Interactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the user to block
 *     responses:
 *       200:
 *         description: User blocked successfully
 *       404:
 *         description: User not found
 */
router.post('/block/:id', Authenticate, asyncHandler(UserInteractionsController.blockUser));

/**
 * @swagger
 * /report/{id}:
 *   post:
 *     summary: Report a user
 *     tags: [User Interactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the user to report
 *     responses:
 *       200:
 *         description: User reported successfully
 *       404:
 *         description: User not found
 */
router.post('/report/:id', Authenticate, asyncHandler(UserInteractionsController.reportUser));

/**
 * @swagger
 * /unlike/{id}:
 *   delete:
 *     summary: Unlike a user
 *     tags: [User Interactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the user to unlike
 *     responses:
 *       200:
 *         description: User unliked successfully
 *       404:
 *         description: User not found
 */
router.delete('/unlike/:id', Authenticate, asyncHandler(UserInteractionsController.unlikeUser));

// Interests
/**
 * @swagger
 * /interests:
 *   get:
 *     summary: Get all available interests
 *     tags: [Interests]
 *     responses:
 *       200:
 *         description: A list of interests
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Interest'
 */
router.get('/interests', asyncHandler(InterestsController.getAllInterests));

/**
 * @swagger
 * /interests/{userId}:
 *   get:
 *     summary: Get interests for a specific user
 *     tags: [Interests]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The user ID
 *     responses:
 *       200:
 *         description: A list of the user's interests
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Interest'
 *       404:
 *         description: User not found
 */
router.get('/interests/:userId', asyncHandler(InterestsController.getInterestsByUserId));

// Messages
/**
 * @swagger
 * /messages:
 *   post:
 *     summary: Send a message to a user
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Message'
 *     responses:
 *       201:
 *         description: Message sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Message'
 *       400:
 *         description: Bad request
 */
router.post('/messages', Authenticate, asyncHandler(MessagesController.createMessage));

/**
 * @swagger
 * /messages/{id}:
 *   get:
 *     summary: Get messages between the current user and another user
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the other user
 *     responses:
 *       200:
 *         description: A list of messages
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Message'
 *       404:
 *         description: User not found
 */
router.get('/messages/:id', Authenticate, asyncHandler(MessagesController.getMessagesByUserId));

/**
 * @swagger
 * /messages/read/{id}:
 *   patch:
 *     summary: Mark all messages from a user as read
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the other user
 *     responses:
 *       200:
 *         description: Messages marked as read
 *       404:
 *         description: User not found
 */
router.patch('/messages/read/:id', Authenticate, asyncHandler(MessagesController.readAllMessages));

// Notification
/**
 * @swagger
 * /notifications:
 *   get:
 *     summary: Get all unread notifications for the current user
 *     tags: [Notification]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of unread notifications
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Notification'
 */
router.get('/notifications', Authenticate, asyncHandler(NotificationController.getNotSeenNotificationsByUserId));

/**
 * @swagger
 * /notifications:
 *   patch:
 *     summary: Mark a notification as seen
 *     tags: [Notification]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Notification marked as seen
 *       404:
 *         description: Notification not found
 */
router.patch('/notifications', Authenticate, asyncHandler(NotificationController.markNotificationAsSeen));

/**
 * @swagger
 * /call/{id}:
 *   post:
 *     summary: Send a new call notification to a user
 *     tags: [Notification]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the user to call
 *     responses:
 *       200:
 *         description: Call notification sent
 *       404:
 *         description: User not found
 */
router.post('/call/:id', Authenticate, asyncHandler(NotificationController.sendNewCallNotification));

/**
 * @swagger
 * /seen/{id}:
 *   post:
 *     summary: Send a seen notification to a user
 *     tags: [Notification]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the user whose profile was seen
 *     responses:
 *       200:
 *         description: Seen notification sent
 *       404:
 *         description: User not found
 */
router.post('/seen/:id', Authenticate, asyncHandler(NotificationController.sendSeenNotification));

/**
 * @swagger
 * /refuse-call/{id}:
 *   post:
 *     summary: Send a refuse call notification to a user
 *     tags: [Notification]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the user who is refusing the call
 *     responses:
 *       200:
 *         description: Refuse call notification sent
 *       404:
 *         description: User not found
 */
router.post('/refuse-call/:id', Authenticate, asyncHandler(NotificationController.sendRefuseCallNotification));

/**
 * @swagger
 * /stop-call/{id}:
 *   post:
 *     summary: Send a stop call notification to a user
 *     tags: [Notification]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the user who is stopping the call
 *     responses:
 *       200:
 *         description: Stop call notification sent
 *       404:
 *         description: User not found
 */
router.post('/stop-call/:id', Authenticate, asyncHandler(NotificationController.sendStopCallNotification));

// Email
/**
 * @swagger
 * /email/forgot-password:
 *   post:
 *     summary: Send a forgot password email
 *     tags: [Email]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Forgot password email sent
 *       404:
 *         description: User with that email not found
 */
router.post('/email/forgot-password', asyncHandler(EmailController.sendForgotPasswordEmail));

/**
 * @swagger
 * /email/validate:
 *   post:
 *     summary: Send a validation email to the current user
 *     tags: [Email]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Validation email sent
 */
router.post('/email/validate', Authenticate, asyncHandler(EmailController.sendValidationEmail));

/**
 * @swagger
 * /email/validate:
 *   patch:
 *     summary: Validate a user's email with a token
 *     tags: [Email]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *     responses:
 *       200:
 *         description: User validated successfully
 *       400:
 *         description: Invalid token
 */
router.patch('/email/validate', Authenticate, asyncHandler(UserController.validateUser));

// Location
/**
 * @swagger
 * /location/ip/{id}:
 *   post:
 *     summary: Set user location based on IP address
 *     tags: [Location]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The user ID
 *     responses:
 *       200:
 *         description: User location set successfully
 *       404:
 *         description: User not found
 */
router.post('/location/ip/:id', Authenticate, LocationController.setUserLocation);

/**
 * @swagger
 * /location/city:
 *   post:
 *     summary: Set user's city and country
 *     tags: [Location]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               city:
 *                 type: string
 *               country:
 *                 type: string
 *     responses:
 *       200:
 *         description: City and country set successfully
 */
router.post('/location/city', Authenticate, LocationController.setCityAndCountry);

/**
 * @swagger
 * /location/address:
 *   get:
 *     summary: Get the user's address based on their location
 *     tags: [Location]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: The user's address
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 address:
 *                   type: string
 *       404:
 *         description: Location not set
 */
router.get('/location/address', Authenticate, LocationController.getAddress)

//Dates
/**
 * @swagger
 * /dates:
 *   post:
 *     summary: Create a new date suggestion
 *     tags: [Dates]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Date'
 *     responses:
 *       201:
 *         description: Date created successfully
 *       400:
 *         description: Bad request
 */
router.post('/dates', Authenticate, asyncHandler(DatesController.createDate));

/**
 * @swagger
 * /dates:
 *   get:
 *     summary: Get all dates for the current user
 *     tags: [Dates]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of dates
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Date'
 */
router.get('/dates', Authenticate, asyncHandler(DatesController.getDatesByUserId));

/**
 * @swagger
 * /dates:
 *   patch:
 *     summary: Update a date
 *     tags: [Dates]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Date'
 *     responses:
 *       200:
 *         description: Date updated successfully
 *       404:
 *         description: Date not found
 */
router.patch('/dates', Authenticate, asyncHandler(DatesController.updateDate));

/**
 * @swagger
 * /date/{id}:
 *   get:
 *     summary: Get a date by ID
 *     tags: [Dates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The date ID
 *     responses:
 *       200:
 *         description: The date data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Date'
 *       404:
 *         description: Date not found
 */
router.get('/date/:id', Authenticate, asyncHandler(DatesController.getDateById));

module.exports = router;