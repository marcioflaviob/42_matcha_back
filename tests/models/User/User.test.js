const User = require('../../../models/User/User.js');
const db = require('../../../config/db.js');
const ApiException = require('../../../exceptions/ApiException.js');
const { mockConsole, restoreConsole } = require('../../utils/testSetup');


jest.mock('../../../config/db.js');

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

        it('should throw ApiException on database error', async () => {
            db.query.mockRejectedValue(new Error('DB error'));
            await expect(User.findById(1)).rejects.toThrow(ApiException);
            await expect(User.findById(1)).rejects.toThrow('Failed to fetch user by ID');
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

        it('should handle database errors properly', async () => {
            db.query.mockRejectedValue(new Error('Database connection failed'));

            await expect(User.findByEmail('test@example.com'))
                .rejects
                .toThrow('Failed to fetch user by email');
        });

        it('should return undefined when user not found', async () => {
            db.query.mockResolvedValue({ rows: [] });

            const result = await User.findByEmail('nonexistent@example.com');
            expect(result).toBeUndefined();
        });
    });

    describe('checkUserExists', () => {
        it('should return true when user exists', async () => {
            const mockUser = { id: 1, email: 'existing@test.com' };
            db.query.mockResolvedValue({ rows: [mockUser] });

            const result = await User.checkUserExists('existing@test.com');

            expect(db.query).toHaveBeenCalledWith('SELECT * FROM users WHERE email = $1', ['existing@test.com']);
            expect(result).toBe(true);
        });

        it('should return false when user does not exist', async () => {
            db.query.mockResolvedValue({ rows: [] });

            const result = await User.checkUserExists('nonexistent@test.com');

            expect(db.query).toHaveBeenCalledWith('SELECT * FROM users WHERE email = $1', ['nonexistent@test.com']);
            expect(result).toBe(false);
        });

        it('should throw ApiException on database error', async () => {
            db.query.mockRejectedValue(new Error('Database error'));

            await expect(User.checkUserExists('test@example.com')).rejects.toThrow(ApiException);
            await expect(User.checkUserExists('test@example.com')).rejects.toThrow('Failed to check if user exists');
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
        it('should create user successfully', async () => {
            const userData = {
                email: 'new@test.com',
                password: 'hashedPassword123',
                first_name: 'John',
                last_name: 'Doe'
            };
            const mockUser = { ...userData, id: 1 };

            db.query.mockResolvedValue({ rows: [mockUser] });

            const result = await User.create(userData);

            expect(db.query).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO users'),
                expect.arrayContaining([userData.email, userData.password, userData.first_name, userData.last_name])
            );
            expect(result).toEqual(mockUser);
        });

        it('should throw ApiException when creation fails due to empty result', async () => {
            const userData = { email: 'new@test.com', password: 'hashedPassword' };
            db.query.mockResolvedValue({ rows: [] });

            await expect(User.create(userData)).rejects.toThrow(ApiException);
            await expect(User.create(userData)).rejects.toThrow('Failed to create user');
        });

        it('should throw ApiException when database query fails', async () => {
            const userData = { email: 'new@test.com', password: 'hashedPassword' };
            db.query.mockRejectedValue(new Error('Database error'));

            await expect(User.create(userData)).rejects.toThrow(ApiException);
            await expect(User.create(userData)).rejects.toThrow('Failed to create user');
        });

        it('should handle userData with varying number of fields', async () => {
            const userData = {
                email: 'test@example.com',
                password: 'hashedPassword',
                status: 'pending'
            };
            const mockUser = { ...userData, id: 1 };

            db.query.mockResolvedValue({ rows: [mockUser] });

            const result = await User.create(userData);

            expect(db.query).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO users (email, password, status)'),
                expect.arrayContaining([userData.email, userData.password, userData.status])
            );
            expect(result).toEqual(mockUser);
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

        it('should throw ApiException on database error', async () => {
            db.query.mockRejectedValue(new Error('DB error'));
            await expect(User.updateUserData(1, { first_name: 'Test' })).rejects.toThrow(ApiException);
            await expect(User.updateUserData(1, { first_name: 'Test' })).rejects.toThrow('Failed to update user in database');
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

        it('should throw ApiException on database error', async () => {
            db.query.mockRejectedValue(new Error('DB error'));
            await expect(User.delete(1)).rejects.toThrow(ApiException);
            await expect(User.delete(1)).rejects.toThrow('Failed to delete user');
        });
    });

    describe('resetPassword', () => {
        it('should reset password successfully', async () => {
            const userId = 1;
            const hashedPassword = 'hashedNewPassword123';
            const mockUser = { id: userId, password: hashedPassword };

            db.query.mockResolvedValue({ rows: [mockUser] });

            const result = await User.resetPassword(userId, hashedPassword);

            expect(db.query).toHaveBeenCalledWith(
                'UPDATE users SET password = $1 WHERE id = $2 RETURNING *',
                [hashedPassword, userId]
            );
            expect(result).toEqual(mockUser);
        });

        it('should throw ApiException when userId is missing', async () => {
            const newPassword = 'hashedPassword123';

            await expect(User.resetPassword(null, newPassword)).rejects.toThrow(ApiException);
            await expect(User.resetPassword(null, newPassword)).rejects.toThrow('User ID and new password are required');
        });

        it('should throw ApiException when password is missing', async () => {
            const userId = 1;

            await expect(User.resetPassword(userId, null)).rejects.toThrow(ApiException);
            await expect(User.resetPassword(userId, null)).rejects.toThrow('User ID and new password are required');
        });

        it('should throw ApiException when user not found', async () => {
            const userId = 999;
            const hashedPassword = 'hashedPassword123';

            db.query.mockResolvedValue({ rows: [] });

            await expect(User.resetPassword(userId, hashedPassword)).rejects.toThrow(ApiException);
            await expect(User.resetPassword(userId, hashedPassword)).rejects.toThrow('User not found');
        });

        it('should throw ApiException on database error', async () => {
            db.query.mockRejectedValue(new Error('DB error'));
            await expect(User.resetPassword(1, 'pass')).rejects.toThrow(ApiException);
            await expect(User.resetPassword(1, 'pass')).rejects.toThrow('Failed to reset password');
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

        it('should throw ApiException when user not found', async () => {
            db.query.mockResolvedValue({ rows: [] });
            await expect(User.updateLastConnection(999)).rejects.toThrow(ApiException);
            await expect(User.updateLastConnection(999)).rejects.toThrow('User not found');
        });

        it('should throw ApiException on database error', async () => {
            db.query.mockRejectedValue(new Error('DB error'));
            await expect(User.updateLastConnection(1)).rejects.toThrow(ApiException);
            await expect(User.updateLastConnection(1)).rejects.toThrow('Failed to update last connection');
        });
    });

    describe('findById error handling', () => {
        it('should throw ApiException on database error', async () => {
            db.query.mockRejectedValue(new Error('DB error'));
            await expect(User.findById(1)).rejects.toThrow(ApiException);
            await expect(User.findById(1)).rejects.toThrow('Failed to fetch user by ID');
        });
    });

    describe('delete error handling', () => {
        it('should throw ApiException on database error', async () => {
            db.query.mockRejectedValue(new Error('DB error'));
            await expect(User.delete(1)).rejects.toThrow(ApiException);
            await expect(User.delete(1)).rejects.toThrow('Failed to delete user');
        });
    });

    describe('resetPassword error handling', () => {
        it('should throw ApiException on database error', async () => {
            db.query.mockRejectedValue(new Error('DB error'));
            await expect(User.resetPassword(1, 'hashedPassword')).rejects.toThrow(ApiException);
            await expect(User.resetPassword(1, 'hashedPassword')).rejects.toThrow('Failed to reset password');
        });
    });

    describe('validateUser error handling', () => {

        it('should throw ApiException on database error', async () => {
            db.query.mockRejectedValue(new Error('DB error'));
            await expect(User.validateUser(1)).rejects.toThrow(ApiException);
            await expect(User.validateUser(1)).rejects.toThrow('Failed to validate user');
        });
    });

    describe('addFameRating', () => {
        it('should add fame rating successfully', async () => {
            const userId = 1;
            const rating = 5;
            const mockUser = { id: userId, rating: 10 };

            db.query.mockResolvedValue({ rows: [mockUser] });

            const result = await User.addFameRating(userId, rating);

            expect(db.query).toHaveBeenCalledWith(
                'UPDATE users SET rating = rating + $1 WHERE id = $2 RETURNING *',
                [rating, userId]
            );
            expect(result).toEqual(mockUser);
        });

        it('should throw ApiException when user not found', async () => {
            const userId = 999;
            const rating = 5;
            db.query.mockResolvedValue({ rows: [] });

            await expect(User.addFameRating(userId, rating)).rejects.toThrow(ApiException);
            await expect(User.addFameRating(userId, rating)).rejects.toThrow('User not found');
        });

        it('should throw ApiException on database error', async () => {
            const userId = 1;
            const rating = 5;
            db.query.mockRejectedValue(new Error('Database error'));

            await expect(User.addFameRating(userId, rating)).rejects.toThrow(ApiException);
            await expect(User.addFameRating(userId, rating)).rejects.toThrow('Failed to add fame rating');
        });
    });

    describe('updateLastConnection', () => {
        it('should update last_connection successfully', async () => {
            const userId = 1;
            const mockUser = { id: userId, last_connection: '2025-07-01T12:00:00Z' };
            db.query.mockResolvedValue({ rows: [mockUser] });

            const result = await User.updateLastConnection(userId);

            expect(db.query).toHaveBeenCalledWith(
                'UPDATE users SET last_connection = NOW() WHERE id = $1 RETURNING *',
                [userId]
            );
            expect(result).toEqual(mockUser);
        });

        it('should throw ApiException when user not found', async () => {
            db.query.mockResolvedValue({ rows: [] });
            await expect(User.updateLastConnection(999)).rejects.toThrow(ApiException);
            await expect(User.updateLastConnection(999)).rejects.toThrow('User not found');
        });

        it('should throw ApiException on database error', async () => {
            db.query.mockRejectedValue(new Error('DB error'));
            await expect(User.updateLastConnection(1)).rejects.toThrow(ApiException);
            await expect(User.updateLastConnection(1)).rejects.toThrow('Failed to update last connection');
        });
    });

    describe('getPotentialMatches', () => {
        const mockFilters = {
            userId: 1,
            gender: 'Female',
            sexual_interest: 'Male',
            age: 25,
            age_range_min: 20,
            age_range_max: 30,
            rating: 5,
            min_desired_rating: 3
        };

        it('should return potential matches with valid filters', async () => {
            const mockMatches = [
                { id: 2, first_name: 'Jane', email: 'jane@test.com' },
                { id: 3, first_name: 'Alice', email: 'alice@test.com' }
            ];
            db.query.mockResolvedValue({ rows: mockMatches });

            const result = await User.getPotentialMatches(mockFilters);

            expect(db.query).toHaveBeenCalledWith(
                expect.stringContaining('SELECT users.*'),
                [
                    mockFilters.userId,
                    mockFilters.gender,
                    mockFilters.sexual_interest,
                    mockFilters.age,
                    mockFilters.age_range_min,
                    mockFilters.age_range_max,
                    mockFilters.min_desired_rating,
                    mockFilters.rating,
                    10,
                    20
                ]
            );
            expect(result).toEqual(mockMatches);
        });

        it('should verify SQL query excludes current user', async () => {
            const mockMatches = [{ id: 2, first_name: 'Jane' }];
            db.query.mockResolvedValue({ rows: mockMatches });

            await User.getPotentialMatches(mockFilters);

            const [query] = db.query.mock.calls[0];
            expect(query).toContain('WHERE users.id != $1');
        });

        it('should verify SQL query filters by complete status', async () => {
            const mockMatches = [{ id: 2, first_name: 'Jane' }];
            db.query.mockResolvedValue({ rows: mockMatches });

            await User.getPotentialMatches(mockFilters);

            const [query] = db.query.mock.calls[0];
            expect(query).toContain("AND users.status = 'complete'");
        });

        it('should verify SQL query filters by sexual interest', async () => {
            const mockMatches = [{ id: 2, first_name: 'Jane' }];
            db.query.mockResolvedValue({ rows: mockMatches });

            await User.getPotentialMatches(mockFilters);

            const [query] = db.query.mock.calls[0];
            expect(query).toContain("AND (users.sexual_interest = $2 OR users.sexual_interest = 'Any')");
        });

        it('should verify SQL query filters by gender', async () => {
            const mockMatches = [{ id: 2, first_name: 'Jane' }];
            db.query.mockResolvedValue({ rows: mockMatches });

            await User.getPotentialMatches(mockFilters);

            const [query] = db.query.mock.calls[0];
            expect(query).toContain('AND (users.gender = $3 OR $3 = \'Any\')');
        });

        it('should verify SQL query filters by age range', async () => {
            const mockMatches = [{ id: 2, first_name: 'Jane' }];
            db.query.mockResolvedValue({ rows: mockMatches });

            await User.getPotentialMatches(mockFilters);

            const [query] = db.query.mock.calls[0];
            expect(query).toContain('AND users.age_range_min <= $4');
            expect(query).toContain('AND users.age_range_max >= $4');
        });

        it('should verify SQL query filters by birth year range', async () => {
            const mockMatches = [{ id: 2, first_name: 'Jane' }];
            db.query.mockResolvedValue({ rows: mockMatches });

            await User.getPotentialMatches(mockFilters);

            const [query] = db.query.mock.calls[0];
            expect(query).toContain('AND $5 <= EXTRACT(YEAR FROM AGE(users.birthdate))');
            expect(query).toContain('AND $6 >= EXTRACT(YEAR FROM AGE(users.birthdate))');
        });

        it('should verify SQL query filters by rating', async () => {
            const mockMatches = [{ id: 2, first_name: 'Jane' }];
            db.query.mockResolvedValue({ rows: mockMatches });

            await User.getPotentialMatches(mockFilters);

            const [query] = db.query.mock.calls[0];
            expect(query).toContain('AND users.rating >= $7');
        });

        it('should verify SQL query filters by min desired rating', async () => {
            const mockMatches = [{ id: 2, first_name: 'Jane' }];
            db.query.mockResolvedValue({ rows: mockMatches });

            await User.getPotentialMatches(mockFilters);

            const [query] = db.query.mock.calls[0];
            expect(query).toContain('AND users.min_desired_rating <= $8');
        });

        it('should handle filters with different parameters', async () => {
            const customFilters = {
                userId: 2,
                gender: 'Male',
                sexual_interest: 'Any',
                age: 30,
                age_range_min: 20,
                age_range_max: 40,
                min_desired_rating: 8,
                rating: 9
            };

            db.query.mockResolvedValue({ rows: [] });

            await User.getPotentialMatches(customFilters);

            expect(db.query).toHaveBeenCalledWith(
                expect.stringContaining('SELECT users.*'),
                [
                    customFilters.userId,
                    customFilters.gender,
                    customFilters.sexual_interest,
                    customFilters.age,
                    customFilters.age_range_min,
                    customFilters.age_range_max,
                    customFilters.min_desired_rating,
                    customFilters.rating,
                    10,
                    20
                ]
            );
        });

        it('should throw ApiException on database error', async () => {
            db.query.mockRejectedValue(new Error('Database connection failed'));

            await expect(User.getPotentialMatches(mockFilters)).rejects.toThrow(ApiException);
            await expect(User.getPotentialMatches(mockFilters)).rejects.toThrow('Failed to fetch potential matches');
        });

        it('should return empty array when no matches found', async () => {
            db.query.mockResolvedValue({ rows: [] });

            const result = await User.getPotentialMatches(mockFilters);

            expect(result).toEqual([]);
        });
    });
});