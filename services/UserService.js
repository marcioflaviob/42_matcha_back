const ApiException = require('../exceptions/ApiException.js');
const User = require('../models/User/User.js');
const InterestsService = require('./InterestsService.js');
const LocationService = require('./LocationService.js');
const UserPictureService = require('./UserPictureService.js');
const UserDataAccess = require('../utils/UserDataAccess.js');
const bcrypt = require('bcrypt');

const validateUserId = (userId) => {
    if (!userId) throw new ApiException(400, 'User ID is required');
};

const validateEmail = (email) => {
    if (!email) throw new ApiException(400, 'Email is required');
};

const validateUserExists = (user) => {
    if (!user) throw new ApiException(404, 'User not found');
};

const validateUserCreated = (user) => {
    if (!user) throw new ApiException(500, 'User not created');
};

const getUserAndFormat = async (userId) => {
    validateUserId(userId);
    const user = await User.findById(userId);
    validateUserExists(user);
    return await UserDataAccess.formatUser(user);
};

const getUserByEmailAndFormat = async (email) => {
    validateEmail(email);
    const user = await User.findByEmail(email);
    validateUserExists(user);
    return await UserDataAccess.formatUser(user);
};

const getAllUsers = async () => {
    const users = await User.findAll();
    return await UserDataAccess.formatUsers(users);
};

const createUser = async (userData) => {
    const user = await User.create(userData);
    validateUserCreated(user);
    return user;
};

const getUserById = async (userId) => {
    return await getUserAndFormat(userId);
};

const getUserByEmailWithPassword = async (email) => {
    validateEmail(email);
    const user = await User.findByEmail(email);
    validateUserExists(user);
    return user;
};

const getUserByEmail = async (email) => {
    return await getUserByEmailAndFormat(email);
};

const getValidUsers = async (userId) => {
    validateUserId(userId);
    const users = await User.findAllValidUsers(userId);
    return await UserDataAccess.formatUsers(users);
};

const updateUser = async (req) => {
    if (!req || !req.body || !req.body.id) {
        throw new ApiException(400, 'User ID is required for update');
    }
    const result = {};
    const userData = { ...req.body };
    const userId = req.user.id;
    const interests = userData.interests;

    delete userData.interests;
    delete userData.id;
    delete userData.like_count;
    delete userData.age;
    delete userData.pictures;
    delete userData.location;

    try {
        if (userData.password) {
            const salt = await bcrypt.genSalt(10);
            userData.password = await bcrypt.hash(userData.password, salt);
        }
        if (userData.email && !userData.status) userData.status = 'validation';

        if (Object.keys(userData).length > 0) {
            result.userData = await User.updateUserData(userId, userData);
        } else {
            result.userData = await User.findById(userId);
        }
        result.userData.interests = await InterestsService.updateUserInterests(interests, userId);
        if (result.userData) delete result.userData.password;
        result.userData.pictures = await UserPictureService.getUserPictures(userId);
        result.userData.location = await LocationService.getLocationByUserId(userId);
        return result.userData;
    } catch (error) {
        console.log('User update error:', error);
        result.userError = error.message;
        throw new ApiException(500, 'Failed to update user');
    }
};

const deleteUser = async (userId) => {
    validateUserId(userId);
    return await User.delete(userId);
};

const resetPassword = async (userId, password) => {
    if (!userId || !password) {
        throw new ApiException(400, 'User ID and password are required');
    }

    const user = await User.resetPassword(userId, password);
    validateUserExists(user);

    return await UserDataAccess.formatUser(user);
};

const validateUser = async (userId) => {
    validateUserId(userId);
    const user = await User.validateUser(userId);
    validateUserExists(user);

    return await UserDataAccess.formatUser(user);
};

const addFameRating = async (userId, rating) => {
    if (!userId || !rating) throw new ApiException(400, 'User ID and rating are required');

    const user = await User.addFameRating(userId, rating);

    if (!user) throw new ApiException(404, 'User not found');

    const formattedUser = await UserDataAccess.formatUser(user);
    return formattedUser;
};

module.exports = {
    getAllUsers,
    createUser,
    getUserById,
    getUserByEmail,
    getValidUsers,
    updateUser,
    deleteUser,
    getUserByEmailWithPassword,
    resetPassword,
    validateUser,
    addFameRating,
};