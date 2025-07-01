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

    describe('getPotentialMatches', () => {
        const mockFilters = {
            userId: 1,
            gender: 'Female',
            sexual_interest: 'Male',
            age: 25,
            age_range_min: 18,
            age_range_max: 35,
            min_desired_rating: 5,
            rating: 7
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
                    mockFilters.rating
                ]
            );
            expect(result).toEqual(mockMatches);
        });

        it('should verify SQL query excludes current user', async () => {
            db.query.mockResolvedValue({ rows: mockMatches });

            await User.getPotentialMatches(mockFilters);

            const [query] = db.query.mock.calls[0];
            expect(query).toContain('WHERE users.id != $1');
        });

        it('should verify SQL query filters by complete status', async () => {
            db.query.mockResolvedValue({ rows: mockMatches });

            await User.getPotentialMatches(mockFilters);

            const [query] = db.query.mock.calls[0];
            expect(query).toContain("AND users.status = 'complete'");
        });

        it('should verify SQL query filters by sexual interest', async () => {
            db.query.mockResolvedValue({ rows: mockMatches });

            await User.getPotentialMatches(mockFilters);

            const [query] = db.query.mock.calls[0];
            expect(query).toContain("AND (users.sexual_interest = $2 OR  users.sexual_interest = 'Any')");
        });

        it('should verify SQL query filters by gender', async () => {
            db.query.mockResolvedValue({ rows: mockMatches });

            await User.getPotentialMatches(mockFilters);

            const [query] = db.query.mock.calls[0];
            expect(query).toContain('AND (users.gender = $3 OR $3 = \'Any\')');
        });

        it('should verify SQL query filters by age range', async () => {
            db.query.mockResolvedValue({ rows: mockMatches });

            await User.getPotentialMatches(mockFilters);

            const [query] = db.query.mock.calls[0];
            expect(query).toContain('AND users.age_range_min <= $4');
            expect(query).toContain('AND users.age_range_max >= $4');
        });

        it('should verify SQL query filters by birth year range', async () => {
            db.query.mockResolvedValue({ rows: mockMatches });

            await User.getPotentialMatches(mockFilters);

            const [query] = db.query.mock.calls[0];
            expect(query).toContain('AND $5 <= EXTRACT(YEAR FROM AGE(users.birthdate))');
            expect(query).toContain('AND $6 >= EXTRACT(YEAR FROM AGE(users.birthdate))');
        });

        it('should verify SQL query filters by rating', async () => {
            db.query.mockResolvedValue({ rows: mockMatches });

            await User.getPotentialMatches(mockFilters);

            const [query] = db.query.mock.calls[0];
            expect(query).toContain('AND users.rating >= $7');
        });

        it('should verify SQL query filters by min desired rating', async () => {
            db.query.mockResolvedValue({ rows: mockMatches });

            await User.getPotentialMatches(mockFilters);

            const [query] = db.query.mock.calls[0];
            expect(query).toContain('AND users.min_desired_rating <= $8');
        });

        it('should return empty array when no matches found', async () => {
            db.query.mockResolvedValue({ rows: [] });

            const result = await User.getPotentialMatches(mockFilters);

            expect(result).toEqual([]);
        });

        it('should throw ApiException on database error', async () => {
            db.query.mockRejectedValue(new Error('Database connection failed'));

            await expect(User.getPotentialMatches(mockFilters))
                .rejects
                .toThrow('Failed to fetch potential matches');
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
                    customFilters.rating
                ]
            );
        });
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

        it('should throw ApiException when user not found', async () => {
            db.query.mockResolvedValue({ rows: [] });

            await expect(User.findByEmail('nonexistent@example.com'))
                .rejects
                .toThrow('User not found');
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

        it('should throw another exception when creation fails', async () => {
            const userData = { email: 'new@test.com', password: 'password123' };
            db.query.mockRejectedValue(new Error('Database error'));
            await expect(User.create(userData)).rejects.toThrow(ApiException);
            await expect(User.create(userData)).rejects.toThrow('Failed to create user');
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
});
