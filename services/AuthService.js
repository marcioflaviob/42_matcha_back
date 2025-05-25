const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const UserService = require("./UserService.js");
const ApiException = require("../exceptions/ApiException.js");

const JWT_SECRET = process.env.JWT_SECRET;

const login = async (email, password) => {
	const user = await UserService.getUserByEmailWithPassword(email);

	const isPasswordValid = await bcrypt.compare(password, user.password);

	if (!isPasswordValid) throw new ApiException(401, "Invalid credentials");

	const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
		expiresIn: "24h",
	});

	const { password: _, ...userWithoutPassword } = user;

	return {
		token,
		user: userWithoutPassword,
	};
};

const verifyToken = async (token) => {
	try {
		return await jwt.verify(token, JWT_SECRET);
	} catch (err) {
		throw new ApiException(401, "Invalid or expired token");
	}
};

module.exports = {
	login,
	verifyToken
};

