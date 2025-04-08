const User = require('../models/User/User');

const getAllUsers = async () => {
	const users = await User.findAll();
	return users;
}

const createUser = async (userData) => {
    const user = await User.create(userData);
    return user;
};

const getUserById = async (userId) => {
    const user = await User.findById(userId);
    return user;
};

const getUserByEmail = async (email) => {
    const user = await User.findByEmail(email);
    return user;
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
};