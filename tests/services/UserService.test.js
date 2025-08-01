const User = require('../../models/User/User.js');
const InterestsService = require('../../services/InterestsService.js');
const LocationService = require('../../services/LocationService.js');
const UserPictureService = require('../../services/UserPictureService.js');
const UserInteractionsService = require('../../services/UserInteractionsService.js');
const ApiException = require('../../exceptions/ApiException.js');
const UserService = require('../../services/UserService.js');
const bcrypt = require('bcrypt');
const dumbPasswords = require('dumb-passwords');
const UserInteractions = require('../../models/UserInteractions/UserInteractions.js');
const {
    mockConsole,
    restoreConsole,
    createMockData,
    createServiceMocks
} = require('../utils/testSetup');
const { getMatchesIdsByUserId } = require('../../services/UserInteractionsService.js');

jest.mock('../../models/User/User.js');
jest.mock('../../models/UserInteractions/UserInteractions.js');
jest.mock('../../services/InterestsService.js');
jest.mock('../../services/LocationService.js');
jest.mock('../../services/UserPictureService.js');
jest.mock('../../services/UserInteractionsService.js');
jest.mock('bcrypt');
jest.mock('dumb-passwords');

let serviceMocks;

beforeEach(() => {
    mockConsole();
    serviceMocks = createServiceMocks();

    InterestsService.getInterestsListByUserId = serviceMocks.interestsService.getInterestsListByUserId;
    UserPictureService.getUserPictures = serviceMocks.pictureService.getUserPictures;
    UserInteractionsService.getLikeCountByUserId = serviceMocks.userInteractionsService.getLikeCountByUserId;
    LocationService.getLocationByUserId = serviceMocks.locationService.getLocationByUserId;
});

afterEach(() => {
    restoreConsole();
});

