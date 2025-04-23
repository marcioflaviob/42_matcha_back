const UserService = require('../services/UserService');

exports.getAllUsers = async (req, res) => {
	try {
		const users = await UserService.getAllUsers();
		res.send(users);
	} catch (err) {
		res.status(404).send({ error: err.message });
	}
}

exports.createUser = async (req, res) => {
    try {
        const user = await UserService.createUser(req.body);
		if (!user) {
			return res.status(400).send('User not created');
		}
        return res.status(201).send(user);
    } catch (err) {
        return res.status(400).send({ error: err.message });
    }
};

exports.getUserById = async (req, res) => {
    try {
        const user = await UserService.getUserById(req.params.id);
        res.send(user);
    } catch (err) {
        res.status(404).send({ error: err.message });
    }
};

exports.getUserByEmail = async (req, res) => {
    try {
        const user = await UserService.getUserByEmail(req.params.email);
        res.send(user);
    } catch (err) {
        res.status(404).send({ error: err.message });
    }
}

exports.updateUser = async (req, res) => {
    try {
        const user = await UserService.updateUser(req);
        res.send(user);
    } catch (err) {
        res.status(400).send({ error: err.message });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const userId = req.user.id;

        if (!req.body.password || !userId) {
            return res.status(400).send({ error: 'Missing fields' });
        }

        const user = await UserService.resetPassword(userId, req.body.password);
        res.status(200).send(user);
    } catch (err) {
        res.status(400).send({ error: err.message });
    }
};

exports.validateUser = async (req, res) => {
    try {
        const userId = req.user.id;

        if (!userId) {
            return res.status(400).send({ error: 'Missing fields' });
        }

        const user = await UserService.validateUser(userId);
        res.status(200).send(user);
    } catch (err) {
        res.status(400).send({ error: err.message });
    }
}

exports.deleteUser = async (req, res) => {
    try {
        await UserService.deleteUser(req.params.id);
        res.send({ message: 'User deleted successfully' });
    } catch (err) {
        res.status(404).send({ error: err.message });
    }
};