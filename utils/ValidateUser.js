const { getUserById } = require("../services/UserService");

module.exports = function validateUser(req, res, next) {
    const user = req.body;
    const userId = req.body.id ? req.body.id : req.user ? req.user.id : null;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!userId && user.status !== 'step_one') {
        return res.status(400).send('Missing required fields: id');
    }

    if (!user.status && !getUserById(user.id)) {
        return res.status(400).send('User not found');
    }

    if (user.first_name && (typeof user.first_name !== 'string' || user.first_name.trim().length < 3)) {
        return res.status(400).send('Invalid first name');
    }

    if (user.last_name && (typeof user.last_name !== 'string' || user.last_name.trim().length < 3)) {
        return res.status(400).send('Invalid last name');
    }

    if (user.email && !emailRegex.test(user.email)) {
        return res.status(400).send('Invalid email format');
    }

    if (user.birthdate && new Date(user.birthdate) > new Date()) {
        return res.status(400).send('Invalid birthdate');
    }

    if (user.status && user.status == 'complete') {
        return res.status(401).send('Email validation required');
    }

    next();
};