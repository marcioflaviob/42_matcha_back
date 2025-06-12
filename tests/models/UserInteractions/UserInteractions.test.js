const db = require('../../../config/db.js');
const UserInteractions = require('../../../models/UserInteractions/UserInteractions.js');
const ApiException = require('../../../exceptions/ApiException.js');

jest.mock('../../../config/db.js');

beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => { });
    jest.spyOn(console, 'error').mockImplementation(() => { });
});

afterEach(() => {
    console.log.mockRestore();
    console.error.mockRestore();
});

describe('UserInteractions', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getLikeCountByUserId', () => {
        it('should return the count of likes received by a user', async () => {
            const mockLikes = [
                { id: 1, user1: 2, user2: 1, interaction_type: 'like' },
                { id: 2, user1: 3, user2: 1, interaction_type: 'like' }
            ];

            db.query.mockResolvedValue({ rows: mockLikes });

            const result = await UserInteractions.getLikeCountByUserId(1);

            expect(db.query).toHaveBeenCalledWith(
                'SELECT * FROM user_interactions WHERE user2 = $1 AND interaction_type = $2',
                [1, 'like']
            );
            expect(result).toBe(2);
        });

        it('should handle database errors', async () => {
            db.query.mockRejectedValue(new Error('Database error'));

            await expect(UserInteractions.getLikeCountByUserId(1))
                .rejects
                .toThrow(ApiException);
        });
    });

    describe('getLikesReceivedByUserId', () => {
        it('should return all likes received by a user', async () => {
            const mockLikes = [
                { id: 1, user1: 2, user2: 1, interaction_type: 'like' },
                { id: 2, user1: 3, user2: 1, interaction_type: 'like' }
            ];

            db.query.mockResolvedValue({ rows: mockLikes });

            const result = await UserInteractions.getLikesReceivedByUserId(1);

            expect(db.query).toHaveBeenCalledWith(
                'SELECT * FROM user_interactions WHERE user2 = $1 AND interaction_type = $2',
                [1, 'like']
            );
            expect(result).toEqual(mockLikes);
        });

        it('should handle database errors', async () => {
            db.query.mockRejectedValue(new Error('Database error'));

            await expect(UserInteractions.getLikesReceivedByUserId(1))
                .rejects
                .toThrow(ApiException);
        });
    });

    describe('getLikesGivenByUserId', () => {
        it('should return all likes given by a user', async () => {
            const mockLikes = [
                { id: 1, user1: 1, user2: 2, interaction_type: 'like' },
                { id: 2, user1: 1, user2: 3, interaction_type: 'like' }
            ];

            db.query.mockResolvedValue({ rows: mockLikes });

            const result = await UserInteractions.getLikesGivenByUserId(1);

            expect(db.query).toHaveBeenCalledWith(
                'SELECT * FROM user_interactions WHERE user1 = $1 AND interaction_type = $2',
                [1, 'like']
            );
            expect(result).toEqual(mockLikes);
        });

        it('should handle database errors', async () => {
            db.query.mockRejectedValue(new Error('Database error'));

            await expect(UserInteractions.getLikesGivenByUserId(1))
                .rejects
                .toThrow(ApiException);
        });
    });

    describe('likeUser', () => {
        it('should create a new like interaction', async () => {
            const mockLike = {
                id: 1,
                user1: 1,
                user2: 2,
                interaction_type: 'like'
            };

            db.query.mockResolvedValue({ rows: [mockLike] });

            const result = await UserInteractions.likeUser(1, 2);

            expect(db.query).toHaveBeenCalledWith(
                'INSERT INTO user_interactions (user1, user2, interaction_type) VALUES ($1, $2, $3) RETURNING *',
                [1, 2, 'like']
            );
            expect(result).toEqual(mockLike);
        });

        it('should throw an error if insert fails', async () => {
            db.query.mockResolvedValue({ rows: [] });

            await expect(UserInteractions.likeUser(1, 2))
                .rejects
                .toThrow(ApiException);
        });

        it('should handle database errors', async () => {
            db.query.mockRejectedValue(new Error('Database error'));

            await expect(UserInteractions.likeUser(1, 2))
                .rejects
                .toThrow(ApiException);
        });
    });

    describe('getProfileViewsByUserId', () => {
        it('should return all profile views for a user', async () => {
            const mockViews = [
                { id: 1, user1: 2, user2: 1, interaction_type: 'view' },
                { id: 2, user1: 3, user2: 1, interaction_type: 'view' }
            ];

            db.query.mockResolvedValue({ rows: mockViews });

            const result = await UserInteractions.getProfileViewsByUserId(1);

            expect(db.query).toHaveBeenCalledWith(
                'SELECT * FROM user_interactions WHERE user2 = $1 AND interaction_type = $2',
                [1, 'view']
            );
            expect(result).toEqual(mockViews);
        });

        it('should handle database errors', async () => {
            db.query.mockRejectedValue(new Error('Database error'));

            await expect(UserInteractions.getProfileViewsByUserId(1))
                .rejects
                .toThrow(ApiException);
        });
    });

    describe('matchUsers', () => {
        it('should create a new match interaction', async () => {
            const mockMatch = {
                id: 1,
                user1: 1,
                user2: 2,
                interaction_type: 'match'
            };

            db.query.mockResolvedValue({ rows: [mockMatch] });

            const result = await UserInteractions.matchUsers(1, 2);

            expect(db.query).toHaveBeenCalledWith(
                'INSERT INTO user_interactions (user1, user2, interaction_type) VALUES ($1, $2, $3) RETURNING *',
                [1, 2, 'match']
            );
            expect(result).toEqual(mockMatch);
        });

        it('should throw an error if insert fails', async () => {
            db.query.mockResolvedValue({ rows: [] });

            await expect(UserInteractions.matchUsers(1, 2))
                .rejects
                .toThrow(ApiException);
        });

        it('should handle database errors', async () => {
            db.query.mockRejectedValue(new Error('Database error'));

            await expect(UserInteractions.matchUsers(1, 2))
                .rejects
                .toThrow(ApiException);
        });
    });

    describe('getMatchesByUserId', () => {
        it('should return all matches for a user', async () => {
            const mockMatches = [
                { id: 1, user1: 1, user2: 2, interaction_type: 'match' },
                { id: 2, user1: 3, user2: 1, interaction_type: 'match' }
            ];

            db.query.mockResolvedValue({ rows: mockMatches });

            const result = await UserInteractions.getMatchesByUserId(1);

            expect(db.query).toHaveBeenCalledWith(
                'SELECT * FROM user_interactions WHERE (user1 = $1 OR user2 = $1) AND interaction_type = $2',
                [1, 'match']
            );
            expect(result).toEqual(mockMatches);
        });

        it('should handle database errors', async () => {
            db.query.mockRejectedValue(new Error('Database error'));

            await expect(UserInteractions.getMatchesByUserId(1))
                .rejects
                .toThrow(ApiException);
        });
    });

    describe('blockUser', () => {
        it('should create a new block interaction', async () => {
            const mockBlock = {
                id: 1,
                user1: 1,
                user2: 2,
                interaction_type: 'block'
            };

            db.query.mockResolvedValue({ rows: [mockBlock] });

            const result = await UserInteractions.blockUser(1, 2);

            expect(db.query).toHaveBeenCalledWith(
                'INSERT INTO user_interactions (user1, user2, interaction_type) VALUES ($1, $2, $3) RETURNING *',
                [1, 2, 'block']
            );
            expect(result).toEqual(mockBlock);
        });

        it('should throw an error if insert fails', async () => {
            db.query.mockResolvedValue({ rows: [] });

            await expect(UserInteractions.blockUser(1, 2))
                .rejects
                .toThrow(ApiException);
        });

        it('should handle database errors', async () => {
            db.query.mockRejectedValue(new Error('Database error'));

            await expect(UserInteractions.blockUser(1, 2))
                .rejects
                .toThrow(ApiException);
        });
    });

    describe('getBlockedUsersByUserId', () => {
        it('should return all blocked users for a user', async () => {
            const mockBlocks = [
                { id: 1, user1: 1, user2: 2, interaction_type: 'block' },
                { id: 2, user1: 1, user2: 3, interaction_type: 'block' }
            ];

            db.query.mockResolvedValue({ rows: mockBlocks });

            const result = await UserInteractions.getBlockedUsersByUserId(1);

            expect(db.query).toHaveBeenCalledWith(
                'SELECT * FROM user_interactions WHERE (user1 = $1 OR user2 = $1) AND interaction_type = $2',
                [1, 'block']
            );
            expect(result).toEqual(mockBlocks);
        });

        it('should handle database errors', async () => {
            db.query.mockRejectedValue(new Error('Database error'));

            await expect(UserInteractions.getBlockedUsersByUserId(1))
                .rejects
                .toThrow(ApiException);
        });
    });
});