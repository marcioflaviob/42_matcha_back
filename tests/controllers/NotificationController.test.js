const NotificationService = require('../../services/NotificationService');
const NotificationController = require('../../controllers/NotificationController');

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
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const mockUser = {
        id: 1,
        first_name: 'John',
        last_name: 'Doe'
    };

    describe('getNotSeenNotificationsByUserId', () => {
        it('should get unseen notifications and send 200 with notifications data', async () => {
            const mockNotifications = [
                { id: 1, user_id: 1, type: 'new-message', seen: false },
                { id: 2, user_id: 1, type: 'new-like', seen: false }
            ];
            const req = {
                user: {
                    id: 1
                }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                send: jest.fn()
            };

            NotificationService.getNotSeenNotificationsByUserId.mockResolvedValue(mockNotifications);

            await NotificationController.getNotSeenNotificationsByUserId(req, res);

            expect(NotificationService.getNotSeenNotificationsByUserId).toHaveBeenCalledWith(req.user.id);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.send).toHaveBeenCalledWith(mockNotifications);
        });

        it('should handle errors gracefully', async () => {
            const req = {
                user: {
                    id: 1
                }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                send: jest.fn()
            };

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
            const mockNotification = {
                id: 1,
                user_id: 2,
                concerned_user_id: 1,
                type: 'new-call',
                title: 'Incoming Call',
                message: 'John is calling you'
            };
            const req = {
                user: {
                    id: 1
                },
                params: {
                    id: 2
                }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                send: jest.fn()
            };

            NotificationService.newCallNotification.mockResolvedValue(mockNotification);

            await NotificationController.sendNewCallNotification(req, res);

            expect(NotificationService.newCallNotification).toHaveBeenCalledWith(req.params.id, req.user.id);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.send).toHaveBeenCalledWith(mockNotification);
        });
    });

    describe('sendStopCallNotification', () => {
        it('should create stop call notification and send 200 with notification data', async () => {
            const mockNotification = {
                id: 1,
                user_id: 2,
                concerned_user_id: 1,
                type: 'stop-call',
                title: 'Stop Call',
                message: 'John interrupted the call'
            };
            const req = {
                user: {
                    id: 1
                },
                params: {
                    id: 2
                }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                send: jest.fn()
            };

            NotificationService.newStopCallNotification.mockResolvedValue(mockNotification);

            await NotificationController.sendStopCallNotification(req, res);

            expect(NotificationService.newStopCallNotification).toHaveBeenCalledWith(req.params.id, req.user.id);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.send).toHaveBeenCalledWith(mockNotification);
        });
    });

    describe('sendSeenNotification', () => {
        it('should create seen notification and send 200 with notification data', async () => {
            const mockNotification = {
                id: 1,
                user_id: 2,
                concerned_user_id: 1,
                type: 'new-seen',
                title: 'Your profile was viewed',
                message: 'John has seen your profile'
            };
            const req = {
                user: {
                    id: 1
                },
                params: {
                    id: 2
                }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                send: jest.fn()
            };

            NotificationService.newSeenNotification.mockResolvedValue(mockNotification);

            await NotificationController.sendSeenNotification(req, res);

            expect(NotificationService.newSeenNotification).toHaveBeenCalledWith(req.params.id, req.user.id);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.send).toHaveBeenCalledWith(mockNotification);
        });
    });

    describe('sendRefuseCallNotification', () => {
        it('should create refuse call notification and send 200 with notification data', async () => {
            const mockNotification = {
                id: 1,
                user_id: 2,
                concerned_user_id: 1,
                type: 'new-refused-call',
                title: 'New Refused Call',
                message: 'John refused your call'
            };
            const req = {
                user: {
                    id: 1
                },
                params: {
                    id: 2
                }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                send: jest.fn()
            };

            NotificationService.newRefusedCallNotification.mockResolvedValue(mockNotification);

            await NotificationController.sendRefuseCallNotification(req, res);

            expect(NotificationService.newRefusedCallNotification).toHaveBeenCalledWith(req.params.id, req.user.id);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.send).toHaveBeenCalledWith(mockNotification);
        });
    });

    describe('sendDateNotification', () => {
        it('should create date notification and send 200 with notification and date data', async () => {
            const mockData = {
                notification: {
                    id: 1,
                    user_id: 2,
                    concerned_user_id: 1,
                    type: 'new-date',
                    title: 'New Date',
                    message: 'John scheduled a date with you'
                },
                date: {
                    id: 1,
                    sender_id: 1,
                    receiver_id: 2,
                    scheduled_date: '2023-12-31',
                    address: '123 Main St',
                    latitude: 123.456,
                    longitude: 789.012
                }
            };
            const req = {
                body: {
                    senderId: 1,
                    receiverId: 2,
                    dateData: '2023-12-31',
                    address: '123 Main St',
                    latitude: 123.456,
                    longitude: 789.012
                }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                send: jest.fn()
            };

            NotificationService.newDateNotification.mockResolvedValue(mockData);

            await NotificationController.sendDateNotification(req, res);

            expect(NotificationService.newDateNotification).toHaveBeenCalledWith(
                req.body.senderId,
                req.body.receiverId,
                req.body.dateData,
                req.body.address,
                req.body.latitude,
                req.body.longitude
            );
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.send).toHaveBeenCalledWith(mockData);
        });
    });

    describe('newUnansweredDate', () => {
        it('should create unanswered date notification and send 200 with notification and date data', async () => {
            const mockData = {
                notification: {
                    id: 1,
                    user_id: 2,
                    concerned_user_id: 1,
                    type: 'new-unanswered-date',
                    title: 'Unanswered Date',
                    message: 'You have an unanswered date'
                },
                date: {
                    id: 1,
                    status: 'unanswered'
                }
            };
            const req = {
                params: {
                    id: 1
                }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                send: jest.fn()
            };

            NotificationService.newUnansweredDate.mockResolvedValue(mockData);

            await NotificationController.newUnansweredDate(req, res);

            expect(NotificationService.newUnansweredDate).toHaveBeenCalledWith(req.params.id);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.send).toHaveBeenCalledWith(mockData);
        });
    });

    describe('markNotificationAsSeen', () => {
        it('should mark all notifications as seen and send 204', async () => {
            const req = {
                user: {
                    id: 1
                }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                send: jest.fn()
            };

            NotificationService.markAllAsSeen.mockResolvedValue([]);

            await NotificationController.markNotificationAsSeen(req, res);

            expect(NotificationService.markAllAsSeen).toHaveBeenCalledWith(req.user.id);
            expect(res.status).toHaveBeenCalledWith(204);
            expect(res.send).toHaveBeenCalled();
        });
    });
});