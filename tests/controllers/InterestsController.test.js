const InterestsService = require('../../services/InterestsService');
const InterestsController = require('../../controllers/InterestsController');

jest.mock('../../services/InterestsService');

describe('InterestsController', () => {
    let mockReq, mockRes;

    beforeEach(() => {
        mockReq = {};
        mockRes = {
            send: jest.fn(),
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        jest.clearAllMocks();
    });

    describe('getAllInterests', () => {
        it('should call InterestsService.getAllInterests and send result', async () => {
            const interests = [
                { id: 1, name: 'Reading' },
                { id: 2, name: 'Swimming' },
            ];

            InterestsService.getAllInterests.mockResolvedValue(interests);

            await InterestsController.getAllInterests(mockRes);

            expect(InterestsService.getAllInterests).toHaveBeenCalled();
            expect(mockRes.send).toHaveBeenCalledWith(interests);
        });
    });

    describe('getInterestsByUserId', () => {
        it('should call InterestsService.getInterestsListByUserId with userId and send result', async () => {
            const userId = 10;
            mockReq.params = { userId };
            const interestList = [
                { id: 1, name: 'Coding' },
                { id: 2, name: 'Basketball' },
            ];

            InterestsService.getInterestsListByUserId.mockResolvedValue(interestList);

            await InterestsController.getInterestsByUserId(mockReq, mockRes);

            expect(InterestsService.getInterestsListByUserId).toHaveBeenCalledWith(userId);
            expect(mockRes.send).toHaveBeenCalledWith(interestList);
        });
    });
});
