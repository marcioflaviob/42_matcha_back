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

    describe('addFameRating error handling', () => {
        it('should throw ApiException on database error', async () => {
            db.query.mockRejectedValue(new Error('DB error'));
            await expect(User.addFameRating(1, 10)).rejects.toThrow(ApiException);
            await expect(User.addFameRating(1, 10)).rejects.toThrow('Failed to add fame rating');
        });

        it('should throw ApiException when user not found', async () => {
            db.query.mockResolvedValue({ rows: [] });
            await expect(User.addFameRating(999, 10)).rejects.toThrow(ApiException);
            await expect(User.addFameRating(999, 10)).rejects.toThrow('User not found');
        });
    });

    describe('addFameRating should work correctly', () => {
        it('should return updated user with fame rating', async () => {
            const userId = 1;
            const rating = 5;
            const mockUser = { id: userId, rating: 10 + rating };

            db.query.mockResolvedValue({ rows: [mockUser] });

            const result = await User.addFameRating(userId, rating);

            expect(db.query).toHaveBeenCalledWith(
                'UPDATE users SET rating = rating + $1 WHERE id = $2 RETURNING *',
                [rating, userId]
            );
            expect(result).toEqual(mockUser);
        });
    });

    describe('updateUserData error handling', () => {
        it('should throw ApiException on database error', async () => {
            db.query.mockRejectedValue(new Error('DB error'));
            await expect(User.updateUserData(1, { first_name: 'Test' })).rejects.toThrow(ApiException);
            await expect(User.updateUserData(1, { first_name: 'Test' })).rejects.toThrow('Failed to update user in database');
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

    describe('findPotentialMatches', () => {
        const mockFilters = {
            sexual_interest: ['male', 'female'],
            min_desired_rating: 5,
            gender: 'female'
        };

        const mockMatches = [
            {
                id: 2,
                first_name: 'Jane',
                gender: 'female',
                sexual_interest: 'male',
                rating: 8,
                status: 'complete'
            },
            {
                id: 3,
                first_name: 'Alice',
                gender: 'female',
                sexual_interest: 'Any',
                rating: 6,
                status: 'complete'
            }
        ];

        it('should return potential matches with valid filters', async () => {
            const userId = 1;
            db.query.mockResolvedValue({ rows: mockMatches });

            const result = await User.findPotentialMatches(userId, mockFilters);

            expect(db.query).toHaveBeenCalledWith(
                expect.stringContaining('SELECT DISTINCT u.*'),
                [
                    userId,
                    mockFilters.sexual_interest,
                    mockFilters.min_desired_rating,
                    mockFilters.gender
                ]
            );
            expect(result).toEqual(mockMatches);
        });

        it('should handle filters with default min_desired_rating when not provided', async () => {
            const userId = 1;
            const filtersWithoutRating = {
                sexual_interest: ['male'],
                gender: 'female'
            };
            db.query.mockResolvedValue({ rows: mockMatches });

            const result = await User.findPotentialMatches(userId, filtersWithoutRating);

            expect(db.query).toHaveBeenCalledWith(
                expect.stringContaining('SELECT DISTINCT u.*'),
                [
                    userId,
                    filtersWithoutRating.sexual_interest,
                    0, // default min_desired_rating
                    filtersWithoutRating.gender
                ]
            );
            expect(result).toEqual(mockMatches);
        });

        it('should verify SQL query excludes current user', async () => {
            const userId = 1;
            db.query.mockResolvedValue({ rows: mockMatches });

            await User.findPotentialMatches(userId, mockFilters);

            const [query] = db.query.mock.calls[0];
            expect(query).toContain('WHERE u.id != $1');
        });

        it('should verify SQL query filters by complete status', async () => {
            const userId = 1;
            db.query.mockResolvedValue({ rows: mockMatches });

            await User.findPotentialMatches(userId, mockFilters);

            const [query] = db.query.mock.calls[0];
            expect(query).toContain("AND u.status = 'complete'");
        });

        it('should verify SQL query filters by gender preference', async () => {
            const userId = 1;
            db.query.mockResolvedValue({ rows: mockMatches });

            await User.findPotentialMatches(userId, mockFilters);

            const [query] = db.query.mock.calls[0];
            expect(query).toContain('AND u.gender = ANY($2::text[])');
        });

        it('should verify SQL query filters by minimum rating', async () => {
            const userId = 1;
            db.query.mockResolvedValue({ rows: mockMatches });

            await User.findPotentialMatches(userId, mockFilters);

            const [query] = db.query.mock.calls[0];
            expect(query).toContain('AND COALESCE(u.rating, 0) >= $3');
        });

        it('should verify SQL query filters by sexual interest compatibility', async () => {
            const userId = 1;
            db.query.mockResolvedValue({ rows: mockMatches });

            await User.findPotentialMatches(userId, mockFilters);

            const [query] = db.query.mock.calls[0];
            expect(query).toContain("AND (u.sexual_interest = 'Any' OR u.sexual_interest = $4)");
        });

        it('should verify SQL query excludes already liked users', async () => {
            const userId = 1;
            db.query.mockResolvedValue({ rows: mockMatches });

            await User.findPotentialMatches(userId, mockFilters);

            const [query] = db.query.mock.calls[0];
            expect(query).toContain("AND u.id NOT IN");
            expect(query).toContain("interaction_type = 'like'");
        });

        it('should verify SQL query excludes blocked users', async () => {
            const userId = 1;
            db.query.mockResolvedValue({ rows: mockMatches });

            await User.findPotentialMatches(userId, mockFilters);

            const [query] = db.query.mock.calls[0];
            expect(query).toContain("interaction_type = 'block'");
        });

        it('should verify SQL query requires shared interests', async () => {
            const userId = 1;
            db.query.mockResolvedValue({ rows: mockMatches });

            await User.findPotentialMatches(userId, mockFilters);

            const [query] = db.query.mock.calls[0];
            expect(query).toContain('AND EXISTS');
            expect(query).toContain('FROM user_interests ui1');
            expect(query).toContain('JOIN user_interests ui2 ON ui1.interest_id = ui2.interest_id');
        });

        it('should verify SQL query orders by rating descending', async () => {
            const userId = 1;
            db.query.mockResolvedValue({ rows: mockMatches });

            await User.findPotentialMatches(userId, mockFilters);

            const [query] = db.query.mock.calls[0];
            expect(query).toContain('ORDER BY');
            expect(query).toContain('COALESCE(u.rating, 0) DESC');
        });

        it('should return empty array when no matches found', async () => {
            const userId = 1;
            db.query.mockResolvedValue({ rows: [] });

            const result = await User.findPotentialMatches(userId, mockFilters);

            expect(result).toEqual([]);
        });

        it('should handle users with null rating', async () => {
            const userId = 1;
            const matchesWithNullRating = [
                {
                    id: 2,
                    first_name: 'Jane',
                    rating: null,
                    status: 'complete'
                }
            ];
            db.query.mockResolvedValue({ rows: matchesWithNullRating });

            const result = await User.findPotentialMatches(userId, mockFilters);

            expect(result).toEqual(matchesWithNullRating);
            const [query] = db.query.mock.calls[0];
            expect(query).toContain('COALESCE(u.rating, 0)');
        });

        it('should throw ApiException on database error', async () => {
            const userId = 1;
            db.query.mockRejectedValue(new Error('Database connection failed'));

            await expect(User.findPotentialMatches(userId, mockFilters))
                .rejects
                .toThrow(ApiException);

            await expect(User.findPotentialMatches(userId, mockFilters))
                .rejects
                .toThrow('Failed to find potential matches');
        });

        it('should handle complex filter combinations', async () => {
            const userId = 1;
            const complexFilters = {
                sexual_interest: ['male', 'female', 'non-binary'],
                min_desired_rating: 10,
                gender: 'non-binary'
            };

            db.query.mockResolvedValue({ rows: [] });

            const result = await User.findPotentialMatches(userId, complexFilters);

            expect(db.query).toHaveBeenCalledWith(
                expect.stringContaining('SELECT DISTINCT u.*'),
                [
                    userId,
                    complexFilters.sexual_interest,
                    complexFilters.min_desired_rating,
                    complexFilters.gender
                ]
            );
            expect(result).toEqual([]);
        });

        it('should ensure DISTINCT is used to avoid duplicate results', async () => {
            const userId = 1;
            db.query.mockResolvedValue({ rows: mockMatches });

            await User.findPotentialMatches(userId, mockFilters);

            const [query] = db.query.mock.calls[0];
            expect(query).toContain('SELECT DISTINCT u.*');
        });

        it('should include rating in SELECT with proper COALESCE', async () => {
            const userId = 1;
            db.query.mockResolvedValue({ rows: mockMatches });

            await User.findPotentialMatches(userId, mockFilters);

            const [query] = db.query.mock.calls[0];
            expect(query).toContain('COALESCE(u.rating, 0) as rating');
        });

        it('should include calculated age in SELECT', async () => {
            const userId = 1;
            db.query.mockResolvedValue({ rows: mockMatches });

            await User.findPotentialMatches(userId, mockFilters);

            const [query] = db.query.mock.calls[0];
            expect(query).toContain('EXTRACT(YEAR FROM AGE(u.birthdate)) as calculated_age');
        });

        it('should verify SQL query includes age range filtering', async () => {
            const userId = 1;
            db.query.mockResolvedValue({ rows: mockMatches });

            await User.findPotentialMatches(userId, mockFilters);

            const [query] = db.query.mock.calls[0];
            expect(query).toContain('CROSS JOIN (');
            expect(query).toContain('SELECT age_range_min, age_range_max');
            expect(query).toContain('FROM users');
            expect(query).toContain('WHERE id = $1');
            expect(query).toContain(') requester');
        });

        it('should verify SQL query filters by age range minimum', async () => {
            const userId = 1;
            db.query.mockResolvedValue({ rows: mockMatches });

            await User.findPotentialMatches(userId, mockFilters);

            const [query] = db.query.mock.calls[0];
            expect(query).toContain('AND EXTRACT(YEAR FROM AGE(u.birthdate)) >= requester.age_range_min');
        });

        it('should verify SQL query filters by age range maximum', async () => {
            const userId = 1;
            db.query.mockResolvedValue({ rows: mockMatches });

            await User.findPotentialMatches(userId, mockFilters);

            const [query] = db.query.mock.calls[0];
            expect(query).toContain('AND EXTRACT(YEAR FROM AGE(u.birthdate)) <= requester.age_range_max');
        });

        it('should verify SQL query excludes users with null birthdate', async () => {
            const userId = 1;
            db.query.mockResolvedValue({ rows: mockMatches });

            await User.findPotentialMatches(userId, mockFilters);

            const [query] = db.query.mock.calls[0];
            expect(query).toContain('AND u.birthdate IS NOT NULL');
        });

        it('should handle users within age range correctly', async () => {
            const userId = 1;
            const matchesWithAge = [
                {
                    id: 2,
                    first_name: 'Jane',
                    gender: 'female',
                    sexual_interest: 'male',
                    rating: 8,
                    status: 'complete',
                    birthdate: '1995-01-01',
                    calculated_age: 30
                },
                {
                    id: 3,
                    first_name: 'Alice',
                    gender: 'female',
                    sexual_interest: 'Any',
                    rating: 6,
                    status: 'complete',
                    birthdate: '1990-01-01',
                    calculated_age: 35
                }
            ];

            db.query.mockResolvedValue({ rows: matchesWithAge });

            const result = await User.findPotentialMatches(userId, mockFilters);

            expect(result).toEqual(matchesWithAge);
            expect(result).toHaveLength(2);
            expect(result[0]).toHaveProperty('calculated_age');
            expect(result[1]).toHaveProperty('calculated_age');
        });

        it('should verify SQL query structure with age range cross join', async () => {
            const userId = 1;
            db.query.mockResolvedValue({ rows: mockMatches });

            await User.findPotentialMatches(userId, mockFilters);

            const [query] = db.query.mock.calls[0];

            // Verify the cross join structure
            expect(query).toContain('FROM users u');
            expect(query).toContain('CROSS JOIN (');
            expect(query).toContain('SELECT age_range_min, age_range_max');
            expect(query).toContain('FROM users');
            expect(query).toContain('WHERE id = $1');
            expect(query).toContain(') requester');

            // Verify age filtering conditions come after the cross join
            expect(query).toContain('AND EXTRACT(YEAR FROM AGE(u.birthdate)) >= requester.age_range_min');
            expect(query).toContain('AND EXTRACT(YEAR FROM AGE(u.birthdate)) <= requester.age_range_max');
        });

        it('should handle edge case with empty age range results', async () => {
            const userId = 1;
            db.query.mockResolvedValue({ rows: [] });

            const result = await User.findPotentialMatches(userId, mockFilters);

            expect(result).toEqual([]);
            expect(result).toHaveLength(0);
        });

        it('should verify query parameters remain unchanged with age range feature', async () => {
            const userId = 1;
            db.query.mockResolvedValue({ rows: mockMatches });

            await User.findPotentialMatches(userId, mockFilters);

            expect(db.query).toHaveBeenCalledWith(
                expect.stringContaining('SELECT DISTINCT u.*'),
                [
                    userId,
                    mockFilters.sexual_interest,
                    mockFilters.min_desired_rating,
                    mockFilters.gender
                ]
            );
        });
    });
});