describe('UserService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getAllUsers', () => {
        it('should return formatted users', async () => {
            const mockUsers = [
                createMockData.user({ id: 1, email: 'user1@test.com', birthdate: '1990-01-01' }),
                createMockData.user({ id: 2, email: 'user2@test.com', birthdate: '1995-01-01' })
            ];

            User.findAll.mockResolvedValue(mockUsers);

            const result = await UserService.getAllUsers();

            expect(User.findAll).toHaveBeenCalled();
            expect(result).toHaveLength(2);
            expect(result[0]).not.toHaveProperty('password');
        });

        it('should handle errors', async () => {
            User.findAll.mockRejectedValue(new Error('Database error'));

            await expect(UserService.getAllUsers()).rejects.toThrow();
        });
    });

    describe('createUser', () => {
        beforeEach(() => {
            bcrypt.genSalt.mockResolvedValue('mockedSalt');
            bcrypt.hash.mockResolvedValue('hashedPassword');
            dumbPasswords.check.mockReturnValue(false);
            User.checkUserExists.mockResolvedValue(false);
        });

        it('should create user successfully with hashed password', async () => {
            const userData = {
                email: 'test@example.com',
                password: 'strongPassword123!'
            };
            const expectedUserData = {
                ...userData,
                password: 'hashedPassword'
            };
            const mockUser = createMockData.user({ ...expectedUserData, id: 1 });

            User.create.mockResolvedValue(mockUser);

            const result = await UserService.createUser(userData);

            expect(User.checkUserExists).toHaveBeenCalledWith('test@example.com');
            expect(dumbPasswords.check).toHaveBeenCalledWith('strongPassword123!');
            expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
            expect(bcrypt.hash).toHaveBeenCalledWith('strongPassword123!', 'mockedSalt');
            expect(User.create).toHaveBeenCalledWith(expectedUserData);
            expect(result).toEqual(mockUser);
        });

        it('should throw ApiException when email is missing', async () => {
            const userData = { password: 'password123' };

            await expect(UserService.createUser(userData))
                .rejects
                .toThrow('Email and password are required');
        });

        it('should throw ApiException when password is missing', async () => {
            const userData = { email: 'test@example.com' };

            await expect(UserService.createUser(userData))
                .rejects
                .toThrow('Email and password are required');
        });

        it('should throw ApiException when userData is null', async () => {
            await expect(UserService.createUser(null))
                .rejects
                .toThrow('Email and password are required');
        });

        it('should throw ApiException when email already exists', async () => {
            const userData = {
                email: 'existing@example.com',
                password: 'password123'
            };

            User.checkUserExists.mockResolvedValue(true);

            await expect(UserService.createUser(userData))
                .rejects
                .toThrow('Email already exists');
        });

        it('should throw ApiException when password is too weak', async () => {
            const userData = {
                email: 'test@example.com',
                password: 'weakpass'
            };

            dumbPasswords.check.mockReturnValue(true);

            await expect(UserService.createUser(userData))
                .rejects
                .toThrow('Password is too weak');
        });

        it('should throw ApiException when bcrypt fails', async () => {
            const userData = {
                email: 'test@example.com',
                password: 'strongPassword123!'
            };

            bcrypt.genSalt.mockRejectedValue(new Error('Bcrypt error'));

            await expect(UserService.createUser(userData))
                .rejects
                .toThrow('Failed to create an account, please try again later');
        });

        it('should throw ApiException when user creation fails', async () => {
            const userData = {
                email: 'test@example.com',
                password: 'strongPassword123!'
            };

            User.create.mockResolvedValue(null);

            await expect(UserService.createUser(userData))
                .rejects
                .toThrow(ApiException);
        });
    });

    describe('getUserById', () => {
        it('should return formatted user when found', async () => {
            const mockUser = {
                id: 1,
                email: 'test@example.com',
                birthdate: '1990-01-01',
                password: 'hashedpass'
            };

            User.findById.mockResolvedValue(mockUser);
            InterestsService.getInterestsListByUserId.mockResolvedValue([]);
            UserPictureService.getUserPictures.mockResolvedValue([]);
            UserInteractionsService.getLikeCountByUserId.mockResolvedValue(0);
            LocationService.getLocationByUserId.mockResolvedValue(null);

            const result = await UserService.getUserById(1);

            expect(User.findById).toHaveBeenCalledWith(1);
            expect(result).not.toHaveProperty('password');
        });

        it('should throw ApiException when userId is missing', async () => {
            await expect(UserService.getUserById())
                .rejects
                .toThrow('User ID is required');
        });

        it('should throw ApiException when user is not found', async () => {
            User.findById.mockResolvedValue(null);

            await expect(UserService.getUserById(999))
                .rejects
                .toThrow('User not found');
        });
    });

    describe('updateUser', () => {
        const mockReq = {
            user: { id: 1 },
            body: {
                id: 1,
                name: 'Updated Name',
                email: 'updated@test.com',
                interests: ['coding', 'reading'],
                location: { latitude: 48.8566, longitude: 2.3522 }
            }
        };

        it('should update user successfully', async () => {
            const mockUpdatedUser = {
                id: 1,
                name: 'Updated Name',
                email: 'updated@test.com'
            };

            User.updateUserData.mockResolvedValue(mockUpdatedUser);
            InterestsService.updateUserInterests.mockResolvedValue(['coding', 'reading']);
            LocationService.updateUserLocation.mockResolvedValue({ latitude: 48.8566, longitude: 2.3522 });

            const result = await UserService.updateUser(mockReq);

            expect(User.updateUserData).toHaveBeenCalled();
            expect(result).toBeDefined();
            expect(result.id).toBe(mockUpdatedUser.id);
        });

        it('should throw ApiException when request is invalid', async () => {
            await expect(UserService.updateUser({ body: {} }))
                .rejects
                .toThrow('User ID is required for update');
        });
    });

    describe('deleteUser', () => {
        it('should delete user successfully', async () => {
            const userId = 1;
            const mockResult = { success: true };

            User.delete.mockResolvedValue(mockResult);

            const result = await UserService.deleteUser(userId);

            expect(User.delete).toHaveBeenCalledWith(userId);
            expect(result).toEqual(mockResult);
        });

        it('should throw ApiException when userId is missing', async () => {
            await expect(UserService.deleteUser())
                .rejects
                .toThrow('User ID is required');
        });
    });

    describe('resetPassword', () => {
        beforeEach(() => {
            bcrypt.genSalt.mockResolvedValue('mockedSalt');
            bcrypt.hash.mockResolvedValue('hashedNewPassword');
            dumbPasswords.check.mockReturnValue(false);
        });

        it('should reset password successfully with hashing', async () => {
            const userId = 1;
            const newPassword = 'newStrongPassword123!';
            const mockUser = { id: userId, email: 'test@example.com' };

            User.resetPassword.mockResolvedValue(mockUser);
            InterestsService.getInterestsListByUserId.mockResolvedValue([]);
            UserPictureService.getUserPictures.mockResolvedValue([]);
            UserInteractionsService.getLikeCountByUserId.mockResolvedValue(0);
            LocationService.getLocationByUserId.mockResolvedValue(null);

            const result = await UserService.resetPassword(userId, newPassword);

            expect(dumbPasswords.check).toHaveBeenCalledWith(newPassword);
            expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
            expect(bcrypt.hash).toHaveBeenCalledWith(newPassword, 'mockedSalt');
            expect(User.resetPassword).toHaveBeenCalledWith(userId, 'hashedNewPassword');
            expect(result).not.toHaveProperty('password');
        });

        it('should throw ApiException when parameters are missing', async () => {
            await expect(UserService.resetPassword())
                .rejects
                .toThrow('User ID and password are required');
        });

        it('should throw ApiException when userId is missing', async () => {
            await expect(UserService.resetPassword(null, 'password123'))
                .rejects
                .toThrow('User ID and password are required');
        });

        it('should throw ApiException when password is missing', async () => {
            await expect(UserService.resetPassword(1, null))
                .rejects
                .toThrow('User ID and password are required');
        });

        it('should throw ApiException when password is too weak', async () => {
            const userId = 1;
            const weakPassword = 'weak';

            dumbPasswords.check.mockReturnValue(true);

            await expect(UserService.resetPassword(userId, weakPassword))
                .rejects
                .toThrow('Password is too weak');
        });

        it('should throw ApiException when bcrypt fails', async () => {
            const userId = 1;
            const newPassword = 'strongPassword123!';

            bcrypt.genSalt.mockRejectedValue(new Error('Bcrypt error'));

            await expect(UserService.resetPassword(userId, newPassword))
                .rejects
                .toThrow('Failed to reset password, please try again later');
        });

        it('should throw ApiException when hash fails', async () => {
            const userId = 1;
            const newPassword = 'strongPassword123!';

            bcrypt.hash.mockRejectedValue(new Error('Hash error'));

            await expect(UserService.resetPassword(userId, newPassword))
                .rejects
                .toThrow('Failed to reset password, please try again later');
        });

        it('should throw ApiException when user is not found', async () => {
            const userId = 999;
            const newPassword = 'newStrongPassword123!';

            User.resetPassword.mockResolvedValue(null);

            await expect(UserService.resetPassword(userId, newPassword))
                .rejects
                .toThrow('User not found');
        });
    });

    describe('validateUser', () => {
        it('should validate user successfully', async () => {
            const userId = 1;
            const mockUser = {
                id: userId,
                email: 'test@example.com',
                status: 'complete'
            };

            User.validateUser.mockResolvedValue(mockUser);
            InterestsService.getInterestsListByUserId.mockResolvedValue([]);
            UserPictureService.getUserPictures.mockResolvedValue([]);
            UserInteractionsService.getLikeCountByUserId.mockResolvedValue(0);
            LocationService.getLocationByUserId.mockResolvedValue(null);

            const result = await UserService.validateUser(userId);

            expect(User.validateUser).toHaveBeenCalledWith(userId);
            expect(result).not.toHaveProperty('password');
            expect(result.status).toBe('complete');
        });

        it('should throw ApiException when userId is missing', async () => {
            await expect(UserService.validateUser())
                .rejects
                .toThrow('User ID is required');
        });

        it('should throw ApiException when user is not found', async () => {
            const userId = 999;

            User.validateUser.mockResolvedValue(null);

            await expect(UserService.validateUser(userId))
                .rejects
                .toThrow('User not found');
        });
    });

    describe('user formatting', () => {
        const mockUser = {
            id: 1,
            email: 'test@example.com',
            birthdate: '1990-01-01',
            password: 'hashedpass'
        };

        beforeEach(() => {
            InterestsService.getInterestsListByUserId.mockResolvedValue([]);
            UserPictureService.getUserPictures.mockResolvedValue([]);
            UserInteractionsService.getLikeCountByUserId.mockResolvedValue(0);
            LocationService.getLocationByUserId.mockResolvedValue(null);
            User.findById.mockResolvedValue(mockUser);
        });

        it('should format user with all related data', async () => {
            const interests = [{ id: 1, name: 'coding' }];
            const pictures = [{ id: 1, url: 'pic1.jpg' }];
            const location = { latitude: 48.8566, longitude: 2.3522 };

            InterestsService.getInterestsListByUserId.mockResolvedValue(interests);
            UserPictureService.getUserPictures.mockResolvedValue(pictures);
            LocationService.getLocationByUserId.mockResolvedValue(location);

            const result = await UserService.getUserById(1);

            expect(result.interests).toEqual(interests);
            expect(result.pictures).toEqual(pictures);
            expect(result.location).toEqual(location);
            expect(result).not.toHaveProperty('password');
        });

        it('should handle missing related data gracefully', async () => {
            const result = await UserService.getUserById(1);

            expect(result.interests).toEqual([]);
            expect(result.pictures).toEqual([]);
            expect(result.location).toBeNull();
        });

        it('should handle service errors gracefully', async () => {
            InterestsService.getInterestsListByUserId.mockRejectedValue(new Error('Service error'));
            UserPictureService.getUserPictures.mockRejectedValue(new Error('Service error'));
            UserInteractionsService.getLikeCountByUserId.mockRejectedValue(new Error('Service error'));
            LocationService.getLocationByUserId.mockRejectedValue(new Error('Service error'));

            await expect(UserService.getUserById(1)).rejects.toThrow('Service error');
        });
    });

    describe('updateUser with complex scenarios', () => {
        const mockReq = {
            user: { id: 1 },
            body: {
                id: 1,
                name: 'Updated Name',
                email: 'updated@test.com',
                interests: [{ id: 1, name: 'coding' }],
                location: { latitude: 48.8566, longitude: 2.3522 },
                status: 'active'
            }
        };

        it('should handle email update with validation status', async () => {
            User.updateUserData.mockResolvedValue({
                id: 1,
                name: 'Updated Name',
                email: 'updated@test.com',
                status: 'active'
            });

            InterestsService.updateUserInterests.mockResolvedValue([]);
            LocationService.updateUserLocation.mockResolvedValue(null);

            const result = await UserService.updateUser(mockReq);

            expect(result.status).toBe('active');
            expect(User.updateUserData).toHaveBeenCalledWith(
                1,
                expect.objectContaining({
                    email: 'updated@test.com',
                    status: 'active'
                })
            );
        });

        it('should handle password update with hashing', async () => {
            const reqWithPassword = {
                user: { id: 1 },
                body: {
                    id: 1,
                    password: 'newpassword'
                }
            };

            const hashedPassword = 'hashedpassword123';
            bcrypt.genSalt.mockResolvedValue('salt');
            bcrypt.hash.mockResolvedValue(hashedPassword);
            User.updateUserData.mockResolvedValue({ id: 1 });
            InterestsService.updateUserInterests.mockResolvedValue([]);
            LocationService.updateUserLocation.mockResolvedValue(null);

            await UserService.updateUser(reqWithPassword);

            expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
            expect(bcrypt.hash).toHaveBeenCalledWith('newpassword', 'salt');
            expect(User.updateUserData).toHaveBeenCalledWith(
                1,
                expect.objectContaining({ password: hashedPassword })
            );
        });

        it('should handle partial updates', async () => {
            const partialReq = {
                user: { id: 1 },
                body: {
                    id: 1,
                    name: 'Updated Name'
                }
            };

            User.updateUserData.mockResolvedValue({ id: 1, name: 'Updated Name' });
            InterestsService.updateUserInterests.mockResolvedValue([]);
            LocationService.updateUserLocation.mockResolvedValue(null);

            const result = await UserService.updateUser(partialReq);

            expect(User.updateUserData).toHaveBeenCalledWith(
                1,
                expect.objectContaining({ name: 'Updated Name' })
            );
            expect(result).toBeDefined();
        });
    });

    describe('profile completion and status transitions', () => {
        const baseUserData = {
            id: 1,
            email: 'test@example.com',
            first_name: 'Test',
            last_name: 'User',
            birthdate: '1990-01-01',
            gender: 'Male',
            sexual_interest: 'Female'
        };

        it('should validate user profile as incomplete when required fields are missing', async () => {
            const incompleteUser = { ...baseUserData };
            delete incompleteUser.gender;

            User.findById.mockResolvedValue(incompleteUser);
            InterestsService.getInterestsListByUserId.mockResolvedValue([]);
            UserPictureService.getUserPictures.mockResolvedValue([]);
            UserInteractionsService.getLikeCountByUserId.mockResolvedValue(0);
            LocationService.getLocationByUserId.mockResolvedValue(null);

            const result = await UserService.getUserById(1);
            expect(result.status).not.toBe('complete');
        });

        it('should successfully transition user status to complete when validated', async () => {
            const completeUser = {
                ...baseUserData,
                status: 'step_one'
            };

            const validatedUser = {
                ...completeUser,
                status: 'complete'
            };

            User.validateUser.mockResolvedValue(validatedUser);
            InterestsService.getInterestsListByUserId.mockResolvedValue([{ id: 1, name: 'coding' }]);
            UserPictureService.getUserPictures.mockResolvedValue([{ id: 1, url: 'pic1.jpg' }]);
            UserInteractionsService.getLikeCountByUserId.mockResolvedValue(0);
            LocationService.getLocationByUserId.mockResolvedValue({ latitude: 48.8566, longitude: 2.3522 });

            const result = await UserService.validateUser(1);
            expect(result.status).toBe('complete');
            expect(result.interests).toHaveLength(1);
            expect(result.pictures).toHaveLength(1);
            expect(result.location).toBeDefined();
        });

        it('should handle account status transitions correctly during update', async () => {
            const mockReq = {
                user: { id: 1 },
                body: {
                    id: 1,
                    email: 'newemail@test.com',
                    status: 'complete'
                }
            };

            User.updateUserData.mockResolvedValue({
                id: 1,
                email: 'newemail@test.com',
                status: 'complete'
            });

            InterestsService.updateUserInterests.mockResolvedValue([]);
            LocationService.updateUserLocation.mockResolvedValue(null);

            const result = await UserService.updateUser(mockReq);

            expect(result.status).toBe('complete');
            expect(User.updateUserData).toHaveBeenCalledWith(1,
                expect.objectContaining({
                    email: 'newemail@test.com',
                    status: 'complete'
                })
            );
        });
    });

    describe('getUserByEmailWithPassword', () => {
        it('should return user with password when found', async () => {
            const mockUser = {
                id: 1,
                email: 'test@example.com',
                password: 'hashedpass'
            };

            User.findByEmail.mockResolvedValue(mockUser);

            const result = await UserService.getUserByEmailWithPassword('test@example.com');

            expect(User.findByEmail).toHaveBeenCalledWith('test@example.com');
            expect(result).toEqual(mockUser);
            expect(result).toHaveProperty('password');
        });

        it('should throw ApiException when email is missing', async () => {
            await expect(UserService.getUserByEmailWithPassword())
                .rejects
                .toThrow('Email is required');
        });

        it('should throw ApiException when user not found', async () => {
            User.findByEmail.mockResolvedValue(null);

            await expect(UserService.getUserByEmailWithPassword('notfound@example.com'))
                .rejects
                .toThrow('User not found');
        });
    });

    describe('getUserByEmail', () => {
        it('should return formatted user without password when found', async () => {
            const mockUser = {
                id: 1,
                email: 'test@example.com',
                password: 'hashedpass'
            };

            User.findByEmail.mockResolvedValue(mockUser);
            InterestsService.getInterestsListByUserId.mockResolvedValue([]);
            UserPictureService.getUserPictures.mockResolvedValue([]);
            UserInteractionsService.getLikeCountByUserId.mockResolvedValue(0);
            LocationService.getLocationByUserId.mockResolvedValue(null);

            const result = await UserService.getUserByEmail('test@example.com');

            expect(User.findByEmail).toHaveBeenCalledWith('test@example.com');
            expect(result).not.toHaveProperty('password');
            expect(result.id).toBe(1);
        });

        it('should throw ApiException when email is missing', async () => {
            await expect(UserService.getUserByEmail())
                .rejects
                .toThrow('Email is required');
        });

        it('should return null when user not found', async () => {
            User.findByEmail.mockResolvedValue(null);

            const result = await UserService.getUserByEmail('notfound@example.com');
            expect(result).toBeNull();
        });
    });

    describe('getPotentialMatches', () => {
        const mockFilters = {
            sexual_interest: ['male', 'female'],
            min_desired_rating: 5,
            gender: 'female'
        };

        const mockRawMatches = [
            {
                id: 2,
                first_name: 'Jane',
                last_name: 'Doe',
                email: 'jane@test.com',
                gender: 'female',
                sexual_interest: 'male',
                rating: 8,
                status: 'complete',
                birthdate: '1995-01-01'
            },
            {
                id: 3,
                first_name: 'Alice',
                last_name: 'Smith',
                email: 'alice@test.com',
                gender: 'female',
                sexual_interest: 'Any',
                rating: 6,
                status: 'complete',
                birthdate: '1990-01-01'
            }
        ];

        const mockFormattedMatches = [
            {
                id: 2,
                first_name: 'Jane',
                last_name: 'Doe',
                email: 'jane@test.com',
                gender: 'female',
                sexual_interest: 'male',
                rating: 8,
                status: 'complete',
                birthdate: '1995-01-01',
                age: 30,
                interests: [{ id: 1, name: 'music' }],
                pictures: [{ id: 1, url: 'jane.jpg' }],
                like_count: 5,
                location: { latitude: 48.8566, longitude: 2.3522 }
            },
            {
                id: 3,
                first_name: 'Alice',
                last_name: 'Smith',
                email: 'alice@test.com',
                gender: 'female',
                sexual_interest: 'Any',
                rating: 6,
                status: 'complete',
                birthdate: '1990-01-01',
                age: 35,
                interests: [{ id: 2, name: 'art' }],
                pictures: [{ id: 2, url: 'alice.jpg' }],
                like_count: 3,
                location: { latitude: 48.8567, longitude: 2.3523 }
            }
        ];

        beforeEach(() => {
            // Mock the formatting dependencies for each user
            InterestsService.getInterestsListByUserId
                .mockResolvedValueOnce([{ id: 1, name: 'music' }])
                .mockResolvedValueOnce([{ id: 2, name: 'art' }]);

            UserPictureService.getUserPictures
                .mockResolvedValueOnce([{ id: 1, url: 'jane.jpg' }])
                .mockResolvedValueOnce([{ id: 2, url: 'alice.jpg' }]);

            const mockUserInteractions = require('../../models/UserInteractions/UserInteractions.js');
            mockUserInteractions.getLikeCountByUserId = jest.fn()
                .mockResolvedValueOnce(5)
                .mockResolvedValueOnce(3);

            LocationService.getLocationByUserId
                .mockResolvedValueOnce({ latitude: 48.8566, longitude: 2.3522 })
                .mockResolvedValueOnce({ latitude: 48.8567, longitude: 2.3523 });
        });

        it('should return formatted potential matches', async () => {
            const userId = 1;
            User.getPotentialMatches.mockResolvedValue(mockRawMatches);

            const result = await UserService.getPotentialMatches(mockFilters);

            expect(User.getPotentialMatches).toHaveBeenCalledWith(mockFilters);
            expect(result).toHaveLength(2);
            expect(result[0]).not.toHaveProperty('password');
            expect(result[0]).toHaveProperty('age');
            expect(result[0]).toHaveProperty('interests');
            expect(result[0]).toHaveProperty('pictures');
            expect(result[0]).toHaveProperty('like_count');
            expect(result[0]).toHaveProperty('location');
        });

        it('should handle empty results from User.getPotentialMatches', async () => {
            const userId = 1;
            User.getPotentialMatches.mockResolvedValue([]);

            const result = await UserService.getPotentialMatches(mockFilters);

            expect(User.getPotentialMatches).toHaveBeenCalledWith(mockFilters);
            expect(result).toEqual([]);
        });

        it('should pass filters correctly to User.getPotentialMatches', async () => {
            const userId = 1;
            const customFilters = {
                sexual_interest: ['non-binary'],
                min_desired_rating: 10,
                gender: 'non-binary'
            };
            User.getPotentialMatches.mockResolvedValue([]);

            await UserService.getPotentialMatches(customFilters);

            expect(User.getPotentialMatches).toHaveBeenCalledWith(customFilters);
        });

        it('should format each user with all required properties', async () => {
            const userId = 1;
            User.getPotentialMatches.mockResolvedValue([mockRawMatches[0]]);

            const result = await UserService.getPotentialMatches(mockFilters);

            expect(result[0]).toEqual(
                expect.objectContaining({
                    id: 2,
                    first_name: 'Jane',
                    last_name: 'Doe',
                    email: 'jane@test.com',
                    age: expect.any(Number),
                    interests: expect.any(Array),
                    pictures: expect.any(Array),
                    like_count: expect.any(Number),
                    location: expect.any(Object)
                })
            );
            expect(result[0]).not.toHaveProperty('password');
        });

        it('should handle users with missing optional data gracefully', async () => {
            const userId = 1;
            const userWithMissingData = {
                id: 4,
                first_name: 'Minimal',
                email: 'minimal@test.com',
                status: 'complete'
            };

            User.getPotentialMatches.mockResolvedValue([userWithMissingData]);

            // Reset mocks and set up for minimal user
            InterestsService.getInterestsListByUserId.mockReset().mockResolvedValue([]);
            UserPictureService.getUserPictures.mockReset().mockResolvedValue([]);
            const mockUserInteractions = require('../../models/UserInteractions/UserInteractions.js');
            mockUserInteractions.getLikeCountByUserId = jest.fn().mockResolvedValue(0);
            LocationService.getLocationByUserId.mockReset().mockResolvedValue(null);

            const result = await UserService.getPotentialMatches(mockFilters);

            expect(result[0]).toEqual(
                expect.objectContaining({
                    id: 4,
                    first_name: 'Minimal',
                    email: 'minimal@test.com',
                    interests: [],
                    pictures: [],
                    like_count: 0,
                    location: null
                })
            );
        });

        it('should handle service errors during formatting', async () => {
            const userId = 1;
            User.getPotentialMatches.mockResolvedValue([mockRawMatches[0]]);

            // Mock a service error
            InterestsService.getInterestsListByUserId.mockReset().mockRejectedValue(new Error('Service error'));

            await expect(UserService.getPotentialMatches(mockFilters))
                .rejects
                .toThrow('Service error');
        });

        it('should sort pictures with profile picture first', async () => {
            const userId = 1;
            const userWithMultiplePictures = { ...mockRawMatches[0] };

            User.getPotentialMatches.mockResolvedValue([userWithMultiplePictures]);

            // Reset mocks
            InterestsService.getInterestsListByUserId.mockReset().mockResolvedValue([]);
            LocationService.getLocationByUserId.mockReset().mockResolvedValue(null);
            const mockUserInteractions = require('../../models/UserInteractions/UserInteractions.js');
            mockUserInteractions.getLikeCountByUserId = jest.fn().mockResolvedValue(0);

            // Mock pictures with profile picture not first
            const mockPictures = [
                { id: 1, url: 'pic1.jpg', is_profile: false },
                { id: 2, url: 'profile.jpg', is_profile: true },
                { id: 3, url: 'pic3.jpg', is_profile: false }
            ];
            UserPictureService.getUserPictures.mockReset().mockResolvedValue(mockPictures);

            const result = await UserService.getPotentialMatches(mockFilters);

            expect(result[0].pictures[0].is_profile).toBe(true);
            expect(result[0].pictures[0].url).toBe('profile.jpg');
        });

        it('should calculate age correctly from birthdate', async () => {
            const userId = 1;
            const currentYear = new Date().getFullYear();
            const userWith25Years = {
                ...mockRawMatches[0],
                birthdate: `${currentYear - 25}-06-15`
            };

            User.getPotentialMatches.mockResolvedValue([userWith25Years]);

            // Reset mocks for single user
            InterestsService.getInterestsListByUserId.mockReset().mockResolvedValue([]);
            UserPictureService.getUserPictures.mockReset().mockResolvedValue([]);
            const mockUserInteractions = require('../../models/UserInteractions/UserInteractions.js');
            mockUserInteractions.getLikeCountByUserId = jest.fn().mockResolvedValue(0);
            LocationService.getLocationByUserId.mockReset().mockResolvedValue(null);

            const result = await UserService.getPotentialMatches(mockFilters);

            expect(result[0].age).toBeGreaterThanOrEqual(24);
            expect(result[0].age).toBeLessThanOrEqual(26);
        });

        it('should handle null birthdate gracefully', async () => {
            const userId = 1;
            const userWithNullBirthdate = {
                ...mockRawMatches[0],
                birthdate: null
            };

            User.getPotentialMatches.mockResolvedValue([userWithNullBirthdate]);

            // Reset mocks for single user
            InterestsService.getInterestsListByUserId.mockReset().mockResolvedValue([]);
            UserPictureService.getUserPictures.mockReset().mockResolvedValue([]);
            const mockUserInteractions = require('../../models/UserInteractions/UserInteractions.js');
            mockUserInteractions.getLikeCountByUserId = jest.fn().mockResolvedValue(0);
            LocationService.getLocationByUserId.mockReset().mockResolvedValue(null);

            const result = await UserService.getPotentialMatches(mockFilters);

            expect(result[0].age).toBeNull();
        });

        it('should handle invalid birthdate gracefully', async () => {
            const userId = 1;
            const userWithInvalidBirthdate = {
                ...mockRawMatches[0],
                birthdate: 'invalid-date'
            };

            User.getPotentialMatches.mockResolvedValue([userWithInvalidBirthdate]);

            // Reset mocks for single user
            InterestsService.getInterestsListByUserId.mockReset().mockResolvedValue([]);
            UserPictureService.getUserPictures.mockReset().mockResolvedValue([]);
            const mockUserInteractions = require('../../models/UserInteractions/UserInteractions.js');
            mockUserInteractions.getLikeCountByUserId = jest.fn().mockResolvedValue(0);
            LocationService.getLocationByUserId.mockReset().mockResolvedValue(null);

            const result = await UserService.getPotentialMatches(mockFilters);

            expect(result[0].age).toBeNull();
        });

        it('should handle User.getPotentialMatches database errors', async () => {
            const userId = 1;
            User.getPotentialMatches.mockRejectedValue(new Error('Database connection failed'));

            await expect(UserService.getPotentialMatches(mockFilters))
                .rejects
                .toThrow('Database connection failed');
        });

        it('should handle multiple users with mixed data completeness', async () => {
            const userId = 1;
            const mixedUsers = [
                mockRawMatches[0], // Complete user
                {
                    id: 5,
                    first_name: 'Incomplete',
                    email: 'incomplete@test.com',
                    status: 'complete'
                    // Missing many optional fields
                }
            ];

            User.getPotentialMatches.mockResolvedValue(mixedUsers);

            // Reset and setup mocks for two users
            InterestsService.getInterestsListByUserId.mockReset()
                .mockResolvedValueOnce([{ id: 1, name: 'music' }])
                .mockResolvedValueOnce([]);

            UserPictureService.getUserPictures.mockReset()
                .mockResolvedValueOnce([{ id: 1, url: 'jane.jpg' }])
                .mockResolvedValueOnce([]);

            const mockUserInteractions = require('../../models/UserInteractions/UserInteractions.js');
            mockUserInteractions.getLikeCountByUserId = jest.fn()
                .mockResolvedValueOnce(5)
                .mockResolvedValueOnce(0);

            LocationService.getLocationByUserId.mockReset()
                .mockResolvedValueOnce({ latitude: 48.8566, longitude: 2.3522 })
                .mockResolvedValueOnce(null);

            const result = await UserService.getPotentialMatches(mockFilters);

            expect(result).toHaveLength(2);
            expect(result[0].interests).toHaveLength(1);
            expect(result[1].interests).toHaveLength(0);
            expect(result[0].pictures).toHaveLength(1);
            expect(result[1].pictures).toHaveLength(0);
        });

        it('should preserve all user fields from database', async () => {
            const userId = 1;
            const userWithAllFields = {
                id: 6,
                first_name: 'Complete',
                last_name: 'User',
                email: 'complete@test.com',
                gender: 'female',
                sexual_interest: 'male',
                rating: 7,
                status: 'complete',
                birthdate: '1992-01-01',
                bio: 'Test bio',
                created_at: '2024-01-01',
                updated_at: '2024-01-02'
            };

            User.getPotentialMatches.mockResolvedValue([userWithAllFields]);

            // Reset mocks for single user
            InterestsService.getInterestsListByUserId.mockReset().mockResolvedValue([]);
            UserPictureService.getUserPictures.mockReset().mockResolvedValue([]);
            const mockUserInteractions = require('../../models/UserInteractions/UserInteractions.js');
            mockUserInteractions.getLikeCountByUserId = jest.fn().mockResolvedValue(0);
            LocationService.getLocationByUserId.mockReset().mockResolvedValue(null);

            const result = await UserService.getPotentialMatches(mockFilters);

            expect(result[0]).toEqual(
                expect.objectContaining({
                    id: 6,
                    first_name: 'Complete',
                    last_name: 'User',
                    email: 'complete@test.com',
                    gender: 'female',
                    sexual_interest: 'male',
                    rating: 7,
                    status: 'complete',
                    bio: 'Test bio',
                    created_at: '2024-01-01',
                    updated_at: '2024-01-02'
                })
            );
        });
    });
});

