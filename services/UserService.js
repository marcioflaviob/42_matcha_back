const ApiException = require('../exceptions/ApiException.js');
const User = require('../models/User/User.js');
const InterestsService = require('./InterestsService.js');
const LocationService = require('./LocationService.js');
const bcrypt = require('bcrypt');

const getAllUsers = async () => {
    const users = await User.findAll()
    const formattedUsers = await Promise.all(
        users.map(async (user) => {
            return await formatUser(user);
        })
    );
    return formattedUsers;
}

const createUser = async (userData) => {
    const user = await User.create(userData);

    if (!user) throw new ApiException(500, 'User not created');

    return user;
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
        return age >= 0 ? age : null; // Prevent negative ages
    } catch (e) {
        console.error("Age calculation error:", e);
        return null;
    }
};

const formatUser = async (data) => {
    const InterestsService = require('./InterestsService.js');
    const UserPictureService = require('./UserPictureService.js');
    const UserInteractionsService = require('./UserInteractionsService.js');
    const LocationService = require('./LocationService.js');

    interestsList = await InterestsService.getInterestsListByUserId(data.id);
    pictures = await UserPictureService.getUserPictures(data.id);
    data.interests = interestsList;
    data.pictures = pictures;
    data.like_count = await UserInteractionsService.getLikeCountByUserId(data.id);
    data.age = calculateAge(data.birthdate);
    location = await LocationService.getLocationByUserId(data.id).catch(() => null);
    data.location = location || null;
    const { password, ...userWithoutPassword } = data;
    return userWithoutPassword;
}

const getUserById = async (userId) => {
    if (!userId) throw new ApiException(400, 'User ID is required');

    const user = await User.findById(userId);

    if (!user) throw new ApiException(404, 'User not found');

    const formattedUser = await formatUser(user);
    return formattedUser;
};

const getUserByEmailWithPassword = async (email) => {
    if (!email) throw new ApiException(400, 'Email is required');

    const user = await User.findByEmail(email);

    if (!user) throw new ApiException(404, 'User not found');

    return user;
};

const getUserByEmail = async (email) => {
    if (!email) throw new ApiException(400, 'Email is required');

    const user = await User.findByEmail(email);

    if (!user) throw new ApiException(404, 'User not found');

    const formattedUser = await formatUser(user);
    return formattedUser;
};

const getValidUsers = async (userId) => {
    if (!userId) throw new ApiException(400, 'User ID is required');

    const users = await User.findAllValidUsers(userId);
    const formattedUsers = await Promise.all(
        users.map(async (user) => {
            return await formatUser(user);
        })
    );
    return formattedUsers;
}

const updateUser = async (req) => {
    if (!req || !req.body || !req.body.id) {
        throw new ApiException(400, 'User ID is required for update');
    }
    const result = {};
    const userData = { ...req.body };
    const userId = req.user.id;
    const interests = userData.interests;
    const location = userData.location;

    delete userData.interests;
    delete userData.id;

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
        result.userData.location = await LocationService.updateUserLocation(location, userId);
        if (result.userData) delete result.userData.password;

        return result;
    } catch (error) {
        console.log('User update error:', error);
        result.userError = error.message;
        throw new ApiException(500, 'Failed to update user');
    }
};

const deleteUser = async (userId) => {
    if (!userId) throw new ApiException(400, 'User ID is required');

    const user = await User.delete(userId);
    return user;
};

const resetPassword = async (userId, password) => {
    if (!userId || !password) {
        throw new ApiException(400, 'User ID and password are required');
    }

    const user = await User.resetPassword(userId, password);

    if (!user) throw new ApiException(404, 'User not found');

    const formattedUser = await formatUser(user);
    return formattedUser;
};

const validateUser = async (userId) => {
    if (!userId) throw new ApiException(400, 'User ID is required');

    const user = await User.validateUser(userId);

    if (!user) throw new ApiException(404, 'User not found');

    const formattedUser = await formatUser(user);
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
};