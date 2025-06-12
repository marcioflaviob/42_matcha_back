const UserPicturesController = require('../../controllers/UserPicturesController.js');
const UserPictureService = require('../../services/UserPictureService.js');

jest.mock('../../services/UserPictureService.js');

describe('UserPicturesController', () => {
    let mockReq;
    let mockRes;
    const mockUserId = 1;
    const mockPictureId = 1;

    beforeEach(() => {
        jest.clearAllMocks();
        mockReq = {
            user: { id: mockUserId },
            params: {},
            body: {}
        };
        mockRes = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn()
        };
    });

    describe('uploadPicture', () => {
        const mockFile = {
            originalname: 'test.jpg',
            buffer: Buffer.from('test'),
            mimetype: 'image/jpeg'
        };

        beforeEach(() => {
            mockReq.file = mockFile;
        });

        it('should upload a picture successfully', async () => {
            const mockResult = {
                id: mockPictureId,
                user_id: mockUserId,
                url: 'test.jpg',
                is_profile: false
            };
            UserPictureService.uploadAndPersistPicture.mockResolvedValue(mockResult);

            await UserPicturesController.uploadPicture(mockReq, mockRes);

            expect(UserPictureService.uploadAndPersistPicture).toHaveBeenCalledWith(
                mockUserId,
                {
                    file: mockFile,
                    isProfilePicture: false
                }
            );
            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.send).toHaveBeenCalledWith(mockResult);
        });

        it('should handle profile picture upload', async () => {
            mockReq.body.isProfilePicture = 'true';
            const mockResult = {
                id: mockPictureId,
                user_id: mockUserId,
                url: 'test.jpg',
                is_profile: true
            };
            UserPictureService.uploadAndPersistPicture.mockResolvedValue(mockResult);

            await UserPicturesController.uploadPicture(mockReq, mockRes);

            expect(UserPictureService.uploadAndPersistPicture).toHaveBeenCalledWith(
                mockUserId,
                {
                    file: mockFile,
                    isProfilePicture: true
                }
            );
            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.send).toHaveBeenCalledWith(mockResult);
        });

        it('should return 400 when no file is uploaded', async () => {
            mockReq.file = undefined;

            await UserPicturesController.uploadPicture(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.send).toHaveBeenCalledWith({ error: 'No file uploaded' });
        });
    });

    describe('getUserPictures', () => {
        it('should return user pictures', async () => {
            const mockPictures = [
                { id: 1, user_id: mockUserId, url: 'pic1.jpg' },
                { id: 2, user_id: mockUserId, url: 'pic2.jpg' }
            ];
            mockReq.params.userId = mockUserId;
            UserPictureService.getUserPictures.mockResolvedValue(mockPictures);

            await UserPicturesController.getUserPictures(mockReq, mockRes);

            expect(UserPictureService.getUserPictures).toHaveBeenCalledWith(mockUserId);
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.send).toHaveBeenCalledWith(mockPictures);
        });
    });

    describe('deleteUserPicture', () => {
        it('should delete a user picture', async () => {
            const mockResult = { message: 'Picture deleted successfully' };
            mockReq.params = { userId: mockUserId, pictureId: mockPictureId };
            UserPictureService.deleteUserPicture.mockResolvedValue(mockResult);

            await UserPicturesController.deleteUserPicture(mockReq, mockRes);

            expect(UserPictureService.deleteUserPicture).toHaveBeenCalledWith(mockUserId, mockPictureId);
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.send).toHaveBeenCalledWith(mockResult);
        });
    });

    describe('setProfilePicture', () => {
        it('should set a picture as profile picture', async () => {
            const mockUpdatedPicture = {
                id: mockPictureId,
                user_id: mockUserId,
                url: 'test.jpg',
                is_profile: true
            };
            mockReq.params = { userId: mockUserId, pictureId: mockPictureId };
            UserPictureService.setProfilePicture.mockResolvedValue(mockUpdatedPicture);

            await UserPicturesController.setProfilePicture(mockReq, mockRes);

            expect(UserPictureService.setProfilePicture).toHaveBeenCalledWith(mockUserId, mockPictureId);
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.send).toHaveBeenCalledWith(mockUpdatedPicture);
        });
    });
});