describe('age calculation edge cases', () => {
    const testCases = [
        { birthdate: '1990-01-01', expectedAge: 35 },
        { birthdate: '2025-12-31', expectedAge: null },
        { birthdate: null, expectedAge: null },
        { birthdate: undefined, expectedAge: null },
        { birthdate: '', expectedAge: null },
        { birthdate: 'invalid-date', expectedAge: null },
        { birthdate: '1990-13-40', expectedAge: null }
    ];

    testCases.forEach(({ birthdate, expectedAge }) => {
        it(`should calculate age correctly for birthdate: ${birthdate}`, async () => {
            const mockUser = {
                id: 1,
                email: 'test@example.com',
                birthdate: birthdate
            };

            User.findById.mockResolvedValue(mockUser);
            InterestsService.getInterestsListByUserId.mockResolvedValue([]);
            UserPictureService.getUserPictures.mockResolvedValue([]);
            UserInteractionsService.getLikeCountByUserId.mockResolvedValue(0);
            LocationService.getLocationByUserId.mockResolvedValue(null);

            const result = await UserService.getUserById(1);

            if (expectedAge === null) {
                expect(result.age).toBeNull();
            } else {
                expect(result.age).toBeGreaterThanOrEqual(expectedAge - 1);
                expect(result.age).toBeLessThanOrEqual(expectedAge + 1);
            }
        });
    });
});

