const Notification = require('../../models/Notification/Notification');
const UserService = require('../../services/UserService');
const PusherService = require('../../services/PusherService');
const NotificationService = require('../../services/NotificationService');

jest.mock('../../models/Notification/Notification');
jest.mock('../../services/UserService');
jest.mock('../../services/PusherService');
jest.mock('../../services/UserPictureService');

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
                `You have a new match with ${mockUser2.first_name}`,
                mockUser2
            );
            expect(NotificationService.createNotification).toHaveBeenCalledWith(
                2,
                1,
                'new-match',
                'New Match',
                `You have a new match with ${mockUser.first_name}`,
                mockUser
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

    describe('getAllProfileViewNotificationsByUserIdWithPictures', () => {
        const UserPicturesService = require('../../services/UserPictureService');

        beforeEach(() => {
            jest.clearAllMocks();
        });

        it('should return profile view notifications with pictures', async () => {
            const mockNotifications = [
                {
                    id: 1,
                    user_id: 1,
                    concerned_user_id: 2,
                    type: 'new-seen',
                    title: 'Profile Viewed',
                    message: 'Someone viewed your profile'
                },
                {
                    id: 2,
                    user_id: 1,
                    concerned_user_id: 3,
                    type: 'new-seen',
                    title: 'Profile Viewed',
                    message: 'Another user viewed your profile'
                }
            ];

            const mockPictures1 = [
                { id: 1, user_id: 2, url: 'picture1.jpg' },
                { id: 2, user_id: 2, url: 'picture2.jpg' }
            ];

            const mockPictures2 = [
                { id: 3, user_id: 3, url: 'picture3.jpg' }
            ];

            Notification.getAllProfileViewNotificationsByUserId.mockResolvedValue(mockNotifications);
            UserPicturesService.getUserPictures
                .mockResolvedValueOnce(mockPictures1)
                .mockResolvedValueOnce(mockPictures2);

            const result = await NotificationService.getAllProfileViewNotificationsByUserIdWithPictures(1);

            expect(Notification.getAllProfileViewNotificationsByUserId).toHaveBeenCalledWith(1);
            expect(UserPicturesService.getUserPictures).toHaveBeenCalledWith(2);
            expect(UserPicturesService.getUserPictures).toHaveBeenCalledWith(3);
            expect(result).toEqual([
                {
                    ...mockNotifications[0],
                    pictures: mockPictures1
                },
                {
                    ...mockNotifications[1],
                    pictures: mockPictures2
                }
            ]);
        });

        it('should return empty array when no notifications exist', async () => {
            Notification.getAllProfileViewNotificationsByUserId.mockResolvedValue([]);

            const result = await NotificationService.getAllProfileViewNotificationsByUserIdWithPictures(1);

            expect(Notification.getAllProfileViewNotificationsByUserId).toHaveBeenCalledWith(1);
            expect(UserPicturesService.getUserPictures).not.toHaveBeenCalled();
            expect(result).toEqual([]);
        });

        it('should handle notifications with empty pictures arrays', async () => {
            const mockNotifications = [
                {
                    id: 1,
                    user_id: 1,
                    concerned_user_id: 2,
                    type: 'new-seen',
                    title: 'Profile Viewed',
                    message: 'Someone viewed your profile'
                }
            ];

            Notification.getAllProfileViewNotificationsByUserId.mockResolvedValue(mockNotifications);
            UserPicturesService.getUserPictures.mockResolvedValue([]);

            const result = await NotificationService.getAllProfileViewNotificationsByUserIdWithPictures(1);

            expect(result).toEqual([
                {
                    ...mockNotifications[0],
                    pictures: []
                }
            ]);
        });

        it('should handle UserPicturesService errors gracefully', async () => {
            const mockNotifications = [
                {
                    id: 1,
                    user_id: 1,
                    concerned_user_id: 2,
                    type: 'new-seen',
                    title: 'Profile Viewed',
                    message: 'Someone viewed your profile'
                }
            ];

            Notification.getAllProfileViewNotificationsByUserId.mockResolvedValue(mockNotifications);
            UserPicturesService.getUserPictures.mockRejectedValue(new Error('Pictures service error'));

            await expect(NotificationService.getAllProfileViewNotificationsByUserIdWithPictures(1))
                .rejects
                .toThrow('Pictures service error');
        });

        it('should handle Notification model errors', async () => {
            Notification.getAllProfileViewNotificationsByUserId.mockRejectedValue(new Error('Database error'));

            await expect(NotificationService.getAllProfileViewNotificationsByUserIdWithPictures(1))
                .rejects
                .toThrow('Database error');
        });

        it('should handle multiple notifications with mixed picture results', async () => {
            const mockNotifications = [
                {
                    id: 1,
                    user_id: 1,
                    concerned_user_id: 2,
                    type: 'new-seen',
                    title: 'Profile Viewed',
                    message: 'User 2 viewed your profile'
                },
                {
                    id: 2,
                    user_id: 1,
                    concerned_user_id: 3,
                    type: 'new-seen',
                    title: 'Profile Viewed',
                    message: 'User 3 viewed your profile'
                },
                {
                    id: 3,
                    user_id: 1,
                    concerned_user_id: 4,
                    type: 'new-seen',
                    title: 'Profile Viewed',
                    message: 'User 4 viewed your profile'
                }
            ];

            const mockPictures1 = [{ id: 1, user_id: 2, url: 'picture1.jpg' }];
            const mockPictures2 = [];
            const mockPictures3 = [
                { id: 2, user_id: 4, url: 'picture2.jpg' },
                { id: 3, user_id: 4, url: 'picture3.jpg' }
            ];

            Notification.getAllProfileViewNotificationsByUserId.mockResolvedValue(mockNotifications);
            UserPicturesService.getUserPictures
                .mockResolvedValueOnce(mockPictures1)
                .mockResolvedValueOnce(mockPictures2)
                .mockResolvedValueOnce(mockPictures3);

            const result = await NotificationService.getAllProfileViewNotificationsByUserIdWithPictures(1);

            expect(result).toHaveLength(3);
            expect(result[0].pictures).toEqual(mockPictures1);
            expect(result[1].pictures).toEqual(mockPictures2);
            expect(result[2].pictures).toEqual(mockPictures3);
        });
    });

    describe('deleteNotification', () => {
        it('should delete a notification successfully', async () => {
            const mockDeletedNotification = {
                id: 1,
                user_id: 1,
                concerned_user_id: 2,
                type: 'new-like',
                title: 'New Like',
                message: 'Someone liked your profile'
            };

            Notification.deleteNotification.mockResolvedValue(mockDeletedNotification);

            const result = await NotificationService.deleteNotification(1);

            expect(Notification.deleteNotification).toHaveBeenCalledWith(1);
            expect(result).toEqual(mockDeletedNotification);
        });

        it('should handle deletion errors', async () => {
            const error = new Error('Notification not found');
            Notification.deleteNotification.mockRejectedValue(error);

            await expect(NotificationService.deleteNotification(999))
                .rejects
                .toThrow('Notification not found');
        });

        it('should handle database errors during deletion', async () => {
            const error = new Error('Database connection failed');
            Notification.deleteNotification.mockRejectedValue(error);

            await expect(NotificationService.deleteNotification(1))
                .rejects
                .toThrow('Database connection failed');
        });

        it('should handle different notification IDs', async () => {
            const mockNotification1 = { id: 5, message: 'Notification 5' };
            const mockNotification2 = { id: 10, message: 'Notification 10' };

            Notification.deleteNotification
                .mockResolvedValueOnce(mockNotification1)
                .mockResolvedValueOnce(mockNotification2);

            const result1 = await NotificationService.deleteNotification(5);
            const result2 = await NotificationService.deleteNotification(10);

            expect(Notification.deleteNotification).toHaveBeenCalledWith(5);
            expect(Notification.deleteNotification).toHaveBeenCalledWith(10);
            expect(result1).toEqual(mockNotification1);
            expect(result2).toEqual(mockNotification2);
        });
    });

    describe('getNotificationByUserIdAndConcernedUserIdAndType', () => {
        it('should return the first notification matching criteria', async () => {
            const mockNotifications = [
                {
                    id: 1,
                    user_id: 1,
                    concerned_user_id: 2,
                    type: 'new-like',
                    title: 'New Like',
                    message: 'Someone liked your profile'
                },
                {
                    id: 2,
                    user_id: 1,
                    concerned_user_id: 2,
                    type: 'new-like',
                    title: 'New Like',
                    message: 'Another like notification'
                }
            ];

            Notification.findAllNotificationsByUserIdAndConcernedUserIdAndType.mockResolvedValue(mockNotifications);

            const result = await NotificationService.getNotificationByUserIdAndConcernedUserIdAndType(1, 2, 'new-like');

            expect(Notification.findAllNotificationsByUserIdAndConcernedUserIdAndType)
                .toHaveBeenCalledWith(1, 2, 'new-like');
            expect(result).toEqual(mockNotifications[0]);
        });

        it('should handle when no notifications are found', async () => {
            Notification.findAllNotificationsByUserIdAndConcernedUserIdAndType.mockRejectedValue(
                new Error('No notifications found for the specified criteria')
            );

            await expect(
                NotificationService.getNotificationByUserIdAndConcernedUserIdAndType(1, 2, 'new-like')
            ).rejects.toThrow('No notifications found for the specified criteria');
        });

        it('should handle different notification types', async () => {
            const mockMatchNotifications = [
                {
                    id: 3,
                    user_id: 1,
                    concerned_user_id: 3,
                    type: 'new-match',
                    title: 'New Match',
                    message: 'You have a new match'
                }
            ];

            const mockMessageNotifications = [
                {
                    id: 4,
                    user_id: 1,
                    concerned_user_id: 3,
                    type: 'new-message',
                    title: 'New Message',
                    message: 'You have a new message'
                }
            ];

            Notification.findAllNotificationsByUserIdAndConcernedUserIdAndType
                .mockResolvedValueOnce(mockMatchNotifications)
                .mockResolvedValueOnce(mockMessageNotifications);

            const matchResult = await NotificationService.getNotificationByUserIdAndConcernedUserIdAndType(1, 3, 'new-match');
            const messageResult = await NotificationService.getNotificationByUserIdAndConcernedUserIdAndType(1, 3, 'new-message');

            expect(matchResult).toEqual(mockMatchNotifications[0]);
            expect(messageResult).toEqual(mockMessageNotifications[0]);
        });

        it('should handle database errors', async () => {
            const error = new Error('Database connection failed');
            Notification.findAllNotificationsByUserIdAndConcernedUserIdAndType.mockRejectedValue(error);

            await expect(
                NotificationService.getNotificationByUserIdAndConcernedUserIdAndType(1, 2, 'new-like')
            ).rejects.toThrow('Database connection failed');
        });

        it('should handle single notification result', async () => {
            const mockSingleNotification = [
                {
                    id: 5,
                    user_id: 1,
                    concerned_user_id: 4,
                    type: 'new-seen',
                    title: 'Profile Viewed',
                    message: 'User viewed your profile'
                }
            ];

            Notification.findAllNotificationsByUserIdAndConcernedUserIdAndType.mockResolvedValue(mockSingleNotification);

            const result = await NotificationService.getNotificationByUserIdAndConcernedUserIdAndType(1, 4, 'new-seen');

            expect(result).toEqual(mockSingleNotification[0]);
        });

        it('should handle edge case with different user combinations', async () => {
            const mockNotifications1 = [{ id: 1, user_id: 10, concerned_user_id: 20, type: 'new-like' }];
            const mockNotifications2 = [{ id: 2, user_id: 30, concerned_user_id: 40, type: 'new-match' }];

            Notification.findAllNotificationsByUserIdAndConcernedUserIdAndType
                .mockResolvedValueOnce(mockNotifications1)
                .mockResolvedValueOnce(mockNotifications2);

            const result1 = await NotificationService.getNotificationByUserIdAndConcernedUserIdAndType(10, 20, 'new-like');
            const result2 = await NotificationService.getNotificationByUserIdAndConcernedUserIdAndType(30, 40, 'new-match');

            expect(Notification.findAllNotificationsByUserIdAndConcernedUserIdAndType)
                .toHaveBeenCalledWith(10, 20, 'new-like');
            expect(Notification.findAllNotificationsByUserIdAndConcernedUserIdAndType)
                .toHaveBeenCalledWith(30, 40, 'new-match');
            expect(result1).toEqual(mockNotifications1[0]);
            expect(result2).toEqual(mockNotifications2[0]);
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