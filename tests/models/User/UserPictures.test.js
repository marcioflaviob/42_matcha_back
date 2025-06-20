const db = require('../../../config/db.js');
const UserPictures = require('../../../models/User/UserPictures.js');
const ApiException = require('../../../exceptions/ApiException.js');
const { mockConsole, restoreConsole } = require('../../utils/testSetup');

jest.mock('../../../config/db.js');

beforeEach(() => {
    mockConsole();
});

afterEach(() => {
    restoreConsole();
});

describe('UserPictures', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('findByUserId', () => {
        it('should return user pictures when they exist', async () => {
            const mockPictures = [
                { id: 1, user_id: 1, url: 'pic1.jpg', is_profile: true },
                { id: 2, user_id: 1, url: 'pic2.jpg', is_profile: false }
            ];
            db.query.mockResolvedValue({ rows: mockPictures });

            const result = await UserPictures.findByUserId(1);

            expect(db.query).toHaveBeenCalledWith(
                'SELECT * FROM user_pictures WHERE user_id = $1',
                [1]
            );
            expect(result).toEqual(mockPictures);
        });

        it('should throw ApiException when no pictures are found', async () => {
            db.query.mockResolvedValue({ rows: [] });

            await expect(UserPictures.findByUserId(1))
                .rejects
                .toThrow(new ApiException(404, 'No pictures found for this user'));
        });

        it('should throw ApiException on database error', async () => {
            db.query.mockRejectedValue(new Error('DB error'));

            await expect(UserPictures.findByUserId(1))
                .rejects
                .toThrow(new ApiException(500, 'Failed to fetch user pictures'));
        });
    });

    describe('create', () => {
        it('should create a new picture', async () => {
            const pictureData = {
                user_id: 1,
                url: 'newpic.jpg',
                is_profile: false
            };
            const mockCreatedPicture = { id: 1, ...pictureData };
            db.query.mockResolvedValue({ rows: [mockCreatedPicture] });

            const result = await UserPictures.create(pictureData);

            expect(db.query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO user_pictures'), Object.values(pictureData));
            expect(result).toEqual(mockCreatedPicture);
        });

        it('should throw ApiException when creation fails', async () => {
            db.query.mockResolvedValue({ rows: [] });

            await expect(UserPictures.create({ user_id: 1, url: 'pic.jpg' }))
                .rejects
                .toThrow(new ApiException(500, 'Failed to create user picture'));
        });
    });

    describe('delete', () => {
        it('should delete a picture', async () => {
            db.query.mockResolvedValue({ rows: [] });

            const result = await UserPictures.delete(1, 1);

            expect(db.query).toHaveBeenCalledWith(
                'DELETE FROM user_pictures WHERE id = $1 AND user_id = $2',
                [1, 1]
            );
            expect(result).toBe(true);
        });

        it('should throw ApiException on delete error', async () => {
            db.query.mockRejectedValue(new Error('DB error'));

            await expect(UserPictures.delete(1, 1))
                .rejects
                .toThrow(new ApiException(500, 'Failed to delete user picture'));
        });
    });

    describe('resetProfilePicture', () => {
        it('should reset profile picture flag', async () => {
            db.query.mockResolvedValue({ rows: [] });

            const result = await UserPictures.resetProfilePicture(1);

            expect(db.query).toHaveBeenCalledWith(
                'UPDATE user_pictures SET is_profile = false WHERE user_id = $1',
                [1]
            );
            expect(result).toBe(true);
        });

        it('should throw ApiException on reset error', async () => {
            db.query.mockRejectedValue(new Error('DB error'));

            await expect(UserPictures.resetProfilePicture(1))
                .rejects
                .toThrow(new ApiException(500, 'Failed to reset profile picture'));
        });
    });

    describe('setAsProfile', () => {
        it('should set a picture as profile', async () => {
            const mockPicture = { id: 1, user_id: 1, url: 'pic.jpg', is_profile: true };
            db.query.mockResolvedValue({ rows: [mockPicture] });

            const result = await UserPictures.setAsProfile(1, 1);

            expect(db.query).toHaveBeenCalledWith(
                'UPDATE user_pictures SET is_profile = true WHERE id = $1 AND user_id = $2 RETURNING *',
                [1, 1]
            );
            expect(result).toEqual(mockPicture);
        });

        it('should throw ApiException when picture not found', async () => {
            db.query.mockResolvedValue({ rows: [] });

            await expect(UserPictures.setAsProfile(1, 1))
                .rejects
                .toThrow(new ApiException(404, 'Picture not found or not owned by user'));
        });
    });

    describe('setAsProfile error handling', () => {
        it('should handle database errors during setAsProfile', async () => {
            db.query.mockRejectedValue(new Error('Database transaction failed'));

            await expect(UserPictures.setAsProfile(1, 1))
                .rejects
                .toThrow('Failed to set picture as profile');

            expect(console.log).toHaveBeenCalledWith(expect.any(Error));
        });
    });

    describe('findById', () => {
        it('should return a picture by id', async () => {
            const mockPicture = { id: 1, user_id: 1, url: 'pic.jpg', is_profile: true };
            db.query.mockResolvedValue({ rows: [mockPicture] });

            const result = await UserPictures.findById(1);

            expect(db.query).toHaveBeenCalledWith(
                'SELECT * FROM user_pictures WHERE id = $1',
                [1]
            );
            expect(result).toEqual(mockPicture);
        });

        it('should throw ApiException when picture not found', async () => {
            db.query.mockResolvedValue({ rows: [] });

            await expect(UserPictures.findById(1))
                .rejects
                .toThrow(new ApiException(404, 'Picture not found'));
        });

        it('should throw ApiException on database error', async () => {
            db.query.mockRejectedValue(new Error('DB error'));

            await expect(UserPictures.findById(1))
                .rejects
                .toThrow(new ApiException(500, 'Failed to fetch picture by ID'));
        });
    });
});