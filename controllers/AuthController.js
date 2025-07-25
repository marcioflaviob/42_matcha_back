const AuthService = require("../services/AuthService.js");
const UserService = require("../services/UserService.js");
const passport = require('passport');
const jwt = require('jsonwebtoken');

  exports.login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const { user, token } = await AuthService.login(email, password);

    res.status(200).json({
      message: "Login successful",
      token,
      user: user,
    });
  },

  exports.getCurrentUser = async (req, res) => {
    const userId = req.user.id;

    if (!userId) {
      return res.status(401).json({ message: "User not found" });
    }

    await UserService.updateLastConnection(userId);

    const user = await UserService.getUserById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({user: user});
  },

  exports.verify = async (req, res) => {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ message: "No token, authorization denied" });
    }

    const decoded = await AuthService.verifyToken(token);

    if (!decoded) {
      return res.status(401).json({ message: "Token is not valid" });
    }

    return res.status(200).json({ message: "Token is valid", user: decoded });
  }

exports.googleAuth = passport.authenticate('google', {
  scope: ['profile', 'email']
})

exports.googleCallback = (req, res, next) => {
  passport.authenticate('google', { session: false }, (err, user) => {
    if (err) {
      console.error("Google authentication error:", err);
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=auth_failed`);
    }

    if (!user) {
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=user_not_found`);
    }

    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, {
      expiresIn: "24h",
    });

    res.redirect(`${process.env.FRONTEND_URL}/auth/google/callback?token=${token}`);
  })(req, res, next);
}