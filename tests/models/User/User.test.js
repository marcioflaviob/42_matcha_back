const User = require('../../../models/User/User.js');
const db = require('../../../config/db.js');
const bcrypt = require('bcrypt');
const ApiException = require('../../../exceptions/ApiException.js');
const { mockConsole, restoreConsole } = require('../../utils/testSetup');

jest.mock('../../../config/db.js');
jest.mock('bcrypt');

beforeEach(() => {
    mockConsole();
});

afterEach(() => {
    restoreConsole();
});

describe('User Model', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('findAll', () => {
        it('should return all users', async () => {
            const mockUsers = [
                { id: 1, email: 'user1@test.com' },
                { id: 2, email: 'user2@test.com' }
            ];
            db.query.mockResolvedValue({ rows: mockUsers });

            const result = await User.findAll();

            expect(db.query).toHaveBeenCalledWith('SELECT * FROM users');
            expect(result).toEqual(mockUsers);
        });

        it('should throw ApiException on database error', async () => {
            db.query.mockRejectedValue(new Error('Database error'));

            await expect(User.findAll()).rejects.toThrow(ApiException);
            await expect(User.findAll()).rejects.toThrow('Failed to fetch users');
        });
    });

    describe('findById', () => {
        it('should return user when found', async () => {
            const mockUser = { id: 1, email: 'user@test.com' };
            db.query.mockResolvedValue({ rows: [mockUser] });

            const result = await User.findById(1);

            expect(db.query).toHaveBeenCalledWith('SELECT * FROM users WHERE id = $1', [1]);
            expect(result).toEqual(mockUser);
        });

        it('should throw ApiException when user not found', async () => {
            db.query.mockResolvedValue({ rows: [] });

            await expect(User.findById(999)).rejects.toThrow(ApiException);
            await expect(User.findById(999)).rejects.toThrow('User not found');
        });
    });

    describe('findByEmail', () => {
        it('should return user when found', async () => {
            const mockUser = { id: 1, email: 'user@test.com' };
            db.query.mockResolvedValue({ rows: [mockUser] });

            const result = await User.findByEmail('user@test.com');

            expect(db.query).toHaveBeenCalledWith('SELECT * FROM users WHERE email = $1', ['user@test.com']);
            expect(result).toEqual(mockUser);
        });

        describe('findByEmail error handling', () => {
            it('should handle database errors properly', async () => {
                db.query.mockRejectedValue(new Error('Database connection failed'));

                await expect(User.findByEmail('test@example.com'))
                    .rejects
                    .toThrow('Failed to fetch user by email');
            });

            it('should throw ApiException when user not found', async () => {
                db.query.mockResolvedValue({ rows: [] });

                await expect(User.findByEmail('nonexistent@example.com'))
                    .rejects
                    .toThrow('User not found');
            });
        });
    });

    describe('findAllValidUsers', () => {
        it('should return all valid users except the given user', async () => {
            const mockUsers = [
                { id: 2, email: 'user2@test.com', status: 'complete' },
                { id: 3, email: 'user3@test.com', status: 'complete' }
            ];
            db.query.mockResolvedValue({ rows: mockUsers });

            const result = await User.findAllValidUsers(1);

            expect(db.query).toHaveBeenCalledWith(
                `SELECT * FROM users WHERE id != $1 AND status = 'complete'`,
                [1]
            );
            expect(result).toEqual(mockUsers);
        });

        it('should throw ApiException on database error', async () => {
            db.query.mockRejectedValue(new Error('Database error'));

            await expect(User.findAllValidUsers(1)).rejects.toThrow(ApiException);
            await expect(User.findAllValidUsers(1)).rejects.toThrow('Failed to fetch potential matches');
        });
    });

    describe('create', () => {
        it('should create user with hashed password', async () => {
            const userData = {
                email: 'new@test.com',
                password: 'password123'
            };
            const hashedPassword = 'hashedPassword123';
            const mockUser = { ...userData, id: 1, password: hashedPassword };

            bcrypt.genSalt.mockResolvedValue('salt');
            bcrypt.hash.mockResolvedValue(hashedPassword);
            db.query.mockResolvedValue({ rows: [mockUser] });

            const result = await User.create(userData);

            expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
            expect(bcrypt.hash).toHaveBeenCalledWith('password123', 'salt');
            expect(db.query).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO users'),
                expect.arrayContaining([userData.email, hashedPassword])
            );
            expect(result).toEqual(mockUser);
        });

        it('should throw ApiException when creation fails', async () => {
            const userData = { email: 'new@test.com' };
            db.query.mockResolvedValue({ rows: [] });

            await expect(User.create(userData)).rejects.toThrow(ApiException);
            await expect(User.create(userData)).rejects.toThrow('Failed to create user');
        });
    });

    describe('updateUserData', () => {
        it('should update user data successfully', async () => {
            const userId = 1;
            const updateData = { first_name: 'Updated', email: 'updated@test.com' };
            const mockUpdatedUser = { id: userId, ...updateData };

            db.query.mockResolvedValue({ rows: [mockUpdatedUser] });

            const result = await User.updateUserData(userId, updateData);

            expect(db.query).toHaveBeenCalledWith(
                expect.stringContaining('UPDATE users'),
                expect.arrayContaining([userId, 'Updated', 'updated@test.com'])
            );
            expect(result).toEqual(mockUpdatedUser);
        });

        it('should return existing user when no update data provided', async () => {
            const userId = 1;
            const mockUser = { id: userId, first_name: 'Existing User' };

            db.query.mockResolvedValue({ rows: [mockUser] });

            const result = await User.updateUserData(userId, {});

            expect(db.query).toHaveBeenCalledWith('SELECT * FROM users WHERE id = $1', [userId]);
            expect(result).toEqual(mockUser);
        });

        it('should throw ApiException when user not found', async () => {
            const userId = 999;
            const updateData = { first_name: 'Updated Name' };

            db.query.mockResolvedValue({ rows: [] });

            await expect(User.updateUserData(userId, updateData)).rejects.toThrow(ApiException);
            await expect(User.updateUserData(userId, updateData)).rejects.toThrow('User not found');
        });
    });

    describe('delete', () => {
        it('should delete user successfully', async () => {
            const userId = 1;
            db.query.mockResolvedValue({ rowCount: 1 });

            const result = await User.delete(userId);

            expect(db.query).toHaveBeenCalledWith('DELETE FROM users WHERE id = $1', [userId]);
            expect(result).toEqual({ success: true });
        });

        it('should throw ApiException on delete error', async () => {
            const userId = 1;
            db.query.mockRejectedValue(new Error('Delete failed'));

            await expect(User.delete(userId)).rejects.toThrow(ApiException);
            await expect(User.delete(userId)).rejects.toThrow('Failed to delete user');
        });
    });

    describe('resetPassword', () => {
        it('should reset password successfully', async () => {
            const userId = 1;
            const newPassword = 'newPassword123';
            const hashedPassword = 'hashedNewPassword123';
            const mockUser = { id: userId, password: hashedPassword };

            bcrypt.genSalt.mockResolvedValue('salt');
            bcrypt.hash.mockResolvedValue(hashedPassword);
            db.query.mockResolvedValue({ rows: [mockUser] });

            const result = await User.resetPassword(userId, newPassword);

            expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
            expect(bcrypt.hash).toHaveBeenCalledWith(newPassword, 'salt');
            expect(db.query).toHaveBeenCalledWith(
                'UPDATE users SET password = $1 WHERE id = $2 RETURNING *',
                [hashedPassword, userId]
            );
            expect(result).toEqual(mockUser);
        });

        it('should throw ApiException when user not found', async () => {
            const userId = 999;
            const newPassword = 'newPassword123';

            bcrypt.genSalt.mockResolvedValue('salt');
            bcrypt.hash.mockResolvedValue('hashedPassword');
            db.query.mockResolvedValue({ rows: [] });

            await expect(User.resetPassword(userId, newPassword)).rejects.toThrow(ApiException);
            await expect(User.resetPassword(userId, newPassword)).rejects.toThrow('User not found');
        });
    });

    describe('validateUser', () => {
        it('should validate user successfully', async () => {
            const userId = 1;
            const mockUser = { id: userId, status: 'complete' };

            db.query.mockResolvedValue({ rows: [mockUser] });

            const result = await User.validateUser(userId);

            expect(db.query).toHaveBeenCalledWith(
                'UPDATE users SET status = $1 WHERE id = $2 RETURNING *',
                ['complete', userId]
            );
            expect(result).toEqual(mockUser);
        });

        it('should throw ApiException when user not found', async () => {
            const userId = 999;
            db.query.mockResolvedValue({ rows: [] });

            await expect(User.validateUser(userId)).rejects.toThrow(ApiException);
            await expect(User.validateUser(userId)).rejects.toThrow('User not found');
        });
    });
});