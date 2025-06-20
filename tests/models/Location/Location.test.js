const db = require('../../../config/db');
const ApiException = require('../../../exceptions/ApiException');
const Location = require('../../../models/Location/Location');
const { mockConsole, restoreConsole } = require('../../utils/testSetup');

jest.mock('../../../config/db');

describe('Location model', () => {
    beforeEach(() => {
        mockConsole();
    });

    afterEach(() => {
        restoreConsole();
        jest.clearAllMocks();
    });

    describe('createLocation', () => {
        it('should insert a location and return user_id', async () => {
            const mockData = {
                userId: 1,
                longitude: 10.1,
                latitude: 20.2,
                city: 'Paris',
                country: 'France'
            };

            db.query.mockResolvedValue({ rows: [{ user_id: mockData.userId }] });

            const result = await Location.createLocation(mockData);

            expect(db.query).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO location'),
                [mockData.userId, mockData.longitude, mockData.latitude, mockData.city, mockData.country]
            );
            expect(result).toBe(mockData.userId);
        });

        it('should throw ApiException on error', async () => {
            db.query.mockRejectedValue(new Error('DB error'));

            await expect(Location.createLocation({}))
                .rejects
                .toThrow(new ApiException(500, 'Failed to create location'));
        });
    });

    describe('findByUserId', () => {
        it('should return location for a valid userId', async () => {
            const userId = 1;
            const mockLocation = {
                user_id: userId,
                longitude: 10.1,
                latitude: 20.2,
                city: 'Paris',
                country: 'France'
            };

            db.query.mockResolvedValue({ rows: [mockLocation] });

            const result = await Location.findByUserId(userId);

            expect(db.query).toHaveBeenCalledWith(expect.stringContaining('SELECT * FROM location'), [userId]);
            expect(result).toEqual(mockLocation);
        });

        it('should throw 404 if no location is found', async () => {
            db.query.mockResolvedValue({ rows: [] });

            await expect(Location.findByUserId(1))
                .rejects
                .toThrow(new ApiException(404, 'Location not found for the given user ID'));
        });

        it('should throw ApiException on DB error', async () => {
            db.query.mockRejectedValue(new Error('DB error'));

            await expect(Location.findByUserId(1))
                .rejects
                .toThrow(new ApiException(500, 'Failed to find location by user ID'));
        });
    });

    describe('updateLocation', () => {
        it('should update location and return updated row', async () => {
            const mockData = {
                userId: 1,
                longitude: 15.5,
                latitude: 25.5,
                city: 'Berlin',
                country: 'Germany'
            };

            db.query.mockResolvedValue({ rows: [mockData] });

            const result = await Location.updateLocation(mockData);

            expect(db.query).toHaveBeenCalledWith(
                expect.stringContaining('UPDATE location'),
                [mockData.longitude, mockData.latitude, mockData.city, mockData.country, mockData.userId]
            );
            expect(result).toEqual(mockData);
        });

        it('should throw 404 if update affected no rows', async () => {
            db.query.mockResolvedValue({ rows: [] });

            await expect(Location.updateLocation({}))
                .rejects
                .toThrow(new ApiException(404, 'Location not found for the given user ID'));
        });

        it('should throw ApiException on DB error', async () => {
            db.query.mockRejectedValue(new Error('DB error'));

            await expect(Location.updateLocation({}))
                .rejects
                .toThrow(new ApiException(500, 'Failed to update location'));
        });
    });
});
