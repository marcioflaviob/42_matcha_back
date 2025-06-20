const InterestsService = require('../../services/InterestsService');
const Interests = require('../../models/Interests/Interests');
const { mockConsole, restoreConsole } = require('../utils/testSetup');

jest.mock('../../models/Interests/Interests');

beforeEach(() => {
    mockConsole();
});

afterEach(() => {
    restoreConsole();
});

describe('InterestsService', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getAllInterests', () => {
        it('should return all interests', async () => {
            const mockedInterests = [
                { id: 1, name: 'Music' },
                { id: 2, name: 'Travel' }
            ];
            Interests.findAll.mockResolvedValue(mockedInterests);

            const result = await InterestsService.getAllInterests();

            expect(Interests.findAll).toHaveBeenCalled();
            expect(result).toEqual(mockedInterests);
        });
    });

    describe('getInterestsByUserId', () => {
        it('should return interest IDs for a user', async () => {
            const userId = 1;
            const interestIds = [1, 2, 3];
            Interests.findByUserId.mockResolvedValue(interestIds);

            const result = await InterestsService.getInterestsByUserId(userId);

            expect(Interests.findByUserId).toHaveBeenCalledWith(userId);
            expect(result).toEqual(interestIds);
        });
    });

    describe('addInterest', () => {
        it('should add an interest and return the result', async () => {
            const userId = 1;
            const interestId = 2;
            const resultMock = { success: true };

            Interests.addInterest.mockResolvedValue(resultMock);

            const result = await InterestsService.addInterest(userId, interestId);

            expect(Interests.addInterest).toHaveBeenCalledWith(userId, interestId);
            expect(result).toEqual(resultMock);
        });
    });

    describe('removeInterest', () => {
        it('should remove an interest and return the result', async () => {
            const userId = 1;
            const interestId = 2;
            const resultMock = { success: true };

            Interests.removeInterest.mockResolvedValue(resultMock);

            const result = await InterestsService.removeInterest(userId, interestId);

            expect(Interests.removeInterest).toHaveBeenCalledWith(userId, interestId);
            expect(result).toEqual(resultMock);
        });
    });

    describe('removeAllInterests', () => {
        it('should remove all interests for a user and return the result', async () => {
            const userId = 1;
            const resultMock = { success: true };

            Interests.removeAllInterests.mockResolvedValue(resultMock);

            const result = await InterestsService.removeAllInterests(userId);

            expect(Interests.removeAllInterests).toHaveBeenCalledWith(userId);
            expect(result).toEqual(resultMock);
        });
    });

    describe('updateInterests', () => {
        it('should remove all interests and add new ones', async () => {
            const userId = 1;
            const newInterests = [{ id: 1 }, { id: 2 }];
            Interests.removeAllInterests.mockResolvedValue({ success: true });
            Interests.addInterest.mockResolvedValue({ success: true });

            const result = await InterestsService.updateInterests(userId, newInterests);

            expect(Interests.removeAllInterests).toHaveBeenCalledWith(userId);
            expect(Interests.addInterest).toHaveBeenCalledTimes(2);
            expect(Interests.addInterest).toHaveBeenCalledWith(userId, 1);
            expect(Interests.addInterest).toHaveBeenCalledWith(userId, 2);
            expect(result).toBe(true);
        });
    });

    describe('getInterestsNamesByUserId', () => {
        it('should return the names of user interests', async () => {
            const userId = 1;
            const interestIds = [1, 2];
            const allInterests = [
                { id: 1, name: 'Music' },
                { id: 2, name: 'Art' },
                { id: 3, name: 'Sports' },
            ];
            Interests.findByUserId.mockResolvedValue(interestIds);
            Interests.findAll.mockResolvedValue(allInterests);

            const result = await InterestsService.getInterestsNamesByUserId(userId);

            expect(result).toEqual(['Music', 'Art']);
        });

        it('should filter out interest IDs that do not exist', async () => {
            const userId = 1;
            const interestIds = [1, 999];
            const allInterests = [{ id: 1, name: 'Music' }];
            Interests.findByUserId.mockResolvedValue(interestIds);
            Interests.findAll.mockResolvedValue(allInterests);

            const result = await InterestsService.getInterestsNamesByUserId(userId);

            expect(result).toEqual(['Music']);
        });
    });

    describe('getInterestsListByUserId', () => {
        it('should return interest objects with id and name', async () => {
            const userId = 1;
            const interestIds = [1, 2];
            const allInterests = [
                { id: 1, name: 'Music' },
                { id: 2, name: 'Art' }
            ];
            Interests.findByUserId.mockResolvedValue(interestIds);
            Interests.findAll.mockResolvedValue(allInterests);

            const result = await InterestsService.getInterestsListByUserId(userId);

            expect(result).toEqual([
                { id: 1, name: 'Music' },
                { id: 2, name: 'Art' }
            ]);
        });

        it('should throw error if interest ID not found', async () => {
            const userId = 1;
            const interestIds = [1, 999];
            const allInterests = [{ id: 1, name: 'Music' }];
            Interests.findByUserId.mockResolvedValue(interestIds);
            Interests.findAll.mockResolvedValue(allInterests);

            await expect(InterestsService.getInterestsListByUserId(userId)).rejects.toThrow('Interest with ID "999" not found in database');
        });
    });

    describe('updateUserInterests', () => {
        it('should update interests and return the input interests array when given valid array', async () => {
            const userId = 1;
            const newInterests = [{ id: 1 }, { id: 2 }];

            Interests.removeAllInterests.mockResolvedValue({ success: true });
            Interests.addInterest.mockResolvedValue({ success: true });
            Interests.findByUserId.mockResolvedValue([1, 2]);
            Interests.findAll.mockResolvedValue([
                { id: 1, name: 'Music' },
                { id: 2, name: 'Art' }
            ]);

            const result = await InterestsService.updateUserInterests(newInterests, userId);

            expect(result).toEqual(newInterests);
            expect(Interests.removeAllInterests).toHaveBeenCalledWith(userId);
            expect(Interests.addInterest).toHaveBeenCalledTimes(2);
            expect(Interests.addInterest).toHaveBeenCalledWith(userId, 1);
            expect(Interests.addInterest).toHaveBeenCalledWith(userId, 2);
        });

        it('should return undefined when interests parameter is undefined', async () => {
            const userId = 1;
            const interests = undefined;

            const result = await InterestsService.updateUserInterests(interests, userId);

            expect(result).toBeUndefined();
            expect(Interests.removeAllInterests).not.toHaveBeenCalled();
            expect(Interests.addInterest).not.toHaveBeenCalled();
        });

        it('should handle errors during interest update', async () => {
            const userId = 1;
            const newInterests = [{ id: 1 }];
            const error = new Error('Update failed');

            Interests.removeAllInterests.mockRejectedValue(error);

            await expect(InterestsService.updateUserInterests(newInterests, userId))
                .rejects
                .toThrow('Update failed');

            expect(Interests.removeAllInterests).toHaveBeenCalledWith(userId);
            expect(Interests.addInterest).not.toHaveBeenCalled();
        });

        it('should do nothing when interests is not an array', async () => {
            const userId = 1;
            const interests = 'not an array';

            const result = await InterestsService.updateUserInterests(interests, userId);

            expect(result).toBeUndefined();
            expect(Interests.removeAllInterests).not.toHaveBeenCalled();
            expect(Interests.addInterest).not.toHaveBeenCalled();
        });
    });
});
