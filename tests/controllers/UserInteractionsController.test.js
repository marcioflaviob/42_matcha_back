const UserInteractionsController = require('../../controllers/UserInteractionsController.js');
const UserInteractionsService = require('../../services/UserInteractionsService.js');
const { createMockReqRes } = require('../utils/testSetup');

jest.mock('../../services/UserInteractionsService.js');

describe('UserInteractionsController', () => {
    let mockReq;
    let mockRes;

    beforeEach(() => {
        jest.clearAllMocks();
        const mocks = createMockReqRes();
        mockReq = mocks.mockReq;
        mockRes = mocks.mockRes;
    });

    describe('getLikeCountByUserId', () => {
        it('should return like count for authenticated user', async () => {
            const mockCount = 5;
            UserInteractionsService.getLikeCountByUserId.mockResolvedValue(mockCount);

            await UserInteractionsController.getLikeCountByUserId(mockReq, mockRes);

            expect(UserInteractionsService.getLikeCountByUserId).toHaveBeenCalledWith(1);
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.send).toHaveBeenCalledWith(mockCount);
        });
    });

    describe('likeUser', () => {
        it('should create a like for another user', async () => {
            const mockLike = { id: 1, user1: 1, user2: 2, interaction_type: 'like' };
            mockReq.params.id = '2';
            UserInteractionsService.likeUser.mockResolvedValue(mockLike);

            await UserInteractionsController.likeUser(mockReq, mockRes);

            expect(UserInteractionsService.likeUser).toHaveBeenCalledWith(1, '2');
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.send).toHaveBeenCalledWith(mockLike);
        });
    });

    describe('getProfileViewsByUserId', () => {
        it('should return profile views for authenticated user', async () => {
            const mockViews = [
                { id: 1, user1: 2, user2: 1, interaction_type: 'view' },
                { id: 2, user1: 3, user2: 1, interaction_type: 'view' }
            ];
            UserInteractionsService.getProfileViewsByUserId.mockResolvedValue(mockViews);

            await UserInteractionsController.getProfileViewsByUserId(mockReq, mockRes);

            expect(UserInteractionsService.getProfileViewsByUserId).toHaveBeenCalledWith(1);
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.send).toHaveBeenCalledWith(mockViews);
        });
    });

    describe('matchUsers', () => {
        it('should create a match with another user', async () => {
            const mockMatch = { id: 1, user1: 1, user2: 2, interaction_type: 'match' };
            mockReq.params.id = '2';
            UserInteractionsService.matchUsers.mockResolvedValue(mockMatch);

            await UserInteractionsController.matchUsers(mockReq, mockRes);

            expect(UserInteractionsService.matchUsers).toHaveBeenCalledWith(1, '2');
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.send).toHaveBeenCalledWith(mockMatch);
        });
    });

    describe('getMatchesByUserId', () => {
        it('should return matches for authenticated user', async () => {
            const mockMatches = [
                { id: 1, user1: 1, user2: 2, interaction_type: 'match' },
                { id: 2, user1: 1, user2: 3, interaction_type: 'match' }
            ];
            UserInteractionsService.getMatchesAsUsersByUserId.mockResolvedValue(mockMatches);

            await UserInteractionsController.getMatchesByUserId(mockReq, mockRes);

            expect(UserInteractionsService.getMatchesAsUsersByUserId).toHaveBeenCalledWith(1);
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.send).toHaveBeenCalledWith(mockMatches);
        });
    });

    describe('getPotentialMatches', () => {
        it('should return potential matches for authenticated user', async () => {
            const mockPotentialMatches = [
                { id: 2, name: 'User 2' },
                { id: 3, name: 'User 3' }
            ];
            UserInteractionsService.getPotentialMatches.mockResolvedValue(mockPotentialMatches);

            await UserInteractionsController.getPotentialMatches(mockReq, mockRes);

            expect(UserInteractionsService.getPotentialMatches).toHaveBeenCalledWith(1);
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.send).toHaveBeenCalledWith(mockPotentialMatches);
        });
    });

    describe('blockUser', () => {
        it('should block another user', async () => {
            const mockBlock = { id: 1, user1: 1, user2: 2, interaction_type: 'block' };
            mockReq.params.id = '2';
            UserInteractionsService.blockUser.mockResolvedValue(mockBlock);

            await UserInteractionsController.blockUser(mockReq, mockRes);

            expect(UserInteractionsService.blockUser).toHaveBeenCalledWith(1, '2');
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.send).toHaveBeenCalledWith(mockBlock);
        });
    });

    describe('getBlockedUsersByUserId', () => {
        it('should return blocked users for authenticated user', async () => {
            const mockBlockedUsers = new Set([2, 3]);
            UserInteractionsService.getBlockedUsersIdsByUserId.mockResolvedValue(mockBlockedUsers);

            await UserInteractionsController.getBlockedUsersByUserId(mockReq, mockRes);

            expect(UserInteractionsService.getBlockedUsersIdsByUserId).toHaveBeenCalledWith(1);
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.send).toHaveBeenCalledWith(mockBlockedUsers);
        });
    });
});