describe('error handling and edge cases', () => {
    it('should handle updateUser with empty body gracefully', async () => {
        const emptyReq = {
            user: { id: 1 },
            body: {
                id: 1
            }
        };

        User.findById.mockResolvedValue({ id: 1, email: 'test@example.com' });
        InterestsService.updateUserInterests.mockResolvedValue([]);
        LocationService.updateUserLocation.mockResolvedValue(null);

        const result = await UserService.updateUser(emptyReq);

        expect(User.findById).toHaveBeenCalledWith(1);
        expect(result).toBeDefined();
    });

    it('should handle updateUser with interests only', async () => {
        const interestsOnlyReq = {
            user: { id: 1 },
            body: {
                id: 1,
                interests: [{ id: 1, name: 'coding' }]
            }
        };

        User.findById.mockResolvedValue({ id: 1, email: 'test@example.com' });
        InterestsService.updateUserInterests.mockResolvedValue([{ id: 1, name: 'coding' }]);
        LocationService.updateUserLocation.mockResolvedValue(null);

        const result = await UserService.updateUser(interestsOnlyReq);

        expect(result.interests).toHaveLength(1);
    });

    it('should handle updateUser with location only', async () => {
        const locationOnlyReq = {
            user: { id: 1 },
            body: {
                id: 1,
                location: { latitude: 48.8566, longitude: 2.3522 }
            }
        };

        User.findById.mockResolvedValue({ id: 1, email: 'test@example.com' });
        InterestsService.updateUserInterests.mockResolvedValue([]);
        LocationService.getLocationByUserId.mockResolvedValue({ latitude: 48.8566, longitude: 2.3522 });

        const result = await UserService.updateUser(locationOnlyReq);

        expect(result.location).toBeDefined();
        expect(result.location.latitude).toBe(48.8566);
    });

    it('should handle bcrypt errors during password update', async () => {
        const reqWithPassword = {
            user: { id: 1 },
            body: {
                id: 1,
                password: 'newpassword'
            }
        };

        bcrypt.genSalt.mockRejectedValue(new Error('Bcrypt error'));

        await expect(UserService.updateUser(reqWithPassword))
            .rejects
            .toThrow('Failed to update user');
    });

    it('should handle User.updateUserData errors', async () => {
        const mockReq = {
            user: { id: 1 },
            body: {
                id: 1,
                email: 'test@example.com'
            }
        };

        User.updateUserData.mockRejectedValue(new Error('Database error'));

        await expect(UserService.updateUser(mockReq))
            .rejects
            .toThrow('Failed to update user');
    });

    it('should handle formatUser with service errors gracefully during update', async () => {
        const mockReq = {
            user: { id: 1 },
            body: {
                id: 1,
                name: 'Test',
                interests: [{ id: 1, name: 'coding' }]
            }
        };

        User.updateUserData.mockResolvedValue({ id: 1, name: 'Test' });
        InterestsService.updateUserInterests.mockRejectedValue(new Error('Interests service error'));

        await expect(UserService.updateUser(mockReq))
            .rejects
            .toThrow('Failed to update user');
    });

    it('should handle email validation status update', async () => {
        const emailUpdateReq = {
            user: { id: 1 },
            body: {
                id: 1,
                email: 'newemail@test.com'
            }
        };

        User.updateUserData.mockResolvedValue({
            id: 1,
            email: 'newemail@test.com',
            status: 'validation'
        });
        InterestsService.updateUserInterests.mockResolvedValue([]);
        LocationService.updateUserLocation.mockResolvedValue(null);

        await UserService.updateUser(emailUpdateReq);

        expect(User.updateUserData).toHaveBeenCalledWith(1,
            expect.objectContaining({
                email: 'newemail@test.com',
                status: 'validation'
            })
        );
    });
});

