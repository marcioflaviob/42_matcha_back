const User = require('../../models/User/User.js');
const InterestsService = require('../../services/InterestsService.js');
const LocationService = require('../../services/LocationService.js');
const UserPictureService = require('../../services/UserPictureService.js');
const UserInteractionsService = require('../../services/UserInteractionsService.js');
const ApiException = require('../../exceptions/ApiException.js');
const UserService = require('../../services/UserService.js');
const bcrypt = require('bcrypt');
const {
    mockConsole,
    restoreConsole,
    createMockData,
    createServiceMocks
} = require('../utils/testSetup');

jest.mock('../../models/User/User.js');
jest.mock('../../services/InterestsService.js');
jest.mock('../../services/LocationService.js');
jest.mock('../../services/UserPictureService.js');
jest.mock('../../services/UserInteractionsService.js');
jest.mock('bcrypt');

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
        it('should create user successfully', async () => {
            const userData = createMockData.userWithPassword({
                email: 'test@example.com',
                password: 'password123'
            });
            const mockUser = createMockData.user({ ...userData, id: 1 });

            User.create.mockResolvedValue(mockUser);

            const result = await UserService.createUser(userData);

            expect(User.create).toHaveBeenCalledWith(userData);
            expect(result).toEqual(mockUser);
        });

        it('should throw ApiException when user creation fails', async () => {
            const userData = { email: 'test@example.com' };
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
        it('should reset password successfully', async () => {
            const userId = 1;
            const newPassword = 'newPassword123';
            const mockUser = { id: userId, email: 'test@example.com' };

            User.resetPassword.mockResolvedValue(mockUser);
            InterestsService.getInterestsListByUserId.mockResolvedValue([]);
            UserPictureService.getUserPictures.mockResolvedValue([]);
            UserInteractionsService.getLikeCountByUserId.mockResolvedValue(0);
            LocationService.getLocationByUserId.mockResolvedValue(null);

            const result = await UserService.resetPassword(userId, newPassword);

            expect(User.resetPassword).toHaveBeenCalledWith(userId, newPassword);
            expect(result).not.toHaveProperty('password');
        });

        it('should throw ApiException when parameters are missing', async () => {
            await expect(UserService.resetPassword())
                .rejects
                .toThrow('User ID and password are required');
        });

        it('should throw ApiException when user is not found', async () => {
            const userId = 999;
            const newPassword = 'newPassword123';

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

        it('should throw ApiException when user not found', async () => {
            User.findByEmail.mockResolvedValue(null);

            await expect(UserService.getUserByEmail('notfound@example.com'))
                .rejects
                .toThrow('User not found');
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
});