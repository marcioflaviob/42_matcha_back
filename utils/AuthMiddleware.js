const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

const auth = async (req, res, next) => {
	const token = req.header('Authorization')?.replace('Bearer ', '');

	if (!token) {
		return res.status(401).json({ message: 'No token, authorization denied' });
	}
  
	try {
		const decoded = await jwt.verify(token, JWT_SECRET);

		// Add user from payload
		req.user = decoded;
		next();

	} catch (error) {
		res.status(401).json({ message: 'Token is not valid' });
	}
};

module.exports = auth;