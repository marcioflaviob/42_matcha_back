jest.mock('passport', () => ({
    authenticate: jest.fn(() => 'mock-middleware'),
}));

jest.mock('jsonwebtoken', () => ({
    sign: jest.fn(() => 'test-token'),
}));

jest.mock('../../services/AuthService');
jest.mock('../../services/UserService');

const passport = require('passport');
const AuthService = require('../../services/AuthService');
const UserService = require('../../services/UserService');
const AuthController = require('../../controllers/AuthController');

describe('AuthController', () => {
    let req;
    let res;
    let next;

    beforeEach(() => {
        req = {
            body: {},
            header: jest.fn(),
            user: {},
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            redirect: jest.fn(),
        };
        next = jest.fn();
        jest.spyOn(console, 'log').mockImplementation(() => { });
        jest.spyOn(console, 'error').mockImplementation(() => { });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('login', () => {
        it('should return 400 if email or password is missing', async () => {
            await AuthController.login(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Email and password are required',
            });
        });

        it('should return 200 and token on successful login', async () => {
            const mockUser = { id: 1, email: 'test@example.com' };
            const mockToken = 'test-token';
            req.body = { email: 'test@example.com', password: 'password' };

            AuthService.login.mockResolvedValue({ user: mockUser, token: mockToken });

            await AuthController.login(req, res);

            expect(AuthService.login).toHaveBeenCalledWith('test@example.com', 'password');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Login successful',
                token: mockToken,
                user: mockUser,
            });
        });

        it('should return 401 on invalid credentials', async () => {
            req.body = { email: 'test@example.com', password: 'wrong-password' };
            AuthService.login.mockRejectedValue(new Error('Invalid credentials'));

            await AuthController.login(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Invalid credentials',
            });
        });
    });

    describe('getCurrentUser', () => {
        it('should return 401 if userId is not found', async () => {
            req.user = {};

            await AuthController.getCurrentUser(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                message: 'User not found',
            });
        });

        it('should return 404 if user is not found in database', async () => {
            req.user = { id: 1 };
            UserService.getUserById.mockResolvedValue(null);

            await AuthController.getCurrentUser(req, res);

            expect(UserService.getUserById).toHaveBeenCalledWith(1);
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                message: 'User not found',
            });
        });

        it('should return 200 and user data if user is found', async () => {
            const mockUser = { id: 1, email: 'test@example.com' };
            req.user = { id: 1 };
            UserService.getUserById.mockResolvedValue(mockUser);

            await AuthController.getCurrentUser(req, res);

            expect(UserService.getUserById).toHaveBeenCalledWith(1);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                user: mockUser,
            });
        });

        it('should return 500 on server error', async () => {
            req.user = { id: 1 };
            UserService.getUserById.mockRejectedValue(new Error('Database error'));

            await AuthController.getCurrentUser(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Server error',
            });
        });
    });

    describe('verify', () => {
        it('should return 401 if no token is provided', async () => {
            req.header.mockReturnValue(null);

            await AuthController.verify(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                message: 'No token, authorization denied',
            });
        });

        it('should return 200 and decoded user if token is valid', async () => {
            const mockDecoded = { id: 1, email: 'test@example.com' };
            req.header.mockReturnValue('Bearer test-token');
            AuthService.verifyToken.mockResolvedValue(mockDecoded);

            await AuthController.verify(req, res);

            expect(AuthService.verifyToken).toHaveBeenCalledWith('test-token');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Token is valid',
                user: mockDecoded,
            });
        });

        it('should return 401 if token is invalid', async () => {
            req.header.mockReturnValue('Bearer invalid-token');
            AuthService.verifyToken.mockResolvedValue(null);

            await AuthController.verify(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Token is not valid',
            });
        });

        it('should return 500 on server error', async () => {
            req.header.mockReturnValue('Bearer test-token');
            AuthService.verifyToken.mockRejectedValue(new Error('Server error'));

            await AuthController.verify(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Server error',
            });
        });
    });

    describe('Google Authentication', () => {
        const setupEnvironment = () => {
            process.env.FRONTEND_URL = 'https://localhost:3000';
            process.env.JWT_SECRET = 'test-secret';
        };

        const createAuthMiddleware = (error, user) => (req, res, next) => {
            const callback = passport.authenticate.mock.calls[passport.authenticate.mock.calls.length - 1][2];
            callback(error, user);
        };

        const mockPassportAuth = (error, user) => {
            passport.authenticate.mockImplementation(() => createAuthMiddleware(error, user));
        };

        it('should handle Google authentication setup correctly', () => {
            expect(passport.authenticate).toHaveBeenCalledWith('google', {
                scope: ['profile', 'email'],
            });
            expect(AuthController.googleAuth).toBeDefined();
            expect(AuthController.googleAuth).toBe('mock-middleware');
        });

        it('should handle successful Google callback', () => {
            const mockUser = { id: 1, email: 'test@example.com' };
            setupEnvironment();
            mockPassportAuth(null, mockUser);

            AuthController.googleCallback(req, res, next);

            expect(res.redirect).toHaveBeenCalledWith(
                `${process.env.FRONTEND_URL}/auth/google/callback?token=test-token`
            );
        });

        it('should handle Google callback failure', () => {
            setupEnvironment();
            mockPassportAuth(new Error('Authentication failed'), null);

            AuthController.googleCallback(req, res, next);

            expect(res.redirect).toHaveBeenCalledWith(
                `${process.env.FRONTEND_URL}/login?error=auth_failed`
            );
        });

        it('should handle Google callback with no user', () => {
            setupEnvironment();
            mockPassportAuth(null, null);

            AuthController.googleCallback(req, res, next);

            expect(res.redirect).toHaveBeenCalledWith(
                `${process.env.FRONTEND_URL}/login?error=user_not_found`
            );
        });
    });
});