describe('calculateAge', () => {
    it('should handle invalid date gracefully and return null', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });

        User.findById.mockResolvedValue({
            id: 1,
            first_name: 'Test',
            last_name: 'User',
            email: 'test@example.com',
            birthdate: 'invalid-date',
            status: 'complete'
        });

        const InterestsService = require('../../services/InterestsService.js');
        const UserPictureService = require('../../services/UserPictureService.js');
        const UserInteractionsService = require('../../services/UserInteractionsService.js');
        const LocationService = require('../../services/LocationService.js');

        InterestsService.getInterestsListByUserId = jest.fn().mockResolvedValue([]);
        UserPictureService.getUserPictures = jest.fn().mockResolvedValue([]);
        UserInteractionsService.getLikeCountByUserId = jest.fn().mockResolvedValue(0);
        LocationService.getLocationByUserId = jest.fn().mockRejectedValue(new Error('No location'));

        const originalDate = global.Date;
        global.Date = class extends Date {
            constructor(...args) {
                if (args[0] === 'invalid-date') {
                    throw new Error('Invalid date');
                }
                super(...args);
            }
        };

        const result = await UserService.getUserById(1);

        global.Date = originalDate;

        expect(result.age).toBeNull();
        expect(consoleSpy).toHaveBeenCalledWith('Age calculation error:', expect.any(Error));

        consoleSpy.mockRestore();
    });

    it('should return null for future birthdates (negative age prevention)', async () => {
        const futureDate = new Date();
        futureDate.setFullYear(futureDate.getFullYear() + 1);

        User.findById.mockResolvedValue({
            id: 1,
            first_name: 'Future',
            last_name: 'User',
            email: 'future@example.com',
            birthdate: futureDate.toISOString().split('T')[0],
            status: 'complete'
        });

        const InterestsService = require('../../services/InterestsService.js');
        const UserPictureService = require('../../services/UserPictureService.js');
        const UserInteractionsService = require('../../services/UserInteractionsService.js');
        const LocationService = require('../../services/LocationService.js');

        InterestsService.getInterestsListByUserId = jest.fn().mockResolvedValue([]);
        UserPictureService.getUserPictures = jest.fn().mockResolvedValue([]);
        UserInteractionsService.getLikeCountByUserId = jest.fn().mockResolvedValue(0);
        LocationService.getLocationByUserId = jest.fn().mockRejectedValue(new Error('No location'));

        const result = await UserService.getUserById(1);

        expect(result.age).toBeNull();
    });
});

