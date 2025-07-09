const ApiException = require('../exceptions/ApiException.js');
const User = require('../models/User/User.js');
const InterestsService = require('./InterestsService.js');
const LocationService = require('./LocationService.js');
const UserPictureService = require('./UserPictureService.js');
const dumbPasswords = require('dumb-passwords');
const bcrypt = require('bcrypt');

const getUserAndFormat = async (userId) => {
    validateUserId(userId);
    const user = await User.findById(userId);
    validateUserExists(user);
    return await formatUser(user);
};

const getUserByEmailAndFormat = async (email) => {
    validateEmail(email);
    const user = await User.findByEmail(email);
    if (!user) return null;
    return await formatUser(user);
};

const getAllUsers = async () => {
    const users = await User.findAll();
    return await formatUsers(users);
};

const createUser = async (userData) => {

    if (!userData || !userData.email || !userData.password)
        throw new ApiException(400, 'Email and password are required');

    if (await User.checkUserExists(userData.email))
        throw new ApiException(400, 'Email already exists');

    try {
        if (dumbPasswords.check(userData.password))
            throw new ApiException(400, 'Password is too weak');

        const salt = await bcrypt.genSalt(10);
        userData.password = await bcrypt.hash(userData.password, salt);
    } catch (error) {
        if (error instanceof ApiException) throw error;
        throw new ApiException(500, 'Failed to create an account, please try again later');
    }

    const user = await User.create(userData);
    validateUserCreated(user);
    return user;
};

const getUserProfile = async (userId, requestedUserId) => {
    const { getMatchesIdsByUserId } = require('./UserInteractionsService.js');

    validateUserId(userId);
    validateUserId(requestedUserId);

    const matchesIds = await getMatchesIdsByUserId(userId);
    if ((userId == requestedUserId) || (matchesIds && matchesIds.some(id => id == requestedUserId)))
        return await getUserById(requestedUserId);

    throw new ApiException(401, 'You are not allowed to view this user\'s profile');
}

const fetchUserById = async (userId, requestedUserId) => {
    const { getBlockedUsersIdsByUserId, getMatchesIdsByUserId } = require('./UserInteractionsService.js');

    const blocks = await getBlockedUsersIdsByUserId(userId);
    const matches = await getMatchesIdsByUserId(userId);

    for (const blockedUserId of blocks) {
        if (blockedUserId == requestedUserId) {
            throw new ApiException(403, 'You cannot view this user\'s profile');
        }
    }

    for (const matchId of matches) {
        if (matchId == requestedUserId) {
            throw new ApiException(403, 'You already matched with this user');
        }
    }

    return await getUserById(requestedUserId);
}

const getUserById = async (userId) => {
    return await getUserAndFormat(userId);
};

const updateLastConnection = async (userId) => {
    validateUserId(userId);
    return await User.updateLastConnection(userId);
}

const getUserByEmailWithPassword = async (email) => {
    validateEmail(email);
    const user = await User.findByEmail(email);
    validateUserExists(user);
    return user;
};

const getUserByEmail = async (email) => {
    return await getUserByEmailAndFormat(email);
};

const getPotentialMatches = async (filters) => {
    const potentialMatches = await User.getPotentialMatches(filters);
    const formatted = await formatUsers(potentialMatches);
    return formatted;
}

const updateUser = async (req) => {
    if ((req && req.body && !req.body.id) && (!req.user || !req.user.id)) {
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
        if (interests) result.userData.interests = await InterestsService.updateUserInterests(interests, userId);
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

    let hashedPassword;

    try {
        if (dumbPasswords.check(password))
            throw new ApiException(400, 'Password is too weak');

        const salt = await bcrypt.genSalt(10);
        hashedPassword = await bcrypt.hash(password, salt);
    } catch (error) {
        if (error instanceof ApiException) throw error;
        throw new ApiException(500, 'Failed to reset password, please try again later');
    }

    const user = await User.resetPassword(userId, hashedPassword);
    validateUserExists(user);

    return await formatUser(user);
};

const validateUser = async (userId) => {
    validateUserId(userId);
    const user = await User.validateUser(userId);
    validateUserExists(user);

    return await formatUser(user);
};

const addFameRating = async (userId, rating) => {
    if (!userId || !rating) throw new ApiException(400, 'User ID and rating are required');

    const thisUser = await getUserById(userId);
    if (thisUser.rating + rating < 0)
        rating = -thisUser.rating;
    else if (thisUser.rating + rating > 100)
        rating = 100;
    const user = await User.addFameRating(userId, rating);
    if (!user) throw new ApiException(404, 'User not found');

    const formattedUser = await formatUser(user);
    return formattedUser;
};

const calculateAge = (birthdate) => {
    try {
        if (!birthdate) return null;

        const birthDate = new Date(birthdate);
        if (isNaN(birthDate.getTime())) return null;

        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();

        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age >= 0 ? age : null;
    } catch (e) {
        console.error("Age calculation error:", e);
        return null;
    }
};

const formatUser = async (data) => {
    const InterestsService = require('./InterestsService.js');
    const UserPictureService = require('./UserPictureService.js');
    const UserInteractions = require('../models/UserInteractions/UserInteractions.js');
    const LocationService = require('./LocationService.js');
    const interestsList = await InterestsService.getInterestsListByUserId(data.id);
    const pictures = await UserPictureService.getUserPictures(data.id);
    const likeCount = await UserInteractions.getLikeCountByUserId(data.id);
    const location = await LocationService.getLocationByUserId(data.id).catch(() => null);

    pictures.sort((a, b) => (a.is_profile ? -1 : 1));

    data.interests = interestsList;
    data.pictures = pictures;
    data.like_count = likeCount;
    data.age = calculateAge(data.birthdate);
    data.location = location || null;

    const { password, ...userWithoutPassword } = data;
    return userWithoutPassword;
};

const formatUsers = async (users) => {
    return await Promise.all(users.map(user => formatUser(user)));
};

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

module.exports = {
    getAllUsers,
    createUser,
    getUserById,
    fetchUserById,
    getUserProfile,
    getUserByEmail,
    updateUser,
    deleteUser,
    getUserByEmailWithPassword,
    resetPassword,
    validateUser,
    addFameRating,
    getUserAndFormat,
    getPotentialMatches,
    updateLastConnection
};