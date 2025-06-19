const NotificationService = require('../../services/NotificationService');
const NotificationController = require('../../controllers/NotificationController');
const {
    createMockReqRes,
    createMockData,
    createControllerTestSetup,
    createNotificationTestUtils
} = require('../utils/testSetup');

jest.mock('../../services/NotificationService', () => ({
    getNotSeenNotificationsByUserId: jest.fn(),
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