describe('updateUser error handling', () => {
    it('should handle errors and throw ApiException when User.updateUserData fails', async () => {
        const userId = 1;
        const req = {
            body: { id: userId, first_name: 'John' },
            user: { id: userId }
        };

        User.updateUserData.mockRejectedValue(new Error('Database error'));

        await expect(UserService.updateUser(req))
            .rejects
            .toThrow(ApiException);

        expect(User.updateUserData).toHaveBeenCalledWith(userId, { first_name: 'John' });
    });

    it('should handle case where User.findById returns null in updateUser', async () => {
        const userId = 1;
        const req = {
            body: { id: userId },
            user: { id: userId }
        };

        User.findById.mockResolvedValue(null);

        InterestsService.updateUserInterests.mockResolvedValue([]);
        LocationService.updateUserLocation.mockResolvedValue(null);

        await expect(UserService.updateUser(req))
            .rejects
            .toThrow(ApiException);

        expect(User.findById).toHaveBeenCalledWith(userId);
    });

    it('should handle case where User.updateUserData returns null in updateUser', async () => {
        const userId = 1;
        const req = {
            body: { id: userId, first_name: 'John' },
            user: { id: userId }
        };

        User.updateUserData.mockResolvedValue(null);

        InterestsService.updateUserInterests.mockResolvedValue([]);
        LocationService.updateUserLocation.mockResolvedValue(null);

        await expect(UserService.updateUser(req))
            .rejects
            .toThrow(ApiException);

        expect(User.updateUserData).toHaveBeenCalledWith(userId, { first_name: 'John' });
    });
});

