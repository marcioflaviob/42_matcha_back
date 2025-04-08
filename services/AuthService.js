const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User/User");
const UserService = require("./UserService");

const JWT_SECRET = process.env.JWT_SECRET;

const login = async (email, password) => {
	const user = await UserService.getUserByEmail(email);

	if (!user) {
		throw new Error("Invalid credentials");
	}

	const isPasswordValid = await bcrypt.compare(password, user.password);

	if (!isPasswordValid) {
		throw new Error("Invalid credentials");
	}

	const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
		expiresIn: "24h",
	});

	const { password: _, ...userWithoutPassword } = user;

	return {
		token,
		user: userWithoutPassword,
	};
};

const verifyToken = (token) => {
	try {
		return jwt.verify(token, JWT_SECRET);
	} catch (err) {
		throw new Error("Invalid token");
	}
};

module.exports = {
	login,
	verifyToken
};

