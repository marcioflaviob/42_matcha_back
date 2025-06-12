const db = require('../../../config/db.js');
const ApiException = require('../../../exceptions/ApiException.js');
const Interests = require('../../../models/Interests/Interests');

jest.mock('../../../config/db.js');

beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => { });
});

afterEach(() => {
    console.log.mockRestore();
});

describe('Interests.findAll', () => {
    it('should return all interests when query succeeds', async () => {
        const fakeRows = [{ id: 1, name: 'Music' }, { id: 2, name: 'Sports' }];
        db.query.mockResolvedValue({ rows: fakeRows });

        const result = await Interests.findAll();
        expect(db.query).toHaveBeenCalledWith('SELECT * FROM interests');
        expect(result).toEqual(fakeRows);
    });

    it('should throw ApiException on db error', async () => {
        db.query.mockRejectedValue(new Error('DB error'));

        const promise = Interests.findAll();
        await expect(promise).rejects.toThrow(ApiException);
        await expect(promise).rejects.toThrow('Failed to fetch interests');
    });
});

describe('Interests.findByUserId', () => {
    const userId = 1;

    it('should return interest IDs for a user', async () => {
        const fakeRows = [{ interest_id: 1 }, { interest_id: 2 }];
        db.query.mockResolvedValue({ rows: fakeRows });

        const result = await Interests.findByUserId(userId);
        expect(db.query).toHaveBeenCalledWith(
            'SELECT interest_id FROM user_interests WHERE user_id = $1',
            [userId]
        );
        expect(result).toEqual([1, 2]);
    });

    it('should throw ApiException on db error', async () => {
        db.query.mockRejectedValue(new Error('DB error'));

        const promise = Interests.findByUserId(userId);
        await expect(promise).rejects.toThrow(ApiException);
        await expect(promise).rejects.toThrow('Failed to fetch interests by user ID');
    });
});

describe('Interests.addInterest', () => {
    const userId = 1;
    const interestId = 2;

    it('should insert a new interest and return true', async () => {
        db.query.mockResolvedValue({});

        const result = await Interests.addInterest(userId, interestId);
        expect(db.query).toHaveBeenCalledWith(
            'INSERT INTO user_interests (user_id, interest_id) VALUES ($1, $2)',
            [userId, interestId]
        );
        expect(result).toBe(true);
    });

    it('should throw ApiException on db error', async () => {
        db.query.mockRejectedValue(new Error('DB error'));

        const promise = Interests.addInterest(userId, interestId);
        await expect(promise).rejects.toThrow(ApiException);
        await expect(promise).rejects.toThrow('Failed to add interest');
    });
});

describe('Interests.removeInterest', () => {
    const userId = 1;
    const interestId = 2;

    it('should remove an interest and return true', async () => {
        db.query.mockResolvedValue({});

        const result = await Interests.removeInterest(userId, interestId);
        expect(db.query).toHaveBeenCalledWith(
            'DELETE FROM user_interests WHERE user_id = $1 AND interest_id = $2',
            [userId, interestId]
        );
        expect(result).toBe(true);
    });

    it('should throw ApiException on db error', async () => {
        db.query.mockRejectedValue(new Error('DB error'));

        const promise = Interests.removeInterest(userId, interestId);
        await expect(promise).rejects.toThrow(ApiException);
        await expect(promise).rejects.toThrow('Failed to remove interest');
    });
});

describe('Interests.removeAllInterests', () => {
    const userId = 1;

    it('should remove all interests for a user and return true', async () => {
        db.query.mockResolvedValue({});

        const result = await Interests.removeAllInterests(userId);
        expect(db.query).toHaveBeenCalledWith(
            'DELETE FROM user_interests WHERE user_id = $1',
            [userId]
        );
        expect(result).toBe(true);
    });

    it('should throw ApiException on db error', async () => {
        db.query.mockRejectedValue(new Error('DB error'));

        const promise = Interests.removeAllInterests(userId);
        await expect(promise).rejects.toThrow(ApiException);
        await expect(promise).rejects.toThrow('Failed to remove all interests');
    });
});
