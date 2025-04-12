const InterestsService = require('./InterestsService');
const UserPictureService = require('./UserPictureService');

const User = require('../models/User/User');

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

const formatUser = async (data) =>
{
    interestsList = await InterestsService.getInterestsListByUserId(data.id);
    pictures = await UserPictureService.getUserPictures(data.id);
    data.interets = interestsList;
    data.pictures = pictures;
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
    const formattedUser = await formatUser(user);
    return formattedUser;
};

const updateUser = async (req) => {
    const user = await User.update(req);
    return user;
};

const deleteUser = async (userId) => {
    const user = await User.delete(userId);
    return user;
};

module.exports = {
	getAllUsers,
    createUser,
    getUserById,
    getUserByEmail,
    updateUser,
    deleteUser,
    getUserByEmailWithPassword,
};