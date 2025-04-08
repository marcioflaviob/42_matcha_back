const AuthService = require("../services/AuthService");
const UserService = require("../services/UserService");

const AuthController = {
  login: async (req, res) => {
    try {
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
    } catch (error) {
      console.error("Login error:", error);
      res.status(401).json({ message: "Invalid credentials" });
    }
  },

  getCurrentUser: async (req, res) => {
    try {
      const userId = req.user.id;

      if (!userId) {
        return res.status(401).json({ message: "User not found" });
      }

      const user = await UserService.getUserById(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.status(200).json({user: user});
    } catch (error) {
      console.error("Get current user error:", error);
      res.status(500).json({ message: "Server error" });
    }
  },

  verify: async (req, res) => {
    try {
      const token = req.header("Authorization")?.replace("Bearer ", "");

      if (!token) {
        return res.status(401).json({ message: "No token, authorization denied" });
      }

      const decoded = AuthService.verifyToken(token);

      if (!decoded) {
        return res.status(401).json({ message: "Token is not valid" });
      }

      return res.status(200).json({ message: "Token is valid", user: decoded });
    } catch (error) {
      console.error("Token verification error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
};

module.exports = AuthController;
