const { put, del } = require('@vercel/blob');
const UserPictureService = require('../../services/UserPictureService.js');
const UserPictures = require('../../models/User/UserPictures.js');
const ApiException = require('../../exceptions/ApiException.js');
const { mockConsole, restoreConsole } = require('../utils/testSetup');

jest.mock('@vercel/blob');
jest.mock('../../models/User/UserPictures.js');

beforeEach(() => {
    mockConsole();
});

afterEach(() => {
    restoreConsole();
});

describe('UserPictureService', () => {
    const mockUserId = 1;
    const mockPictureId = 1;
    const mockUrl = 'pictures/test.jpg';
    const mockBlobUrl = 'https://example.com/pictures/test.jpg';

    beforeEach(() => {
        jest.clearAllMocks();
        process.env.BLOB_URL = 'https://example.com';
    });

    describe('uploadPicture', () => {
        const mockFile = {
            originalname: 'test.jpg',
            buffer: Buffer.from('test'),
            mimetype: 'image/jpeg'
        };

        it('should upload a picture and return the URL path', async () => {
            put.mockResolvedValue({ url: mockBlobUrl });

            const result = await UserPictureService.uploadPicture(mockUserId, mockFile);

            expect(put).toHaveBeenCalledWith(
                expect.stringContaining(mockFile.originalname),
                mockFile.buffer,
                {
                    access: 'public',
                    contentType: mockFile.mimetype
                }
            );
            expect(result).toBe('pictures/test.jpg');
        });

        it('should throw ApiException when upload fails', async () => {
            put.mockRejectedValue(new Error('Upload failed'));

            await expect(UserPictureService.uploadPicture(mockUserId, mockFile))
                .rejects
                .toThrow(new ApiException(500, 'Upload failed'));
        });
    });

    describe('uploadAndPersistPicture', () => {
        const mockPhoto = {
            file: {
                originalname: 'test.jpg',
                buffer: Buffer.from('test'),
                mimetype: 'image/jpeg'
            },
            isProfilePicture: true
        };

        let mockCreatedPicture;

        beforeEach(() => {
            mockCreatedPicture = {
                id: mockPictureId,
                user_id: mockUserId,
                url: mockUrl,
                is_profile: true
            };
            UserPictures.findByUserId.mockResolvedValue([]);
            UserPictures.create.mockResolvedValue(mockCreatedPicture);
            UserPictures.resetProfilePicture.mockResolvedValue(true);
            put.mockResolvedValue({ url: mockBlobUrl });
        });

        it('should upload and persist a picture', async () => {
            const result = await UserPictureService.uploadAndPersistPicture(mockUserId, mockPhoto);

            expect(UserPictures.resetProfilePicture).toHaveBeenCalledWith(mockUserId);
            expect(UserPictures.create).toHaveBeenCalledWith({
                user_id: mockUserId,
                url: expect.any(String),
                is_profile: true
            });
            expect(result).toEqual(mockCreatedPicture);
        });

        it('should upload and persist a non-profile picture', async () => {
            const nonProfilePhoto = {
                ...mockPhoto,
                isProfilePicture: false
            };
            const mockNonProfilePicture = {
                ...mockCreatedPicture,
                is_profile: false
            };
            UserPictures.create.mockResolvedValue(mockNonProfilePicture);

            const result = await UserPictureService.uploadAndPersistPicture(mockUserId, nonProfilePhoto);

            expect(UserPictures.resetProfilePicture).not.toHaveBeenCalled();
            expect(UserPictures.create).toHaveBeenCalledWith({
                user_id: mockUserId,
                url: expect.any(String),
                is_profile: false
            });
            expect(result).toEqual(mockNonProfilePicture);
        });

        it('should throw ApiException when user has 5 pictures', async () => {
            UserPictures.findByUserId.mockResolvedValue(Array(5).fill({ id: 1, url: 'test.jpg' }));

            await expect(UserPictureService.uploadAndPersistPicture(mockUserId, mockPhoto))
                .rejects
                .toThrow('You can only upload up to 5 pictures');
        });
    });

    describe('getUserPictures', () => {
        it('should return user pictures', async () => {
            const mockPictures = [
                { id: 1, user_id: mockUserId, url: 'pic1.jpg' },
                { id: 2, user_id: mockUserId, url: 'pic2.jpg' }
            ];
            UserPictures.findByUserId.mockResolvedValue(mockPictures);

            const result = await UserPictureService.getUserPictures(mockUserId);

            expect(UserPictures.findByUserId).toHaveBeenCalledWith(mockUserId);
            expect(result).toEqual(mockPictures);
        });

        it('should throw ApiException when fetching pictures fails', async () => {
            UserPictures.findByUserId.mockRejectedValue(new Error('DB error'));

            await expect(UserPictureService.getUserPictures(mockUserId))
                .rejects
                .toThrow();
                
            // Reset the mock for subsequent tests
            UserPictures.findByUserId.mockReset();
        });
    });

    describe('deleteUserPicture', () => {
        beforeEach(() => {
            // Mock getUserPictures call (which uses findByUserId)
            UserPictures.findByUserId.mockResolvedValue([
                { id: mockPictureId, user_id: mockUserId, url: mockUrl, is_profile: false },
                { id: 2, user_id: mockUserId, url: 'other.jpg', is_profile: true }
            ]);
            UserPictures.findById.mockResolvedValue({ url: mockUrl });
            UserPictures.delete.mockResolvedValue(true);
            del.mockResolvedValue({});
        });

        it('should delete a user picture', async () => {
            const result = await UserPictureService.deleteUserPicture(mockUserId, mockPictureId);

            expect(UserPictures.findByUserId).toHaveBeenCalledWith(mockUserId);
            expect(UserPictures.delete).toHaveBeenCalledWith(mockUserId, mockPictureId);
            expect(del).toHaveBeenCalledWith(`${process.env.BLOB_URL}/${mockUrl}`);
            expect(result).toEqual({ message: 'Picture deleted successfully' });
        });

        it('should throw ApiException when deletion fails', async () => {
            UserPictures.delete.mockResolvedValue(false);

            await expect(UserPictureService.deleteUserPicture(mockUserId, mockPictureId))
                .rejects
                .toThrow(new ApiException(500, 'Failed to delete picture'));
        });
    });

    describe('file deletion scenarios', () => {
        it('should handle successful file deletion', async () => {
            const { del } = require('@vercel/blob');

            del.mockResolvedValue();

            UserPictures.findByUserId.mockResolvedValue([
                { id: mockPictureId, user_id: mockUserId, url: mockUrl, is_profile: false },
                { id: 2, user_id: mockUserId, url: 'other.jpg', is_profile: true }
            ]);
            UserPictures.delete.mockResolvedValue(true);

            const result = await UserPictureService.deleteUserPicture(mockUserId, mockPictureId);

            expect(result.message).toBe('Picture deleted successfully');
            expect(del).toHaveBeenCalledWith(`https://example.com/${mockUrl}`);
        });

        it('should handle file deletion errors gracefully without failing the operation', async () => {
            const { del } = require('@vercel/blob');

            del.mockRejectedValue(new Error('File not found'));

            const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => { });

            UserPictures.findByUserId.mockResolvedValue([
                { id: mockPictureId, user_id: mockUserId, url: mockUrl, is_profile: false },
                { id: 2, user_id: mockUserId, url: 'other.jpg', is_profile: true }
            ]);
            UserPictures.delete.mockResolvedValue(true);

            const result = await UserPictureService.deleteUserPicture(mockUserId, mockPictureId);

            expect(result.message).toBe('Picture deleted successfully');
            expect(del).toHaveBeenCalledWith(`https://example.com/${mockUrl}`);

            await new Promise(resolve => setTimeout(resolve, 10));

            expect(consoleLogSpy).toHaveBeenCalledWith('File deletion failed, but database operation completed');

            consoleLogSpy.mockRestore();
        });
    });

    describe('setProfilePicture', () => {
        it('should set a picture as profile picture', async () => {
            const mockUpdatedPicture = {
                id: mockPictureId,
                user_id: mockUserId,
                url: mockUrl,
                is_profile: true
            };
            UserPictures.resetProfilePicture.mockResolvedValue(true);
            UserPictures.setAsProfile.mockResolvedValue(mockUpdatedPicture);

            const result = await UserPictureService.setProfilePicture(mockUserId, mockPictureId);

            expect(UserPictures.resetProfilePicture).toHaveBeenCalledWith(mockUserId);
            expect(UserPictures.setAsProfile).toHaveBeenCalledWith(mockUserId, mockPictureId);
            expect(result).toEqual(mockUpdatedPicture);
        });

        it('should throw ApiException when setting profile picture fails', async () => {
            UserPictures.setAsProfile.mockResolvedValue(null);

            await expect(UserPictureService.setProfilePicture(mockUserId, mockPictureId))
                .rejects
                .toThrow(new ApiException(500, 'Failed to set picture as profile'));
        });
    });
});