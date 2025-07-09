const NotificationService = require('../../services/NotificationService');
const NotificationController = require('../../controllers/NotificationController');
const {
    createMockData,
    createControllerTestSetup,
    createNotificationTestUtils
} = require('../utils/testSetup');

jest.mock('../../services/NotificationService', () => ({
    getNotSeenNotificationsByUserId: jest.fn(),
    getAllProfileViewNotificationsByUserIdWithPictures: jest.fn(),
    newCallNotification: jest.fn(),
    newStopCallNotification: jest.fn(),
    newSeenNotification: jest.fn(),
    newRefusedCallNotification: jest.fn(),
    newDateNotification: jest.fn(),
    newUnansweredDate: jest.fn(),
    markAllAsSeen: jest.fn()
}));

describe('NotificationController', () => {
    let controllerTest;
    let notificationUtils;

    beforeEach(() => {
        jest.clearAllMocks();
        controllerTest = createControllerTestSetup();
        notificationUtils = createNotificationTestUtils();
    });

    describe('getNotSeenNotificationsByUserId', () => {
        it('should get unseen notifications and send 200 with notifications data', async () => {
            const mockNotifications = [
                createMockData.notification({ id: 1, user_id: 1, type: 'new-message', seen: false }),
                createMockData.notification({ id: 2, user_id: 1, type: 'new-like', seen: false })
            ];
            const { req, res } = notificationUtils.createNotificationRequestData({
                req: { user: { id: 1 } }
            });

            await notificationUtils.testNotificationController(
                NotificationController.getNotSeenNotificationsByUserId,
                NotificationService.getNotSeenNotificationsByUserId,
                mockNotifications,
                { req, res },
                [req.user.id]
            );
        });

        it('should handle errors gracefully', async () => {
            const { req, res } = notificationUtils.createNotificationRequestData({
                req: { user: { id: 1 } }
            });

            NotificationService.getNotSeenNotificationsByUserId.mockRejectedValue(new Error('Database error'));

            try {
                await NotificationController.getNotSeenNotificationsByUserId(req, res);
            } catch (error) {
                expect(error.message).toBe('Database error');
            }
        });
    });

    describe('getAllProfileViewNotificationsByUserIdWithPictures', () => {
        it('should get profile view notifications with pictures and send 200 with notifications data', async () => {
            const mockNotificationsWithPictures = [
                {
                    id: 1,
                    user_id: 1,
                    concerned_user_id: 2,
                    type: 'new-seen',
                    title: 'Profile Viewed',
                    message: 'Someone viewed your profile',
                    pictures: [
                        { id: 1, user_id: 2, url: 'picture1.jpg', is_main: true },
                        { id: 2, user_id: 2, url: 'picture2.jpg', is_main: false }
                    ]
                },
                {
                    id: 2,
                    user_id: 1,
                    concerned_user_id: 3,
                    type: 'new-seen',
                    title: 'Profile Viewed',
                    message: 'Another user viewed your profile',
                    pictures: [
                        { id: 3, user_id: 3, url: 'picture3.jpg', is_main: true }
                    ]
                }
            ];

            const { req, res } = notificationUtils.createNotificationRequestData({
                req: { user: { id: 1 } }
            });

            await notificationUtils.testNotificationController(
                NotificationController.getAllProfileViewNotificationsByUserIdWithPictures,
                NotificationService.getAllProfileViewNotificationsByUserIdWithPictures,
                mockNotificationsWithPictures,
                { req, res },
                [req.user.id]
            );
        });

        it('should handle empty notifications array', async () => {
            const { req, res } = notificationUtils.createNotificationRequestData({
                req: { user: { id: 1 } }
            });

            NotificationService.getAllProfileViewNotificationsByUserIdWithPictures.mockResolvedValue([]);

            await NotificationController.getAllProfileViewNotificationsByUserIdWithPictures(req, res);

            expect(NotificationService.getAllProfileViewNotificationsByUserIdWithPictures).toHaveBeenCalledWith(1);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.send).toHaveBeenCalledWith([]);
        });

        it('should handle notifications with empty pictures arrays', async () => {
            const mockNotificationsWithEmptyPictures = [
                {
                    id: 1,
                    user_id: 1,
                    concerned_user_id: 2,
                    type: 'new-seen',
                    title: 'Profile Viewed',
                    message: 'Someone viewed your profile',
                    pictures: []
                }
            ];

            const { req, res } = notificationUtils.createNotificationRequestData({
                req: { user: { id: 1 } }
            });

            NotificationService.getAllProfileViewNotificationsByUserIdWithPictures.mockResolvedValue(mockNotificationsWithEmptyPictures);

            await NotificationController.getAllProfileViewNotificationsByUserIdWithPictures(req, res);

            expect(NotificationService.getAllProfileViewNotificationsByUserIdWithPictures).toHaveBeenCalledWith(1);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.send).toHaveBeenCalledWith(mockNotificationsWithEmptyPictures);
        });

        it('should handle service errors gracefully', async () => {
            const { req, res } = notificationUtils.createNotificationRequestData({
                req: { user: { id: 1 } }
            });

            NotificationService.getAllProfileViewNotificationsByUserIdWithPictures.mockRejectedValue(new Error('Service error'));

            try {
                await NotificationController.getAllProfileViewNotificationsByUserIdWithPictures(req, res);
            } catch (error) {
                expect(error.message).toBe('Service error');
            }

            expect(NotificationService.getAllProfileViewNotificationsByUserIdWithPictures).toHaveBeenCalledWith(1);
        });

        it('should handle different user IDs correctly', async () => {
            const mockNotifications = [
                {
                    id: 5,
                    user_id: 10,
                    concerned_user_id: 20,
                    type: 'new-seen',
                    title: 'Profile Viewed',
                    message: 'User 20 viewed your profile',
                    pictures: [
                        { id: 10, user_id: 20, url: 'user20_pic.jpg', is_main: true }
                    ]
                }
            ];

            const { req, res } = notificationUtils.createNotificationRequestData({
                req: { user: { id: 10 } }
            });

            NotificationService.getAllProfileViewNotificationsByUserIdWithPictures.mockResolvedValue(mockNotifications);

            await NotificationController.getAllProfileViewNotificationsByUserIdWithPictures(req, res);

            expect(NotificationService.getAllProfileViewNotificationsByUserIdWithPictures).toHaveBeenCalledWith(10);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.send).toHaveBeenCalledWith(mockNotifications);
        });

        it('should handle multiple notifications with various picture configurations', async () => {
            const mockVariedNotifications = [
                {
                    id: 1,
                    user_id: 1,
                    concerned_user_id: 2,
                    type: 'new-seen',
                    title: 'Profile Viewed',
                    message: 'User 2 viewed your profile',
                    pictures: [
                        { id: 1, user_id: 2, url: 'pic1.jpg', is_main: true },
                        { id: 2, user_id: 2, url: 'pic2.jpg', is_main: false },
                        { id: 3, user_id: 2, url: 'pic3.jpg', is_main: false }
                    ]
                },
                {
                    id: 2,
                    user_id: 1,
                    concerned_user_id: 3,
                    type: 'new-seen',
                    title: 'Profile Viewed',
                    message: 'User 3 viewed your profile',
                    pictures: []
                },
                {
                    id: 3,
                    user_id: 1,
                    concerned_user_id: 4,
                    type: 'new-seen',
                    title: 'Profile Viewed',
                    message: 'User 4 viewed your profile',
                    pictures: [
                        { id: 4, user_id: 4, url: 'single_pic.jpg', is_main: true }
                    ]
                }
            ];

            const { req, res } = notificationUtils.createNotificationRequestData({
                req: { user: { id: 1 } }
            });

            NotificationService.getAllProfileViewNotificationsByUserIdWithPictures.mockResolvedValue(mockVariedNotifications);

            await NotificationController.getAllProfileViewNotificationsByUserIdWithPictures(req, res);

            expect(NotificationService.getAllProfileViewNotificationsByUserIdWithPictures).toHaveBeenCalledWith(1);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.send).toHaveBeenCalledWith(mockVariedNotifications);
        });

        it('should handle edge case with malformed request user object', async () => {
            const mockNotifications = [];
            const { req, res } = notificationUtils.createNotificationRequestData({
                req: { user: { id: null } }
            });

            NotificationService.getAllProfileViewNotificationsByUserIdWithPictures.mockResolvedValue(mockNotifications);

            await NotificationController.getAllProfileViewNotificationsByUserIdWithPictures(req, res);

            expect(NotificationService.getAllProfileViewNotificationsByUserIdWithPictures).toHaveBeenCalledWith(null);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.send).toHaveBeenCalledWith(mockNotifications);
        });

        it('should handle database connection errors', async () => {
            const { req, res } = notificationUtils.createNotificationRequestData({
                req: { user: { id: 1 } }
            });

            const dbError = new Error('Database connection failed');
            NotificationService.getAllProfileViewNotificationsByUserIdWithPictures.mockRejectedValue(dbError);

            try {
                await NotificationController.getAllProfileViewNotificationsByUserIdWithPictures(req, res);
            } catch (error) {
                expect(error.message).toBe('Database connection failed');
            }

            expect(NotificationService.getAllProfileViewNotificationsByUserIdWithPictures).toHaveBeenCalledWith(1);
        });

        it('should handle service timeouts', async () => {
            const { req, res } = notificationUtils.createNotificationRequestData({
                req: { user: { id: 1 } }
            });

            const timeoutError = new Error('Service timeout');
            NotificationService.getAllProfileViewNotificationsByUserIdWithPictures.mockRejectedValue(timeoutError);

            try {
                await NotificationController.getAllProfileViewNotificationsByUserIdWithPictures(req, res);
            } catch (error) {
                expect(error.message).toBe('Service timeout');
            }

            expect(NotificationService.getAllProfileViewNotificationsByUserIdWithPictures).toHaveBeenCalledWith(1);
        });

        it('should verify response format matches expected structure', async () => {
            const mockNotifications = [
                {
                    id: 1,
                    user_id: 1,
                    concerned_user_id: 2,
                    type: 'new-seen',
                    title: 'Profile Viewed',
                    message: 'Someone viewed your profile',
                    seen: false,
                    created_at: '2025-01-01T00:00:00Z',
                    pictures: [
                        {
                            id: 1,
                            user_id: 2,
                            url: 'picture1.jpg',
                            is_main: true,
                            uploaded_at: '2025-01-01T00:00:00Z'
                        }
                    ]
                }
            ];

            const { req, res } = notificationUtils.createNotificationRequestData({
                req: { user: { id: 1 } }
            });

            NotificationService.getAllProfileViewNotificationsByUserIdWithPictures.mockResolvedValue(mockNotifications);

            await NotificationController.getAllProfileViewNotificationsByUserIdWithPictures(req, res);

            expect(res.send).toHaveBeenCalledWith(mockNotifications);

            // Verify the structure of the response
            const sentData = res.send.mock.calls[0][0];
            expect(Array.isArray(sentData)).toBe(true);
            expect(sentData[0]).toHaveProperty('id');
            expect(sentData[0]).toHaveProperty('user_id');
            expect(sentData[0]).toHaveProperty('concerned_user_id');
            expect(sentData[0]).toHaveProperty('type', 'new-seen');
            expect(sentData[0]).toHaveProperty('pictures');
            expect(Array.isArray(sentData[0].pictures)).toBe(true);
        });
    });

    describe('sendNewCallNotification', () => {
        it('should create new call notification and send 200 with notification data', async () => {
            const mockNotification = notificationUtils.mockNotificationTypes.call();

            await notificationUtils.testNotificationWithParams(
                NotificationController.sendNewCallNotification,
                NotificationService.newCallNotification,
                mockNotification
            );
        });
    });

    describe('sendStopCallNotification', () => {
        it('should create stop call notification and send 200 with notification data', async () => {
            const mockNotification = notificationUtils.mockNotificationTypes.stopCall();

            await notificationUtils.testNotificationWithParams(
                NotificationController.sendStopCallNotification,
                NotificationService.newStopCallNotification,
                mockNotification
            );
        });
    });

    describe('sendSeenNotification', () => {
        it('should create seen notification and send 200 with notification data', async () => {
            const mockNotification = notificationUtils.mockNotificationTypes.seen();

            await notificationUtils.testNotificationWithParams(
                NotificationController.sendSeenNotification,
                NotificationService.newSeenNotification,
                mockNotification
            );
        });
    });

    describe('sendRefuseCallNotification', () => {
        it('should create refuse call notification and send 200 with notification data', async () => {
            const mockNotification = notificationUtils.mockNotificationTypes.refusedCall();

            await notificationUtils.testNotificationWithParams(
                NotificationController.sendRefuseCallNotification,
                NotificationService.newRefusedCallNotification,
                mockNotification
            );
        });
    });

    describe('sendDateNotification', () => {
        it('should create date notification and send 200 with notification and date data', async () => {
            const mockData = notificationUtils.mockNotificationTypes.date();
            const { req, res } = notificationUtils.createDateRequestData();

            await notificationUtils.testNotificationController(
                NotificationController.sendDateNotification,
                NotificationService.newDateNotification,
                mockData,
                { req, res },
                [req.body.senderId, req.body.receiverId, req.body.dateData, req.body.address, req.body.latitude, req.body.longitude]
            );
        });
    });

    describe('newUnansweredDate', () => {
        it('should create unanswered date notification and send 200 with notification and date data', async () => {
            const mockData = notificationUtils.mockNotificationTypes.unansweredDate();
            const { req, res } = notificationUtils.createNotificationRequestData({
                req: { params: { id: 1 } }
            });

            await notificationUtils.testNotificationController(
                NotificationController.newUnansweredDate,
                NotificationService.newUnansweredDate,
                mockData,
                { req, res },
                [req.params.id]
            );
        });
    });

    describe('markNotificationAsSeen', () => {
        it('should mark all notifications as seen and send 204', async () => {
            const { req, res } = notificationUtils.createNotificationRequestData({
                req: { user: { id: 1 } }
            });

            NotificationService.markAllAsSeen.mockResolvedValue([]);

            await NotificationController.markNotificationAsSeen(req, res);

            expect(NotificationService.markAllAsSeen).toHaveBeenCalledWith(req.user.id);
            expect(res.status).toHaveBeenCalledWith(204);
            expect(res.send).toHaveBeenCalled();
        });
    });
});