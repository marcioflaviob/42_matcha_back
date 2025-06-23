const ApiException = require('../exceptions/ApiException.js');
const User = require('../models/User/User.js');
const InterestsService = require('../services/InterestsService.js');
const LocationService = require('../services/LocationService.js');
const UserPictureService = require('../services/UserPictureService.js');
const UserInteractions = require('../models/UserInteractions/UserInteractions.js');

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

const getUserForMatching = async (userId) => {
    const user = await User.findById(userId);
    if (!user) throw new ApiException(404, 'User not found');

    return await formatUser(user);
};

const getValidUsersForMatching = async (userId) => {
    const users = await User.findAllValidUsers(userId);
    return await formatUsers(users);
};

const getBasicUserById = async (userId) => {
    const user = await User.findById(userId);
    if (!user) throw new ApiException(404, 'User not found');

    // Return basic info without expensive operations
    const { password, ...userWithoutPassword } = user;
    userWithoutPassword.age = calculateAge(user.birthdate);
    return userWithoutPassword;
};

const getBasicUsersByIds = async (userIds) => {
    return await Promise.all(userIds.map(id => getBasicUserById(id)));
};

const addFameRating = async (userId, rating) => {
    if (!userId || !rating) throw new ApiException(400, 'User ID and rating are required');

    const user = await User.addFameRating(userId, rating);
    if (!user) throw new ApiException(404, 'User not found');

    return user;
};

module.exports = {
    formatUser,
    formatUsers,
    getUserForMatching,
    getValidUsersForMatching,
    getBasicUserById,
    getBasicUsersByIds,
    addFameRating,
    calculateAge
};