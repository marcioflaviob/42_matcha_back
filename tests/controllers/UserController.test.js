const UserService = require('../../services/UserService');
const UserController = require('../../controllers/UserController');
const { createMockReqRes } = require('../utils/testSetup');

jest.mock('../../services/UserService');

describe('UserController', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getAllUsers', () => {
        it('should get all users and send 200 with users data', async () => {
            const mockUsers = [
                { id: 1, email: 'user1@test.com', name: 'User One' },
                { id: 2, email: 'user2@test.com', name: 'User Two' }
            ];
            const { mockReq, mockRes } = createMockReqRes();

            UserService.getAllUsers.mockResolvedValue(mockUsers);

            await UserController.getAllUsers(mockReq, mockRes);

            expect(UserService.getAllUsers).toHaveBeenCalledTimes(1);
            expect(mockRes.send).toHaveBeenCalledWith(mockUsers);
        });
    });

    describe('createUser', () => {
        it('should create user and send 201 with user data', async () => {
            const userData = {
                email: 'newuser@test.com',
                name: 'New User',
                password: 'password123'
            };
            const createdUser = {
                id: 3,
                email: 'newuser@test.com',
                name: 'New User'
            };
            const req = {
                body: userData
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                send: jest.fn()
            };

            UserService.createUser.mockResolvedValue(createdUser);

            await UserController.createUser(req, res);

            expect(UserService.createUser).toHaveBeenCalledWith(userData);
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.send).toHaveBeenCalledWith(createdUser);
        });
    });

    describe('getUserById', () => {
        it('should get user by ID and send 200 with user data', async () => {
            const userId = 1;
            const mockUser = {
                id: 1,
                email: 'user@test.com',
                name: 'Test User'
            };
            const req = {
                params: {
                    id: userId
                },
                user: {
                    id: 1
                }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                send: jest.fn()
            };

            UserService.fetchUserById.mockResolvedValue(mockUser);

            await UserController.getUserById(req, res);

            expect(UserService.fetchUserById).toHaveBeenCalledWith(1, userId);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.send).toHaveBeenCalledWith(mockUser);
        });
    });

    describe('updateUser', () => {
        it('should update user and send 200 with updated user data', async () => {
            const updateData = {
                id: 1,
                name: 'Updated Name',
                email: 'updated@test.com'
            };
            const updatedUser = {
                userData: {
                    id: 1,
                    name: 'Updated Name',
                    email: 'updated@test.com'
                }
            };
            const req = {
                body: updateData,
                user: {
                    id: 1
                }
            };
            const res = {
                send: jest.fn()
            };

            UserService.updateUser.mockResolvedValue(updatedUser);

            await UserController.updateUser(req, res);

            expect(UserService.updateUser).toHaveBeenCalledWith(req);
            expect(res.send).toHaveBeenCalledWith(updatedUser);
        });
    });

    describe('resetPassword', () => {
        it('should reset password and send 200 with user data', async () => {
            const passwordData = {
                password: 'newPassword123'
            };
            const updatedUser = {
                id: 1,
                email: 'user@test.com',
                name: 'Test User'
            };
            const req = {
                user: {
                    id: 1
                },
                body: passwordData
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                send: jest.fn()
            };

            UserService.resetPassword.mockResolvedValue(updatedUser);

            await UserController.resetPassword(req, res);

            expect(UserService.resetPassword).toHaveBeenCalledWith(1, 'newPassword123');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.send).toHaveBeenCalledWith(updatedUser);
        });

        it('should send 400 when password is missing', async () => {
            const req = {
                user: {
                    id: 1
                },
                body: {}
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                send: jest.fn()
            };

            await UserController.resetPassword(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.send).toHaveBeenCalledWith({ error: 'Missing fields' });
            expect(UserService.resetPassword).not.toHaveBeenCalled();
        });

        it('should send 400 when user ID is missing', async () => {
            const req = {
                user: {},
                body: {
                    password: 'newPassword123'
                }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                send: jest.fn()
            };

            await UserController.resetPassword(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.send).toHaveBeenCalledWith({ error: 'Missing fields' });
            expect(UserService.resetPassword).not.toHaveBeenCalled();
        });
    });

    describe('validateUser', () => {
        it('should validate user and send 200 with validated user data', async () => {
            const validatedUser = {
                id: 1,
                email: 'user@test.com',
                name: 'Test User',
                status: 'complete'
            };
            const req = {
                user: {
                    id: 1
                }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                send: jest.fn()
            };

            UserService.validateUser.mockResolvedValue(validatedUser);

            await UserController.validateUser(req, res);

            expect(UserService.validateUser).toHaveBeenCalledWith(1);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.send).toHaveBeenCalledWith(validatedUser);
        });
    });
});