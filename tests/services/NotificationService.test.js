const Notification = require('../../models/Notification/Notification');
const UserService = require('../../services/UserService');
const PusherService = require('../../services/PusherService');
const NotificationService = require('../../services/NotificationService');

jest.mock('../../models/Notification/Notification');
jest.mock('../../services/UserService');
jest.mock('../../services/PusherService');

const originalGetNotSeenNotificationsByUserId = NotificationService.getNotSeenNotificationsByUserId;
const originalCreateNotification = NotificationService.createNotification;

describe('NotificationService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.resetAllMocks();
        NotificationService.getNotSeenNotificationsByUserId = originalGetNotSeenNotificationsByUserId;
        NotificationService.createNotification = originalCreateNotification;
    });

    const mockUser = {
        id: 1,
        first_name: 'John',
        last_name: 'Doe'
    };

    describe('getNotSeenNotificationsByUserId', () => {
        it('should return unseen notifications for user', async () => {
            const mockNotifications = [
                { id: 1, user_id: 1, seen: false },
                { id: 2, user_id: 1, seen: false }
            ];

            Notification.findAllNotSeenNotificationsByUserId.mockResolvedValue(mockNotifications);

            const result = await NotificationService.getNotSeenNotificationsByUserId(1);

            expect(Notification.findAllNotSeenNotificationsByUserId).toHaveBeenCalledWith(1);
            expect(result).toEqual(mockNotifications);
        });
    });

    describe('markAllAsSeen', () => {
        it('should mark all notifications as seen', async () => {
            const mockUpdatedNotifications = [
                { id: 1, user_id: 1, seen: true },
                { id: 2, user_id: 1, seen: true }
            ];

            Notification.markAllAsSeen.mockResolvedValue(mockUpdatedNotifications);

            const result = await NotificationService.markAllAsSeen(1);

            expect(Notification.markAllAsSeen).toHaveBeenCalledWith(1);
            expect(result).toEqual(mockUpdatedNotifications);
        });
    });

    describe('createNotification', () => {
        it('should create and send notification if not already exists', async () => {
            const mockNotification = {
                id: 1,
                user_id: 1,
                concerned_user_id: 2,
                type: 'test',
                title: 'Test',
                message: 'Test message'
            };

            NotificationService.getNotSeenNotificationsByUserId = jest.fn().mockResolvedValue([]);
            Notification.createNotification.mockResolvedValue(mockNotification);
            PusherService.sendNotification.mockResolvedValue(true);

            const result = await NotificationService.createNotification(1, 2, 'test', 'Test', 'Test message');

            expect(Notification.createNotification).toHaveBeenCalledWith(1, 2, 'test', 'Test', 'Test message');
            expect(PusherService.sendNotification).toHaveBeenCalledWith(mockNotification);
            expect(result).toEqual(mockNotification);
        });

        it('should not create notification if similar one exists', async () => {
            const existingNotification = {
                id: 1,
                message: 'Test message'
            };

            NotificationService.getNotSeenNotificationsByUserId = jest.fn().mockResolvedValue([existingNotification]);

            const result = await NotificationService.createNotification(1, 2, 'test', 'Test', 'Test message');

            expect(Notification.createNotification).not.toHaveBeenCalled();
            expect(PusherService.sendNotification).not.toHaveBeenCalled();
            expect(result).toBeUndefined();
        });
    });

    describe('newMessageNotification', () => {
        it('should create a new message notification', async () => {
            UserService.getUserById.mockResolvedValue(mockUser);
            const mockNotification = { id: 1, type: 'new-message' };
            NotificationService.createNotification = jest.fn().mockResolvedValue(mockNotification);

            const result = await NotificationService.newMessageNotification(2, 1);

            expect(UserService.getUserById).toHaveBeenCalledWith(1);
            expect(NotificationService.createNotification).toHaveBeenCalledWith(
                2,
                1,
                'new-message',
                'New Message',
                `You have new messages from ${mockUser.first_name}`
            );
            expect(result).toEqual(mockNotification);
        });
    });

    describe('newMatchNotification', () => {
        it('should create match notifications for both users', async () => {
            const mockUser2 = { id: 2, first_name: 'Jane' };
            UserService.getUserById
                .mockResolvedValueOnce(mockUser2)
                .mockResolvedValueOnce(mockUser);

            const mockNotification = { id: 1, type: 'new-match' };
            NotificationService.createNotification = jest.fn().mockResolvedValue(mockNotification);
            Notification.createNotification.mockResolvedValue({ id: 2, type: 'new-match' });

            const result = await NotificationService.newMatchNotification(1, 2);

            expect(UserService.getUserById).toHaveBeenCalledWith(2);
            expect(UserService.getUserById).toHaveBeenCalledWith(1);
            expect(NotificationService.createNotification).toHaveBeenCalledWith(
                1,
                2,
                'new-match',
                'New Match',
                `You have a new match with ${mockUser2.first_name}`
            );
            expect(NotificationService.createNotification).toHaveBeenCalledWith(
                2,
                1,
                'new-match',
                'New Match',
                `You have a new match with ${mockUser.first_name}`
            );
            expect(result).toEqual(mockNotification);
        });
    });

    describe('newCallNotification', () => {
        it('should create and send a call notification', async () => {
            UserService.getUserById.mockResolvedValue(mockUser);
            PusherService.sendNotification.mockResolvedValue(true);

            const result = await NotificationService.newCallNotification(2, 1);

            expect(UserService.getUserById).toHaveBeenCalledWith(1);
            expect(PusherService.sendNotification).toHaveBeenCalledWith({
                user_id: 2,
                concerned_user_id: 1,
                type: 'new-call',
                title: 'Incoming Call',
                message: `${mockUser.first_name} is calling you`
            });
            expect(result).toEqual({
                user_id: 2,
                concerned_user_id: 1,
                type: 'new-call',
                title: 'Incoming Call',
                message: `${mockUser.first_name} is calling you`
            });
        });
    });

    describe('newStopCallNotification', () => {
        it('should create and send a stop call notification', async () => {
            UserService.getUserById.mockResolvedValue(mockUser);
            PusherService.sendNotification.mockResolvedValue(true);

            const result = await NotificationService.newStopCallNotification(2, 1);

            expect(UserService.getUserById).toHaveBeenCalledWith(1);
            expect(PusherService.sendNotification).toHaveBeenCalledWith({
                user_id: 2,
                concerned_user_id: 1,
                type: 'stop-call',
                title: 'Stop Call',
                message: `${mockUser.first_name} interrupted the call`
            });
            expect(result).toEqual({
                user_id: 2,
                concerned_user_id: 1,
                type: 'stop-call',
                title: 'Stop Call',
                message: `${mockUser.first_name} interrupted the call`
            });
        });
    });

    describe('newRefusedCallNotification', () => {
        it('should create and send a refused call notification', async () => {
            UserService.getUserById.mockResolvedValue(mockUser);
            PusherService.sendNotification.mockResolvedValue(true);

            const result = await NotificationService.newRefusedCallNotification(2, 1);

            expect(UserService.getUserById).toHaveBeenCalledWith(1);
            expect(PusherService.sendNotification).toHaveBeenCalledWith({
                user_id: 2,
                concerned_user_id: 1,
                type: 'new-refused-call',
                title: 'New Refused Call',
                message: `${mockUser.first_name} refused your call`
            });
            expect(result).toEqual({
                user_id: 2,
                concerned_user_id: 1,
                type: 'new-refused-call',
                title: 'New Refused Call',
                message: `${mockUser.first_name} refused your call`
            });
        });
    });

    describe('newLikeNotification', () => {
        it('should create a new like notification', async () => {
            UserService.getUserById.mockResolvedValue(mockUser);
            const mockNotification = { id: 1, type: 'new-like' };
            NotificationService.createNotification = jest.fn().mockResolvedValue(mockNotification);

            const result = await NotificationService.newLikeNotification(2, 1);

            expect(UserService.getUserById).toHaveBeenCalledWith(1);
            expect(NotificationService.createNotification).toHaveBeenCalledWith(
                2,
                1,
                'new-like',
                'New Like',
                `${mockUser.first_name} liked your profile`
            );
            expect(result).toEqual(mockNotification);
        });
    });

    describe('newProfileViewNotification', () => {
        it('should create a new profile view notification', async () => {
            UserService.getUserById.mockResolvedValue(mockUser);
            const mockNotification = { id: 1, type: 'new-profile-view' };
            NotificationService.createNotification = jest.fn().mockResolvedValue(mockNotification);

            const result = await NotificationService.newProfileViewNotification(2, 1);

            expect(UserService.getUserById).toHaveBeenCalledWith(1);
            expect(NotificationService.createNotification).toHaveBeenCalledWith(
                2,
                1,
                'new-profile-view',
                'New Profile View',
                `${mockUser.first_name} viewed your profile`
            );
            expect(result).toEqual(mockNotification);
        });
    });

    describe('newSeenNotification', () => {
        it('should create a new seen notification', async () => {
            UserService.getUserById.mockResolvedValue(mockUser);
            const mockNotification = { id: 1, type: 'new-seen' };
            NotificationService.createNotification = jest.fn().mockResolvedValue(mockNotification);

            const result = await NotificationService.newSeenNotification(2, 1);

            expect(UserService.getUserById).toHaveBeenCalledWith(1);
            expect(NotificationService.createNotification).toHaveBeenCalledWith(
                2,
                1,
                'new-seen',
                'Your profile was viewed',
                `${mockUser.first_name} has seen your profile`
            );
            expect(result).toEqual(mockNotification);
        });
    });

    describe('newUnlikeNotification', () => {
        it('should create a new unlike notification', async () => {
            UserService.getUserById.mockResolvedValue(mockUser);
            const mockNotification = { id: 1, type: 'new-unlike' };
            NotificationService.createNotification = jest.fn().mockResolvedValue(mockNotification);

            const result = await NotificationService.newUnlikeNotification(2, 1);

            expect(UserService.getUserById).toHaveBeenCalledWith(1);
            expect(NotificationService.createNotification).toHaveBeenCalledWith(
                2,
                1,
                'new-unlike',
                'Match undone',
                `${mockUser.first_name} unliked you`
            );
            expect(result).toEqual(mockNotification);
        });
    });

    describe('newDateNotification', () => {
        it('should create a new date notification', async () => {
            UserService.getUserById.mockResolvedValue(mockUser);
            const mockNotification = { id: 1, type: 'new-date' };
            NotificationService.createNotification = jest.fn().mockResolvedValue(mockNotification);

            const result = await NotificationService.newDateNotification(1, 2);

            expect(UserService.getUserById).toHaveBeenCalledWith(1);
            expect(NotificationService.createNotification).toHaveBeenCalledWith(
                2,
                1,
                'new-date',
                'New date',
                `${mockUser.first_name} scheduled a date with you`
            );
            expect(result).toEqual(mockNotification);
        });
    });

    describe('Error handling', () => {
        beforeEach(() => {
            jest.clearAllMocks();
            jest.resetAllMocks();
        });

        it('should handle errors in getNotSeenNotificationsByUserId', async () => {
            const error = new Error('Database error');
            Notification.findAllNotSeenNotificationsByUserId.mockRejectedValue(error);

            await expect(NotificationService.getNotSeenNotificationsByUserId(1))
                .rejects
                .toThrow('Database error');
        });

        it('should handle errors in markAllAsSeen', async () => {
            const error = new Error('Database error');
            Notification.markAllAsSeen.mockRejectedValue(error);

            await expect(NotificationService.markAllAsSeen(1))
                .rejects
                .toThrow('Database error');
        });

        it('should handle errors in createNotification when Notification.createNotification fails', async () => {
            NotificationService.getNotSeenNotificationsByUserId = jest.fn().mockResolvedValue([]);

            const error = new Error('Database error');
            Notification.createNotification.mockRejectedValue(error);

            await expect(NotificationService.createNotification(1, 2, 'test', 'Test', 'Test message'))
                .rejects
                .toThrow('Database error');
        });

        it('should handle UserService errors in notification functions', async () => {
            const error = new Error('User not found');
            UserService.getUserById.mockRejectedValue(error);

            await expect(NotificationService.newMessageNotification(2, 1))
                .rejects
                .toThrow('User not found');

            await expect(NotificationService.newCallNotification(2, 1))
                .rejects
                .toThrow('User not found');

            await expect(NotificationService.newLikeNotification(2, 1))
                .rejects
                .toThrow('User not found');
        });

        it('should handle PusherService errors in call notifications', async () => {
            UserService.getUserById.mockResolvedValue(mockUser);
            const error = new Error('Pusher error');
            PusherService.sendNotification.mockRejectedValue(error);

            await expect(NotificationService.newCallNotification(2, 1))
                .rejects
                .toThrow('Pusher error');

            await expect(NotificationService.newStopCallNotification(2, 1))
                .rejects
                .toThrow('Pusher error');

            await expect(NotificationService.newRefusedCallNotification(2, 1))
                .rejects
                .toThrow('Pusher error');
        });
    });

    describe('Edge cases', () => {
        beforeEach(() => {
            jest.clearAllMocks();
            jest.resetAllMocks();
        });

        it('should handle null/undefined user data', async () => {
            const nullUser = { id: 1, first_name: null };
            UserService.getUserById.mockResolvedValue(nullUser);
            const mockNotification = { id: 1, type: 'new-like' };

            NotificationService.createNotification = jest.fn().mockResolvedValue(mockNotification);

            const result = await NotificationService.newLikeNotification(2, 1);

            expect(NotificationService.createNotification).toHaveBeenCalledWith(
                2,
                1,
                'new-like',
                'New Like',
                `${nullUser.first_name} liked your profile`
            );
            expect(result).toEqual(mockNotification);
        });

        it('should handle empty notifications array in duplicate check', async () => {
            NotificationService.getNotSeenNotificationsByUserId = jest.fn().mockResolvedValue([]);

            const mockNotification = { id: 1, type: 'test' };
            Notification.createNotification.mockResolvedValue(mockNotification);
            PusherService.sendNotification.mockResolvedValue(true);

            const result = await NotificationService.createNotification(1, 2, 'test', 'Test', 'Unique message');

            expect(result).toEqual(mockNotification);
        });

        it('should handle multiple notifications with different messages', async () => {
            const existingNotifications = [
                { id: 1, message: 'Different message' },
                { id: 2, message: 'Another message' }
            ];

            NotificationService.getNotSeenNotificationsByUserId = jest.fn().mockResolvedValue(existingNotifications);

            const mockNotification = { id: 3, type: 'test' };
            Notification.createNotification.mockResolvedValue(mockNotification);
            PusherService.sendNotification.mockResolvedValue(true);

            const result = await NotificationService.createNotification(1, 2, 'test', 'Test', 'New unique message');

            expect(result).toEqual(mockNotification);
        });

        it('should find exact message match in duplicate check', async () => {
            const existingNotifications = [
                { id: 1, message: 'Different message' },
                { id: 2, message: 'Exact match' },
                { id: 3, message: 'Another message' }
            ];

            NotificationService.getNotSeenNotificationsByUserId = jest.fn().mockResolvedValue(existingNotifications);

            const result = await NotificationService.createNotification(1, 2, 'test', 'Test', 'Exact match');

            expect(Notification.createNotification).not.toHaveBeenCalled();
            expect(result).toBeUndefined();
        });
    });
});