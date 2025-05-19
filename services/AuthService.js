const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const UserService = require("./UserService.js");

const JWT_SECRET = process.env.JWT_SECRET;

const login = async (email, password) => {
	const user = await UserService.getUserByEmailWithPassword(email);

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

// const loginWithOAuth = async (userId) => {
// 	const user = await UserService.getUserById(userId);
  
// 	if (!user) {
// 	  throw new Error("User not found");
// 	}
  
// 	const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
// 	  expiresIn: "24h",
// 	});
  
// 	return {
// 	  token,
// 	  user,
// 	};
//   };

const verifyToken = async (token) => {
	try {
		return await jwt.verify(token, JWT_SECRET);
	} catch (err) {
		throw new Error("Invalid token");
	}
};

module.exports = {
	login,
	// loginWithOAuth,
	verifyToken
};

