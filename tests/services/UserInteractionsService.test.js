const UserInteractionsService = require('../../services/UserInteractionsService.js');
const UserInteractions = require('../../models/UserInteractions/UserInteractions.js');
const UserService = require('../../services/UserService.js');
const NotificationService = require('../../services/NotificationService.js');
const ApiException = require('../../exceptions/ApiException.js');

jest.mock('../../models/UserInteractions/UserInteractions.js');
jest.mock('../../services/UserService.js');
jest.mock('../../services/NotificationService.js');

describe('UserInteractionsService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.restoreAllMocks();
    });

    const mockUserService = {
        mockGetUserById: (users) => {
            UserService.getUserById.mockImplementation((id) => {
                const user = users.find(u => u.id === id);
                return Promise.resolve(user);
            });
        },
        mockGetUserByIdSingle: (user) => {
            UserService.getUserById.mockResolvedValue(user);
        },
        mockGetValidUsers: (users) => {
            UserService.getValidUsers.mockResolvedValue(users);
        }
    };

    const mockInteractionService = {
        mockLikedProfiles: (ids = new Set()) => {
            jest.spyOn(UserInteractionsService, 'getLikedProfilesIdsByUserId').mockResolvedValue(ids);
        },
        mockBlockedUsers: (ids = new Set()) => {
            jest.spyOn(UserInteractionsService, 'getBlockedUsersIdsByUserId').mockResolvedValue(ids);
        },
        mockMatches: (matches) => {
            jest.spyOn(UserInteractionsService, 'getMatchesByUserId').mockResolvedValue(matches);
        },
        mockMatchIds: (ids) => {
            jest.spyOn(UserInteractionsService, 'getMatchesIdsByUserId').mockResolvedValue(ids);
        }
    };

    describe('getLikeCountByUserId', () => {
        it('should return like count for a user', async () => {
            const mockCount = 5;
            UserInteractions.getLikeCountByUserId.mockResolvedValue(mockCount);

            const result = await UserInteractionsService.getLikeCountByUserId(1);

            expect(UserInteractions.getLikeCountByUserId).toHaveBeenCalledWith(1);
            expect(result).toBe(mockCount);
        });
    });

    describe('likeUser', () => {
        it('should throw error if user IDs are missing', async () => {
            await expect(UserInteractionsService.likeUser(undefined, 2))
                .rejects
                .toThrow(ApiException);

            await expect(UserInteractionsService.likeUser(1, undefined))
                .rejects
                .toThrow(ApiException);
        });

        it('should throw error if user tries to like themselves', async () => {
            await expect(UserInteractionsService.likeUser(1, 1))
                .rejects
                .toThrow('You cannot like yourself');
        });

        it('should create like and notification if not already liked', async () => {
            const mockLike = { id: 1, user1: 1, user2: 2, interaction_type: 'like' };
            UserInteractions.likeUser.mockResolvedValue(mockLike);
            UserInteractions.getLikesReceivedByUserId.mockResolvedValue([]);

            const result = await UserInteractionsService.likeUser(1, 2);

            expect(UserInteractions.likeUser).toHaveBeenCalledWith(1, 2);
            expect(NotificationService.newLikeNotification).toHaveBeenCalledWith(2, 1);
            expect(result).toEqual(mockLike);
        });

        it('should create match if users like each other', async () => {
            const mockLike = { id: 1, user1: 1, user2: 2, interaction_type: 'like' };
            const mockMatch = { id: 2, user1: 1, user2: 2, interaction_type: 'match' };

            UserInteractions.likeUser.mockResolvedValue(mockLike);
            UserInteractions.getLikesReceivedByUserId.mockResolvedValue([
                { id: 3, user1: 2, user2: 1, interaction_type: 'like' }
            ]);
            UserInteractions.matchUsers.mockResolvedValue(mockMatch);

            const result = await UserInteractionsService.likeUser(1, 2);

            expect(UserInteractions.likeUser).toHaveBeenCalledWith(1, 2);
            expect(UserInteractions.matchUsers).toHaveBeenCalledWith(1, 2);
            expect(NotificationService.newMatchNotification).toHaveBeenCalledWith(1, 2);
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
                { id: 1, user1: 2, user2: 1, interaction_type: 'view' },
                { id: 2, user1: 3, user2: 1, interaction_type: 'view' }
            ];
            const mockUsers = [
                { id: 2, name: 'User 2' },
                { id: 3, name: 'User 3' }
            ];

            UserInteractions.getProfileViewsByUserId.mockResolvedValue(mockViews);
            mockUserService.mockGetUserById(mockUsers);

            const result = await Promise.all(await UserInteractionsService.getProfileViewsByUserId(1));

            expect(UserInteractions.getProfileViewsByUserId).toHaveBeenCalledWith(1);
            expect(UserService.getUserById).toHaveBeenCalledWith(2);
            expect(UserService.getUserById).toHaveBeenCalledWith(3);
            expect(result).toEqual(mockUsers);
        });
    });

    describe('matchUsers', () => {
        it('should create match and notification', async () => {
            const mockMatch = { id: 1, user1: 1, user2: 2, interaction_type: 'match' };
            UserInteractions.matchUsers.mockResolvedValue(mockMatch);

            const result = await UserInteractionsService.matchUsers(1, 2);

            expect(UserInteractions.matchUsers).toHaveBeenCalledWith(1, 2);
            expect(NotificationService.newMatchNotification).toHaveBeenCalledWith(1, 2);
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
                { id: 1, user1: 1, user2: 2, interaction_type: 'match' },
                { id: 2, user1: 3, user2: 1, interaction_type: 'match' },
                { id: 3, user1: 1, user2: 4, interaction_type: 'match' }
            ];
            const mockBlockedIds = new Set([3]);

            UserInteractions.getMatchesByUserId.mockResolvedValue(mockMatches);
            mockInteractionService.mockBlockedUsers(mockBlockedIds);

            const result = await UserInteractionsService.getMatchesByUserId(1);

            expect(UserInteractions.getMatchesByUserId).toHaveBeenCalledWith(1);
            expect(result).toHaveLength(2);
            expect(result).toEqual([
                { id: 1, user1: 1, user2: 2, interaction_type: 'match' },
                { id: 3, user1: 1, user2: 4, interaction_type: 'match' }
            ]);
        });
    });

    describe('blockUser', () => {
        it('should throw error if user IDs are missing', async () => {
            await expect(UserInteractionsService.blockUser(undefined, 2))
                .rejects
                .toThrow(ApiException);

            await expect(UserInteractionsService.blockUser(1, undefined))
                .rejects
                .toThrow(ApiException);
        });

        it('should throw error if user tries to block themselves', async () => {
            await expect(UserInteractionsService.blockUser(1, 1))
                .rejects
                .toThrow('You cannot block yourself');
        });

        it('should create block and notification', async () => {
            const mockBlock = { id: 1, user1: 1, user2: 2, interaction_type: 'block' };
            UserInteractions.blockUser.mockResolvedValue(mockBlock);

            const result = await UserInteractionsService.blockUser(1, 2);

            expect(UserInteractions.blockUser).toHaveBeenCalledWith(1, 2);
            expect(NotificationService.newBlockNotification).toHaveBeenCalledWith(2, 1);
            expect(result).toEqual(mockBlock);
        });
    });

    describe('getPotentialMatches', () => {
        it('should return filtered potential matches', async () => {
            const mockUser = {
                id: 1,
                gender: 'Male',
                sexual_interest: 'Female',
                interests: [{ id: 1, name: 'Music' }, { id: 2, name: 'Art' }]
            };
            const mockValidUsers = [
                {
                    id: 2,
                    gender: 'Female',
                    sexual_interest: 'Male',
                    interests: [{ id: 1, name: 'Music' }]
                },
                {
                    id: 3,
                    gender: 'Female',
                    sexual_interest: 'Female',
                    interests: [{ id: 1, name: 'Music' }]
                },
                {
                    id: 4,
                    gender: 'Female',
                    sexual_interest: 'Male',
                    interests: [{ id: 3, name: 'Sports' }]
                }
            ];

            mockUserService.mockGetUserByIdSingle(mockUser);
            mockUserService.mockGetValidUsers(mockValidUsers);
            mockInteractionService.mockLikedProfiles();
            mockInteractionService.mockBlockedUsers();
            UserInteractions.getLikesReceivedByUserId.mockResolvedValue([]);

            const result = await UserInteractionsService.getPotentialMatches(1);

            expect(result).toHaveLength(1);
            expect(result[0].id).toBe(2);
            expect(result[0].liked_me).toBe(false);
        });

        it('should handle specific sexual preference (not Any)', async () => {
            const mockUserId = 1;
            const mockUserData = {
                id: mockUserId,
                sexual_interest: 'Female',
                gender: 'Male',
                interests: [{ id: 1, name: 'coding' }]
            };

            const mockValidUsers = [
                {
                    id: 2,
                    sexual_interest: 'Male',
                    gender: 'Female',
                    interests: [{ id: 1, name: 'coding' }]
                }
            ];

            mockUserService.mockGetUserByIdSingle(mockUserData);
            mockUserService.mockGetValidUsers(mockValidUsers);
            mockInteractionService.mockLikedProfiles();
            mockInteractionService.mockBlockedUsers();

            const result = await UserInteractionsService.getPotentialMatches(mockUserId);

            expect(result).toHaveLength(1);
            expect(result[0].id).toBe(2);
        });

        it('should handle "Any" sexual preference', async () => {
            const mockUserId = 1;
            const mockUserData = {
                id: mockUserId,
                sexual_interest: 'Any',
                gender: 'Male',
                interests: [{ id: 1, name: 'coding' }]
            };

            const mockValidUsers = [
                {
                    id: 2,
                    sexual_interest: 'Male',
                    gender: 'Female',
                    interests: [{ id: 1, name: 'coding' }]
                },
                {
                    id: 3,
                    sexual_interest: 'Male',
                    gender: 'Male',
                    interests: [{ id: 1, name: 'coding' }]
                },
                {
                    id: 4,
                    sexual_interest: 'Male',
                    gender: 'Other',
                    interests: [{ id: 1, name: 'coding' }]
                }
            ];

            mockUserService.mockGetUserByIdSingle(mockUserData);
            mockUserService.mockGetValidUsers(mockValidUsers);
            mockInteractionService.mockLikedProfiles();
            mockInteractionService.mockBlockedUsers();

            const result = await UserInteractionsService.getPotentialMatches(mockUserId);

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

            mockInteractionService.mockMatchIds(mockMatchIds);
            mockUserService.mockGetUserById(mockUsers);

            const result = await UserInteractionsService.getMatchesAsUsersByUserId(1);

            expect(result).toEqual(mockUsers);
            expect(UserService.getUserById).toHaveBeenCalledWith(2);
            expect(UserService.getUserById).toHaveBeenCalledWith(3);
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
                { user1: 1, user2: 2 },
                { user1: 1, user2: 3 }
            ];

            UserInteractions.getLikesGivenByUserId.mockResolvedValue(mockLikes);

            const result = await UserInteractionsService.getLikedProfilesIdsByUserId(1);

            expect(UserInteractions.getLikesGivenByUserId).toHaveBeenCalledWith(1);
            expect(result instanceof Set).toBe(true);
            expect(result.has(2)).toBe(true);
            expect(result.has(3)).toBe(true);
        });
    });

    describe('getBlockedUsersIdsByUserId', () => {
        it('should throw error if user ID is missing', async () => {
            await expect(UserInteractionsService.getBlockedUsersIdsByUserId())
                .rejects
                .toThrow(ApiException);
        });

        it('should return set of blocked user IDs', async () => {
            const mockBlocks = [
                { user1: 1, user2: 2 },
                { user1: 3, user2: 1 }
            ];

            UserInteractions.getBlockedUsersByUserId.mockResolvedValue(mockBlocks);

            const result = await UserInteractionsService.getBlockedUsersIdsByUserId(1);

            expect(UserInteractions.getBlockedUsersByUserId).toHaveBeenCalledWith(1);
            expect(result instanceof Set).toBe(true);
            expect(result.has(2)).toBe(true);
            expect(result.has(3)).toBe(true);
            expect(result.has(1)).toBe(false);
        });
    });

    describe('getMatchesIdsByUserId', () => {
        it('should return array of user IDs from matches where current user is user1', async () => {
            const userId = 1;
            const mockMatches = [
                { user1: 1, user2: 2 },
                { user1: 1, user2: 3 }
            ];

            mockInteractionService.mockMatches(mockMatches);

            const result = await UserInteractionsService.getMatchesIdsByUserId(userId);

            expect(result).toEqual([2, 3]);
            expect(UserInteractionsService.getMatchesByUserId).toHaveBeenCalledWith(userId);
        });

        it('should return array of user IDs from matches where current user is user2', async () => {
            const userId = 2;
            const mockMatches = [
                { user1: 1, user2: 2 },
                { user1: 3, user2: 2 }
            ];

            mockInteractionService.mockMatches(mockMatches);

            const result = await UserInteractionsService.getMatchesIdsByUserId(userId);

            expect(result).toEqual([1, 3]);
            expect(UserInteractionsService.getMatchesByUserId).toHaveBeenCalledWith(userId);
        });

        it('should return empty array when no matches found', async () => {
            const userId = 1;

            mockInteractionService.mockMatches([]);

            const result = await UserInteractionsService.getMatchesIdsByUserId(userId);

            expect(result).toEqual([]);
            expect(UserInteractionsService.getMatchesByUserId).toHaveBeenCalledWith(userId);
        });

        it('should handle mixed matches correctly', async () => {
            const userId = 2;
            const mockMatches = [
                { user1: 1, user2: 2 },
                { user1: 2, user2: 3 },
                { user1: 4, user2: 2 }
            ];

            mockInteractionService.mockMatches(mockMatches);

            const result = await UserInteractionsService.getMatchesIdsByUserId(userId);

            expect(result).toEqual([1, 3, 4]);
            expect(UserInteractionsService.getMatchesByUserId).toHaveBeenCalledWith(userId);
        });
    });
});