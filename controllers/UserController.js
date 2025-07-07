const UserService = require('../services/UserService.js');

exports.getAllUsers = async (req, res) => {
    const users = await UserService.getAllUsers();
    res.send(users);
}

exports.createUser = async (req, res) => {
    const user = await UserService.createUser(req.body);
    return res.status(201).send(user);
};

exports.getUserById = async (req, res) => {
    const user = await UserService.getUserById(req.params.id);
    res.status(200).send(user);
};

exports.getUserProfileById = async (req, res) => {
    const user = await UserService.getUserProfile(req.user.id, req.params.id);
    res.status(200).send(user);
};

exports.updateUser = async (req, res) => {
    const user = await UserService.updateUser(req);
    res.send(user);
};

exports.resetPassword = async (req, res) => {
    const userId = req.user.id;

    if (!req.body.password || !userId) {
        return res.status(400).send({ error: 'Missing fields' });
    }

    const user = await UserService.resetPassword(userId, req.body.password);
    res.status(200).send(user);
};

exports.validateUser = async (req, res) => {
    const userId = req.user.id;

    const user = await UserService.validateUser(userId);
    res.status(200).send(user);
}