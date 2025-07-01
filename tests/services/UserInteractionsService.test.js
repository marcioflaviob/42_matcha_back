const UserInteractionsService = require('../../services/UserInteractionsService.js');
const UserInteractions = require('../../models/UserInteractions/UserInteractions.js');
const UserService = require('../../services/UserService.js');
const NotificationService = require('../../services/NotificationService.js');
const LocationService = require('../../services/LocationService.js');
const InterestsService = require('../../services/InterestsService.js');
const ApiException = require('../../exceptions/ApiException.js');

jest.mock('../../models/UserInteractions/UserInteractions.js');
jest.mock('../../services/NotificationService.js');
jest.mock('../../services/UserService.js');
jest.mock('../../services/LocationService.js');
jest.mock('../../services/InterestsService.js');

describe('UserInteractionsService', () => {
    // Test utilities and helpers
    const testUtils = {
        // Common error test helper
        expectApiExceptionForMissingIds: async (serviceMethod, ...args) => {
            await expect(serviceMethod(...args.map((_, i) => i === 0 ? undefined : args[i])))
                .rejects.toThrow(ApiException);
            await expect(serviceMethod(...args.map((_, i) => i === 1 ? undefined : args[i])))
                .rejects.toThrow(ApiException);
        },

        // Common self-action error test
        expectSelfActionError: async (serviceMethod, errorMessage) => {
            await expect(serviceMethod(1, 1))
                .rejects.toThrow(errorMessage);
        },

        // Common service call expectation helper
        expectServiceCall: (mockFn, methodName, args) => {
            expect(mockFn).toHaveBeenCalledWith(...args);
        },

        // Create mock user data
        createMockUser: (overrides = {}) => ({
            id: 1,
            gender: 'Male',
            sexual_interest: 'Female',
            interests: [{ id: 1, name: 'Music' }],
            min_desired_rating: 0,
            location: { latitude: 48.8566, longitude: 2.3522 },
            ...overrides
        }),

        // Create mock interaction data
        createMockInteraction: (type, overrides = {}) => ({
            id: 1,
            user1: 1,
            user2: 2,
            interaction_type: type,
            ...overrides
        })
    };

    const mockSetup = {
        // Consolidated user service mocking
        userService: {
            mockUserById: (users) => {
                UserService.getUserById.mockImplementation((id) => {
                    const user = Array.isArray(users) ? users.find(u => u.id === id) : users;
                    if (!user) {
                        throw new ApiException(404, 'User not found');
                    }
                    return Promise.resolve(user);
                });
            },
            mockAddFameRating: () => UserService.addFameRating.mockResolvedValue(true),
            mockPotentialMatches: (users) => UserService.getPotentialMatches.mockResolvedValue(users)
        },

        // Consolidated interaction service mocking
        interactions: {
            mockMethod: (method, returnValue) => UserInteractions[method].mockResolvedValue(returnValue),
            mockSpyMethod: (method, returnValue) => jest.spyOn(UserInteractionsService, method).mockResolvedValue(returnValue)
        },

        // Common setup for matching scenarios
        setupMatchingScenario: (user, validUsers, options = {}) => {
            mockSetup.userService.mockUserById(user);
            mockSetup.userService.mockPotentialMatches(validUsers);
            mockSetup.interactions.mockSpyMethod('getLikedProfilesIdsByUserId', options.likedIds || new Set());
            mockSetup.interactions.mockSpyMethod('getBlockedUsersIdsByUserId', options.blockedIds || new Set());
            if (options.receivedLikes) {
                mockSetup.interactions.mockMethod('getLikesReceivedByUserId', options.receivedLikes);
            }
            // Note: LocationService.getLocationByUserId is no longer called in the current implementation
            // Location data is expected to come directly from UserService.getPotentialMatches
        }
    };

    beforeEach(() => {
        jest.clearAllMocks();
        jest.restoreAllMocks();
        LocationService.calculateDistance.mockReturnValue(5); // 5km, within the 10km limit
        LocationService.getLocationByUserId.mockResolvedValue({ latitude: 48.8566, longitude: 2.3522 });
        InterestsService.getInterestsListByUserId.mockResolvedValue([{ id: 1, name: 'Music' }]);
    });

    describe('getLikeCountByUserId', () => {
        it('should return like count for a user', async () => {
            const mockCount = 5;
            mockSetup.interactions.mockMethod('getLikeCountByUserId', mockCount);

            const result = await UserInteractionsService.getLikeCountByUserId(1);

            testUtils.expectServiceCall(UserInteractions.getLikeCountByUserId, 'getLikeCountByUserId', [1]);
            expect(result).toBe(mockCount);
        });
    });

    describe('likeUser', () => {
        it('should throw error if user IDs are missing', async () => {
            await testUtils.expectApiExceptionForMissingIds(UserInteractionsService.likeUser, 1, 2);
        });

        it('should throw error if user tries to like themselves', async () => {
            await testUtils.expectSelfActionError(UserInteractionsService.likeUser, 'You cannot like yourself');
        });

        it('should create like and notification if not already liked', async () => {
            const mockLike = testUtils.createMockInteraction('like');
            mockSetup.interactions.mockMethod('likeUser', mockLike);
            mockSetup.interactions.mockMethod('getLikesReceivedByUserId', []);
            mockSetup.userService.mockAddFameRating();

            const result = await UserInteractionsService.likeUser(1, 2);

            testUtils.expectServiceCall(UserInteractions.likeUser, 'likeUser', [1, 2]);
            testUtils.expectServiceCall(NotificationService.newLikeNotification, 'newLikeNotification', [2, 1]);
            testUtils.expectServiceCall(UserService.addFameRating, 'addFameRating', [2, 10]);
            expect(result).toEqual(mockLike);
        });

        it('should create match if users like each other', async () => {
            const mockLike = testUtils.createMockInteraction('like');
            const mockMatch = testUtils.createMockInteraction('match', { id: 2 });

            mockSetup.interactions.mockMethod('likeUser', mockLike);
            mockSetup.interactions.mockMethod('getLikesReceivedByUserId', [
                testUtils.createMockInteraction('like', { id: 3, user1: 2, user2: 1 })
            ]);
            mockSetup.interactions.mockMethod('matchUsers', mockMatch);
            mockSetup.userService.mockAddFameRating();

            const result = await UserInteractionsService.likeUser(1, 2);

            testUtils.expectServiceCall(UserInteractions.likeUser, 'likeUser', [1, 2]);
            testUtils.expectServiceCall(UserInteractions.matchUsers, 'matchUsers', [1, 2]);
            testUtils.expectServiceCall(NotificationService.newMatchNotification, 'newMatchNotification', [1, 2]);
            testUtils.expectServiceCall(UserService.addFameRating, 'addFameRating', [2, 10]);
            expect(result).toEqual(mockMatch);
        });
    });

    describe('getProfileViewsByUserId', () => {
        it('should throw error if user ID is missing', async () => {
            await expect(UserInteractionsService.getProfileViewsByUserId())
                .rejects
                .toThrow(ApiException);
        });

        it('should return list of users who viewed the profile', async () => {
            const mockViews = [
                testUtils.createMockInteraction('view', { user1: 2, user2: 1 }),
                testUtils.createMockInteraction('view', { id: 2, user1: 3, user2: 1 })
            ];
            const mockUsers = [
                { id: 2, name: 'User 2' },
                { id: 3, name: 'User 3' }
            ];

            mockSetup.interactions.mockMethod('getProfileViewsByUserId', mockViews);
            mockSetup.userService.mockUserById(mockUsers);

            const result = await UserInteractionsService.getProfileViewsByUserId(1);

            testUtils.expectServiceCall(UserInteractions.getProfileViewsByUserId, 'getProfileViewsByUserId', [1]);
            testUtils.expectServiceCall(UserService.getUserById, 'getUserById', [2]);
            testUtils.expectServiceCall(UserService.getUserById, 'getUserById', [3]);
            expect(result).toEqual(mockUsers);
        });
    });

    describe('matchUsers', () => {
        it('should create match and notification', async () => {
            const mockMatch = testUtils.createMockInteraction('match');
            mockSetup.interactions.mockMethod('matchUsers', mockMatch);

            const result = await UserInteractionsService.matchUsers(1, 2);

            testUtils.expectServiceCall(UserInteractions.matchUsers, 'matchUsers', [1, 2]);
            testUtils.expectServiceCall(NotificationService.newMatchNotification, 'newMatchNotification', [1, 2]);
            expect(result).toEqual(mockMatch);
        });
    });

    describe('getMatchesByUserId', () => {
        it('should throw error if user ID is missing', async () => {
            await expect(UserInteractionsService.getMatchesByUserId())
                .rejects
                .toThrow(ApiException);
        });

        it('should return filtered matches excluding blocked users', async () => {
            const mockMatches = [
                testUtils.createMockInteraction('match'),
                testUtils.createMockInteraction('match', { id: 2, user1: 3, user2: 1 }),
                testUtils.createMockInteraction('match', { id: 3, user2: 4 })
            ];
            const mockBlockedIds = new Set([3]);

            mockSetup.interactions.mockMethod('getMatchesByUserId', mockMatches);
            mockSetup.interactions.mockSpyMethod('getBlockedUsersIdsByUserId', mockBlockedIds);

            const result = await UserInteractionsService.getMatchesByUserId(1);

            testUtils.expectServiceCall(UserInteractions.getMatchesByUserId, 'getMatchesByUserId', [1]);
            expect(result).toHaveLength(2);
            expect(result).toEqual([
                testUtils.createMockInteraction('match'),
                testUtils.createMockInteraction('match', { id: 3, user2: 4 })
            ]);
        });
    });

    describe('blockUser', () => {
        it('should throw error if user IDs are missing', async () => {
            await testUtils.expectApiExceptionForMissingIds(UserInteractionsService.blockUser, 1, 2);
        });

        it('should throw error if user tries to block themselves', async () => {
            await testUtils.expectSelfActionError(UserInteractionsService.blockUser, 'You cannot block yourself');
        });

        it('should create block and notification', async () => {
            const mockBlock = testUtils.createMockInteraction('block');
            mockSetup.interactions.mockMethod('blockUser', mockBlock);
            mockSetup.userService.mockAddFameRating();

            const result = await UserInteractionsService.blockUser(1, 2);

            testUtils.expectServiceCall(UserInteractions.blockUser, 'blockUser', [1, 2]);
            testUtils.expectServiceCall(UserService.addFameRating, 'addFameRating', [2, -10]);
            expect(result).toEqual(mockBlock);
        });
    });

    describe('reportUser', () => {
        it('should throw error if user IDs are missing', async () => {
            await testUtils.expectApiExceptionForMissingIds(UserInteractionsService.reportUser, 1, 2);
        });

        it('should throw error if user tries to report themselves', async () => {
            await testUtils.expectSelfActionError(UserInteractionsService.reportUser, 'You cannot report yourself');
        });

        it('should report user', async () => {
            await UserInteractionsService.reportUser(1, 2);
            testUtils.expectServiceCall(UserService.addFameRating, 'addFameRating', [2, -15]);
            testUtils.expectServiceCall(UserInteractions.blockUser, 'blockUser', [1, 2]);
        });
    })

    describe('unlikeUser', () => {
        it('should throw error if user IDs are missing', async () => {
            await testUtils.expectApiExceptionForMissingIds(UserInteractionsService.unlikeUser, 1, 2);
        });

        it('should throw error if user tries to unlike themselves', async () => {
            await testUtils.expectSelfActionError(UserInteractionsService.unlikeUser, 'You cannot unlike yourself');
        });

        it('should unlike user and send notification', async () => {
            mockSetup.interactions.mockMethod('unlikeUser', true);
            mockSetup.userService.mockAddFameRating();
            await UserInteractionsService.unlikeUser(1, 2);
            testUtils.expectServiceCall(UserInteractions.unlikeUser, 'unlikeUser', [1, 2]);
            testUtils.expectServiceCall(NotificationService.newUnlikeNotification, 'newUnlikeNotification', [2, 1]);
            testUtils.expectServiceCall(UserService.addFameRating, 'addFameRating', [2, -10]);
        });
    });

    describe('getPotentialMatches', () => {
        const createMatchingUser = (id, gender, sexualInterest, interests = [{ id: 1, name: 'Music' }], location = { latitude: 48.8566, longitude: 2.3522 }) =>
            testUtils.createMockUser({
                id,
                gender,
                sexual_interest: sexualInterest,
                interests,
                rating: 5,
                location
            });

        it('should return filtered potential matches with location filtering', async () => {
            const mockUser = testUtils.createMockUser({
                interests: [{ id: 1, name: 'Music' }, { id: 2, name: 'Art' }],
                location: { latitude: 48.8566, longitude: 2.3522 }
            });
            const mockValidUsers = [
                createMatchingUser(2, 'Female', 'Male', [{ id: 1, name: 'Music' }], { latitude: 48.8567, longitude: 2.3523 }), // Close location
                createMatchingUser(3, 'Female', 'Female', [{ id: 1, name: 'Music' }], { latitude: 48.8566, longitude: 2.3522 }), // Same location  
            ];

            mockSetup.setupMatchingScenario(mockUser, mockValidUsers, { receivedLikes: [] });

            const result = await UserInteractionsService.getPotentialMatches(1);

            expect(UserService.getPotentialMatches).toHaveBeenCalledWith({
                userId: 1,
                gender: 'Male',
                sexual_interest: 'Female',
                age: undefined,
                age_range_min: undefined,
                age_range_max: undefined,
                rating: undefined,
                min_desired_rating: 0
            });
            // LocationService.getLocationByUserId is no longer called - location comes from UserService
            expect(LocationService.calculateDistance).toHaveBeenCalledTimes(2); // Only for users with location
            expect(result).toHaveLength(2); // Users 2 and 3 have location and are within radius
            expect(result.map(u => u.id)).toEqual(expect.arrayContaining([2, 3]));
            expect(result[0].liked_me).toBe(false);
        });

        it('should handle users without location data', async () => {
            const mockUser = testUtils.createMockUser({
                location: { latitude: 48.8566, longitude: 2.3522 }
            });
            const mockValidUsers = [
                createMatchingUser(2, 'Female', 'Male', [{ id: 1, name: 'Music' }], { latitude: 48.8566, longitude: 2.3522 }), // With location
            ];

            mockSetup.setupMatchingScenario(mockUser, mockValidUsers, { receivedLikes: [] });

            const result = await UserInteractionsService.getPotentialMatches(1);

            expect(result).toHaveLength(1); // Users with proper location pass through
        });

        it('should handle current user without location', async () => {
            const mockUser = testUtils.createMockUser({
                location: null // No location for current user
            });
            const mockValidUsers = [
                createMatchingUser(2, 'Female', 'Male', [{ id: 1, name: 'Music' }], { latitude: 48.8566, longitude: 2.3522 }),
            ];

            mockSetup.setupMatchingScenario(mockUser, mockValidUsers, { receivedLikes: [] });

            await expect(UserInteractionsService.getPotentialMatches(1))
                .rejects
                .toThrow();
        });

        it('should handle specific sexual preference (not Any)', async () => {
            const mockUser = testUtils.createMockUser({
                sexual_interest: 'Female',
                location: { latitude: 48.8566, longitude: 2.3522 }
            });
            const mockValidUsers = [createMatchingUser(2, 'Female', 'Male')];

            mockSetup.setupMatchingScenario(mockUser, mockValidUsers);

            const result = await UserInteractionsService.getPotentialMatches(1);

            expect(UserService.getPotentialMatches).toHaveBeenCalledWith({
                userId: 1,
                gender: 'Male',
                sexual_interest: 'Female',
                age: undefined,
                age_range_min: undefined,
                age_range_max: undefined,
                rating: undefined,
                min_desired_rating: 0
            });
            expect(result).toHaveLength(1);
            expect(result[0].id).toBe(2);
        });

        it('should handle "Any" sexual preference', async () => {
            const mockUser = testUtils.createMockUser({
                sexual_interest: 'Any',
                location: { latitude: 48.8566, longitude: 2.3522 }
            });
            const mockValidUsers = [
                createMatchingUser(2, 'Female', 'Male'),
                createMatchingUser(3, 'Male', 'Male'),
                createMatchingUser(4, 'Other', 'Male')
            ];

            mockSetup.setupMatchingScenario(mockUser, mockValidUsers);

            const result = await UserInteractionsService.getPotentialMatches(1);

            expect(UserService.getPotentialMatches).toHaveBeenCalledWith({
                userId: 1,
                gender: 'Male',
                sexual_interest: 'Any',
                age: undefined,
                age_range_min: undefined,
                age_range_max: undefined,
                rating: undefined,
                min_desired_rating: 0
            });
            expect(result).toHaveLength(3);
            expect(result.map(u => u.id)).toEqual(expect.arrayContaining([2, 3, 4]));
        });
    });

    describe('getMatchesAsUsersByUserId', () => {
        it('should return matched users with their details', async () => {
            const mockMatchIds = [2, 3];
            const mockUsers = [
                { id: 2, name: 'User 2' },
                { id: 3, name: 'User 3' }
            ];

            mockSetup.interactions.mockSpyMethod('getMatchesIdsByUserId', mockMatchIds);
            mockSetup.userService.mockUserById(mockUsers);

            const result = await UserInteractionsService.getMatchesAsUsersByUserId(1);

            expect(result).toEqual(mockUsers);
            expect(UserService.getUserById).toHaveBeenCalledTimes(mockMatchIds.length);
        });
    });

    describe('getLikedProfilesIdsByUserId', () => {
        it('should throw error if user ID is missing', async () => {
            await expect(UserInteractionsService.getLikedProfilesIdsByUserId())
                .rejects
                .toThrow(ApiException);
        });

        it('should return set of liked user IDs', async () => {
            const mockLikes = [
                { user1: 1, user2: 2 },  // User 1 liked User 2
                { user1: 1, user2: 3 }   // User 1 liked User 3
            ];

            mockSetup.interactions.mockMethod('getLikesGivenByUserId', mockLikes);

            const result = await UserInteractionsService.getLikedProfilesIdsByUserId(1);

            testUtils.expectServiceCall(UserInteractions.getLikesGivenByUserId, 'getLikesGivenByUserId', [1]);
            expect(result instanceof Set).toBe(true);
            expect(result.has(1)).toBe(true);
            expect(result.has(2)).toBe(true);
            expect(result.has(3)).toBe(true);
            expect(result.size).toBe(3);
        });
    });

    describe('getBlockedUsersIdsByUserId', () => {
        it('should throw error if user ID is missing', async () => {
            await expect(UserInteractionsService.getBlockedUsersIdsByUserId())
                .rejects
                .toThrow(ApiException);
        });

        it('should return set of blocked user IDs', async () => {
            const mockBlocked = [
                { user1: 1, user2: 2 },  // User 1 blocked User 2
                { user1: 3, user2: 1 }   // User 3 blocked User 1
            ];

            mockSetup.interactions.mockMethod('getBlockedUsersByUserId', mockBlocked);

            const result = await UserInteractionsService.getBlockedUsersIdsByUserId(1);

            testUtils.expectServiceCall(UserInteractions.getBlockedUsersByUserId, 'getBlockedUsersByUserId', [1]);
            expect(result instanceof Set).toBe(true);
            expect(result.has(2)).toBe(true);
            expect(result.has(3)).toBe(true);
            expect(result.has(1)).toBe(false);
        });
    });

    describe('getMatchesIdsByUserId', () => {
        const testMatchesScenario = (scenario, userId, mockMatches, expectedIds) => {
            it(scenario, async () => {
                mockSetup.interactions.mockSpyMethod('getMatchesByUserId', mockMatches);

                const result = await UserInteractionsService.getMatchesIdsByUserId(userId);

                expect(result).toEqual(expectedIds);
                expect(UserInteractionsService.getMatchesByUserId).toHaveBeenCalledWith(userId);
            });
        };

        testMatchesScenario(
            'should return array of user IDs from matches where current user is user1',
            1,
            [{ user1: 1, user2: 2 }, { user1: 1, user2: 3 }],
            [2, 3]
        );

        testMatchesScenario(
            'should return array of user IDs from matches where current user is user2',
            2,
            [{ user1: 1, user2: 2 }, { user1: 3, user2: 2 }],
            [1, 3]
        );

        testMatchesScenario(
            'should return empty array when no matches found',
            1,
            [],
            []
        );

        testMatchesScenario(
            'should handle mixed matches correctly',
            2,
            [
                { user1: 1, user2: 2 },
                { user1: 2, user2: 3 },
                { user1: 4, user2: 2 }
            ],
            [1, 3, 4]
        );
    });
});