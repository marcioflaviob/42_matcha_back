const User = require('../models/User/User.js');

const getAllUsers = async () => {
	const users = await User.findAll();
    const formattedUsers = await Promise.all(
        users.map(async (user) => {
          return await formatUser(user);
        })
    );
    return formattedUsers;
}

const createUser = async (userData) => {
    const user = await User.create(userData);
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

const formatUser = async (data) =>
{
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
    const user = await User.findById(userId);
    const formattedUser = await formatUser(user);
    return formattedUser;
};

const getUserByEmailWithPassword = async (email) => {
    const user = await User.findByEmail(email);
    return user;
};

const getUserByEmail = async (email) => {
    const user = await User.findByEmail(email);

    if (!user) {
        return null;
    }

    const formattedUser = await formatUser(user);
    return formattedUser;
};

const getValidUsers = async (userId) => {
    const users = await User.findAllValidUsers(userId);
    const formattedUsers = await Promise.all(
        users.map(async (user) => {
          return await formatUser(user);
        })
    );
    return formattedUsers;
}

const updateUser = async (req) => {
    const user = await User.update(req);
    return user;
};

const deleteUser = async (userId) => {
    const user = await User.delete(userId);
    return user;
};

const resetPassword = async (userId, password) => {
    const user = await User.resetPassword(userId, password);
    if (!user) {
        throw new Error('Failed to reset password');
    }
    const formattedUser = await formatUser(user);
    return formattedUser;
};

const validateUser = async (userId) => {
    const user = await User.validateUser(userId);
    if (!user) {
        throw new Error('Failed to validate user');
    }
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