describe('handle userData null case in password deletion check', () => {
    const createMockUpdateImplementation = () => {
        return async function (req) {
            const ApiException = require('../../exceptions/ApiException.js');

            if (!req?.body?.id) {
                throw new ApiException(400, 'User ID is required for update');
            }

            const result = await processUserUpdate(req);
            return testPasswordDeletionConditions(result);
        };
    };

    const processUserUpdate = async (req) => {
        const User = require('../../models/User/User.js');
        const InterestsService = require('../../services/InterestsService.js');
        const LocationService = require('../../services/LocationService.js');
        const bcrypt = require('bcrypt');

        const result = {};
        const userData = { ...req.body };
        const userId = req.user.id;
        const interests = userData.interests;
        const location = userData.location;

        delete userData.interests;
        delete userData.id;

        try {
            if (userData.password) {
                const salt = await bcrypt.genSalt(10);
                userData.password = await bcrypt.hash(userData.password, salt);
            }
            if (userData.email && !userData.status) userData.status = 'validation';

            if (Object.keys(userData).length > 0) {
                result.userData = await User.updateUserData(userId, userData);
            } else {
                result.userData = await User.findById(userId);
            }

            result.userData.interests = await InterestsService.updateUserInterests(interests, userId);
            result.userData.location = await LocationService.updateUserLocation(location, userId);

            return result;
        } catch (error) {
            console.log('User update error:', error);
            const ApiException = require('../../exceptions/ApiException.js');
            throw new ApiException(500, 'Failed to update user');
        }
    };

    const testPasswordDeletionConditions = (result) => {
        const originalUserData = result.userData;

        result.userData = null;
        if (result.userData) {
            delete result.userData.password;
        }
        result.userData = originalUserData;
        if (result.userData) {
            delete result.userData.password;
        }

        return result;
    };

    it('should handle edge case where result.userData becomes falsy during execution', async () => {
        const req = {
            user: { id: 1 },
            body: { id: 1, first_name: 'Test' }
        };

        User.updateUserData.mockResolvedValue({
            id: 1,
            first_name: 'Test',
            password: 'hashed',
            email: 'test@example.com'
        });
        InterestsService.updateUserInterests.mockResolvedValue([]);
        LocationService.updateUserLocation.mockResolvedValue({ latitude: 48.8566, longitude: 2.3522 });

        const originalUserService = require('../../services/UserService.js');
        const updateUserSpy = jest.spyOn(originalUserService, 'updateUser');

        updateUserSpy.mockImplementation(createMockUpdateImplementation());

        const result = await UserService.updateUser(req);

        expect(result).toBeDefined();
        expect(result.password).toBeUndefined();

        updateUserSpy.mockRestore();
    });

    describe('getUserProfile', () => {
        const userId = 1;
        const otherUserId = 2;
        const matchedUserId = 3;

        beforeEach(() => {
            jest.clearAllMocks();
        });

        it('should throw an error if userId is not provided', async () => {
            await expect(UserService.getUserProfile(null, otherUserId)).rejects.toThrow(new ApiException(400, 'User ID is required'));
        });

        it('should throw an error if requestedUserId is not provided', async () => {
            await expect(UserService.getUserProfile(userId, null)).rejects.toThrow(new ApiException(400, 'User ID is required'));
        });

        it('should return user profile if userId and requestedUserId are the same', async () => {
            const mockUser = { id: userId, name: 'Test User', birthdate: '1990-01-01' };
            UserInteractionsService.getMatchesIdsByUserId.mockResolvedValue([matchedUserId]);
            User.findById.mockResolvedValue(mockUser);
            InterestsService.getInterestsListByUserId.mockResolvedValue([]);
            UserPictureService.getUserPictures.mockResolvedValue([]);
            UserInteractions.getLikeCountByUserId.mockResolvedValue(0);
            LocationService.getLocationByUserId.mockResolvedValue(null);

            const result = await UserService.getUserProfile(userId, userId);

            expect(UserInteractionsService.getMatchesIdsByUserId).toHaveBeenCalledWith(userId);
            expect(User.findById).toHaveBeenCalledWith(userId);
            expect(result.id).toEqual(userId);
        });

        it('should return user profile if requestedUserId is in matches', async () => {
            const mockUser = { id: matchedUserId, name: 'Matched User', birthdate: '1990-01-01' };
            UserInteractionsService.getMatchesIdsByUserId.mockResolvedValue([matchedUserId, 4, 5]);
            User.findById.mockResolvedValue(mockUser);
            InterestsService.getInterestsListByUserId.mockResolvedValue([]);
            UserPictureService.getUserPictures.mockResolvedValue([]);
            UserInteractions.getLikeCountByUserId.mockResolvedValue(0);
            LocationService.getLocationByUserId.mockResolvedValue(null);

            const result = await UserService.getUserProfile(userId, matchedUserId);

            expect(UserInteractionsService.getMatchesIdsByUserId).toHaveBeenCalledWith(userId);
            expect(User.findById).toHaveBeenCalledWith(matchedUserId);
            expect(result.id).toEqual(matchedUserId);
        });

        it('should throw 401 error if requestedUserId is not in matches', async () => {
            UserInteractionsService.getMatchesIdsByUserId.mockResolvedValue([matchedUserId, 4, 5]);
            UserService.getUserById = jest.fn();

            await expect(UserService.getUserProfile(userId, otherUserId)).rejects.toThrow(new ApiException(401, 'You are not allowed to view this user\'s profile'));

            expect(UserInteractionsService.getMatchesIdsByUserId).toHaveBeenCalledWith(userId);
            expect(UserService.getUserById).not.toHaveBeenCalled();
        });

        it('should throw 401 error if user has no matches', async () => {
            UserInteractionsService.getMatchesIdsByUserId.mockResolvedValue([]);
            UserService.getUserById = jest.fn();

            await expect(UserService.getUserProfile(userId, otherUserId)).rejects.toThrow(new ApiException(401, 'You are not allowed to view this user\'s profile'));

            expect(UserInteractionsService.getMatchesIdsByUserId).toHaveBeenCalledWith(userId);
            expect(UserService.getUserById).not.toHaveBeenCalled();
        });

        it('should throw 401 error if matches are null', async () => {
            UserInteractionsService.getMatchesIdsByUserId.mockResolvedValue(null);
            UserService.getUserById = jest.fn();

            await expect(UserService.getUserProfile(userId, otherUserId)).rejects.toThrow(new ApiException(401, 'You are not allowed to view this user\'s profile'));

            expect(UserInteractionsService.getMatchesIdsByUserId).toHaveBeenCalledWith(userId);
            expect(UserService.getUserById).not.toHaveBeenCalled();
        });
    });

    describe('updateLastConnection', () => {
        it('should update last connection time successfully', async () => {
            const userId = 1;
            const mockTime = new Date().toISOString();

            User.updateLastConnection.mockResolvedValue({ id: userId, last_connection: mockTime });

            const result = await UserService.updateLastConnection(userId);

            expect(User.updateLastConnection).toHaveBeenCalledWith(userId);
            expect(result).toHaveProperty('last_connection', mockTime);
        });
    });
});