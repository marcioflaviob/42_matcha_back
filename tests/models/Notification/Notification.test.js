const Notification = require('../../../models/Notification/Notification');
const db = require('../../../config/db');
const ApiException = require('../../../exceptions/ApiException');

jest.mock('../../../config/db');

describe('Notification Model', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('findAllByUserId', () => {
        it('should return all notifications for a user', async () => {
            const mockNotifications = [
                { id: 1, user_id: 1, message: 'Notification 1', seen: true },
                { id: 2, user_id: 1, message: 'Notification 2', seen: false }
            ];

            db.query.mockResolvedValue({ rows: mockNotifications });

            const result = await Notification.findAllByUserId(1);

            expect(db.query).toHaveBeenCalledWith(
                'SELECT * FROM notifications WHERE user_id = $1',
                [1]
            );
            expect(result).toEqual(mockNotifications);
        });

        it('should throw ApiException on database error', async () => {
            db.query.mockRejectedValue(new Error('Database error'));

            await expect(Notification.findAllByUserId(1))
                .rejects
                .toThrow(ApiException);
        });
    });

    describe('findAllNotSeenNotificationsByUserId', () => {
        it('should return all unseen notifications for a user', async () => {
            const mockUnseenNotifications = [
                { id: 1, user_id: 1, message: 'New notification', seen: false }
            ];

            db.query.mockResolvedValue({ rows: mockUnseenNotifications });

            const result = await Notification.findAllNotSeenNotificationsByUserId(1);

            expect(db.query).toHaveBeenCalledWith(
                'SELECT * FROM notifications WHERE user_id = $1 AND seen = false',
                [1]
            );
            expect(result).toEqual(mockUnseenNotifications);
        });

        it('should throw ApiException on database error', async () => {
            db.query.mockRejectedValue(new Error('Database error'));

            await expect(Notification.findAllNotSeenNotificationsByUserId(1))
                .rejects
                .toThrow(ApiException);
        });
    });

    describe('createNotification', () => {
        it('should create a new notification', async () => {
            const mockNotification = {
                id: 1,
                user_id: 1,
                concerned_user_id: 2,
                type: 'message',
                title: 'New Message',
                message: 'You have a new message',
                seen: false
            };

            db.query.mockResolvedValue({ rows: [mockNotification] });

            const result = await Notification.createNotification(
                1,
                2,
                'message',
                'New Message',
                'You have a new message'
            );

            expect(db.query).toHaveBeenCalledWith(
                'INSERT INTO notifications (user_id, concerned_user_id, type, title, message) VALUES ($1, $2, $3, $4, $5) RETURNING *',
                [1, 2, 'message', 'New Message', 'You have a new message']
            );
            expect(result).toEqual(mockNotification);
        });

        it('should throw ApiException on database error', async () => {
            db.query.mockRejectedValue(new Error('Database error'));

            await expect(Notification.createNotification(1, 2, 'message', 'title', 'content'))
                .rejects
                .toThrow(ApiException);
        });
    });

    describe('markAllAsSeen', () => {
        it('should mark all notifications as seen for a user', async () => {
            const mockUpdatedNotifications = [
                { id: 1, user_id: 1, message: 'Notification 1', seen: true },
                { id: 2, user_id: 1, message: 'Notification 2', seen: true }
            ];

            db.query.mockResolvedValue({ rows: mockUpdatedNotifications });

            const result = await Notification.markAllAsSeen(1);

            expect(db.query).toHaveBeenCalledWith(
                'UPDATE notifications SET seen = true WHERE user_id = $1 RETURNING *',
                [1]
            );
            expect(result).toEqual(mockUpdatedNotifications);
        });

        it('should throw ApiException on database error', async () => {
            db.query.mockRejectedValue(new Error('Database error'));

            await expect(Notification.markAllAsSeen(1))
                .rejects
                .toThrow(ApiException);
        });
    });

    describe('deleteNotification', () => {
        it('should delete a notification and return the deleted notification', async () => {
            const mockDeletedNotification = {
                id: 1,
                user_id: 1,
                concerned_user_id: 2,
                type: 'message',
                title: 'New Message',
                message: 'You have a new message',
                seen: false
            };

            db.query.mockResolvedValue({ rows: [mockDeletedNotification] });

            const result = await Notification.deleteNotification(1);

            expect(db.query).toHaveBeenCalledWith(
                'DELETE FROM notifications WHERE id = $1 RETURNING *',
                [1]
            );
            expect(result).toEqual(mockDeletedNotification);
        });

        it('should throw ApiException when notification not found', async () => {
            db.query.mockResolvedValue({ rows: [] });

            await expect(Notification.deleteNotification(999))
                .rejects
                .toThrow(new ApiException(404, 'Notification not found'));
        });

        it('should throw ApiException on database error', async () => {
            db.query.mockRejectedValue(new Error('Database error'));

            await expect(Notification.deleteNotification(1))
                .rejects
                .toThrow(new ApiException(500, 'Failed to delete notification'));
        });

        it('should re-throw ApiException if it is already an ApiException', async () => {
            const apiError = new ApiException(404, 'Notification not found');
            db.query.mockResolvedValue({ rows: [] });

            await expect(Notification.deleteNotification(1))
                .rejects
                .toThrow(apiError);
        });
    });

    describe('findAllNotificationsByUserIdAndConcernedUserIdAndType', () => {
        it('should return notifications matching user, concerned user, and type', async () => {
            const mockNotifications = [
                {
                    id: 1,
                    user_id: 1,
                    concerned_user_id: 2,
                    type: 'new-like',
                    title: 'New Like',
                    message: 'User liked your profile',
                    seen: false
                },
                {
                    id: 2,
                    user_id: 1,
                    concerned_user_id: 2,
                    type: 'new-like',
                    title: 'New Like',
                    message: 'User liked your profile again',
                    seen: true
                }
            ];

            db.query.mockResolvedValue({ rows: mockNotifications });

            const result = await Notification.findAllNotificationsByUserIdAndConcernedUserIdAndType(
                1, 2, 'new-like'
            );

            expect(db.query).toHaveBeenCalledWith(
                'SELECT * FROM notifications WHERE user_id = $1 AND concerned_user_id = $2 AND type = $3',
                [1, 2, 'new-like']
            );
            expect(result).toEqual(mockNotifications);
        });

        it('should throw ApiException when no notifications found', async () => {
            db.query.mockResolvedValue({ rows: [] });

            await expect(
                Notification.findAllNotificationsByUserIdAndConcernedUserIdAndType(1, 2, 'new-like')
            )
                .rejects
                .toThrow(new ApiException(500, 'No notifications found for the specified criteria'));
        });

        it('should throw ApiException on database error', async () => {
            db.query.mockRejectedValue(new Error('Database error'));

            await expect(
                Notification.findAllNotificationsByUserIdAndConcernedUserIdAndType(1, 2, 'new-like')
            )
                .rejects
                .toThrow(new ApiException(500, 'Failed to fetch notifications by user and type'));
        });

        it('should handle different notification types', async () => {
            const mockMatchNotification = [
                {
                    id: 3,
                    user_id: 1,
                    concerned_user_id: 3,
                    type: 'new-match',
                    title: 'New Match',
                    message: 'You have a new match',
                    seen: false
                }
            ];

            db.query.mockResolvedValue({ rows: mockMatchNotification });

            const result = await Notification.findAllNotificationsByUserIdAndConcernedUserIdAndType(
                1, 3, 'new-match'
            );

            expect(db.query).toHaveBeenCalledWith(
                'SELECT * FROM notifications WHERE user_id = $1 AND concerned_user_id = $2 AND type = $3',
                [1, 3, 'new-match']
            );
            expect(result).toEqual(mockMatchNotification);
        });

        it('should handle edge case with multiple matching notifications', async () => {
            const mockMultipleNotifications = Array.from({ length: 5 }, (_, i) => ({
                id: i + 1,
                user_id: 1,
                concerned_user_id: 2,
                type: 'new-message',
                title: 'New Message',
                message: `Message ${i + 1}`,
                seen: false
            }));

            db.query.mockResolvedValue({ rows: mockMultipleNotifications });

            const result = await Notification.findAllNotificationsByUserIdAndConcernedUserIdAndType(
                1, 2, 'new-message'
            );

            expect(result).toHaveLength(5);
            expect(result).toEqual(mockMultipleNotifications);
        });
    });

    describe('getAllProfileViewNotificationsByUserId', () => {
        it('should return all profile view notifications for a user', async () => {
            const mockProfileViewNotifications = [
                {
                    id: 1,
                    user_id: 1,
                    concerned_user_id: 2,
                    type: 'new-seen',
                    title: 'Profile Viewed',
                    message: 'Someone viewed your profile',
                    seen: false
                },
                {
                    id: 2,
                    user_id: 1,
                    concerned_user_id: 3,
                    type: 'new-seen',
                    title: 'Profile Viewed',
                    message: 'Another user viewed your profile',
                    seen: true
                }
            ];

            db.query.mockResolvedValue({ rows: mockProfileViewNotifications });

            const result = await Notification.getAllProfileViewNotificationsByUserId(1);

            expect(db.query).toHaveBeenCalledWith(
                'SELECT * FROM notifications WHERE user_id = $1 AND type = $2',
                [1, 'new-seen']
            );
            expect(result).toEqual(mockProfileViewNotifications);
        });

        it('should return empty array when no profile view notifications exist', async () => {
            db.query.mockResolvedValue({ rows: [] });

            const result = await Notification.getAllProfileViewNotificationsByUserId(1);

            expect(db.query).toHaveBeenCalledWith(
                'SELECT * FROM notifications WHERE user_id = $1 AND type = $2',
                [1, 'new-seen']
            );
            expect(result).toEqual([]);
        });

        it('should handle multiple profile view notifications correctly', async () => {
            const mockMultipleViewNotifications = Array.from({ length: 10 }, (_, i) => ({
                id: i + 1,
                user_id: 1,
                concerned_user_id: i + 2,
                type: 'new-seen',
                title: 'Profile Viewed',
                message: `User ${i + 2} viewed your profile`,
                seen: i % 2 === 0
            }));

            db.query.mockResolvedValue({ rows: mockMultipleViewNotifications });

            const result = await Notification.getAllProfileViewNotificationsByUserId(1);

            expect(result).toHaveLength(10);
            expect(result).toEqual(mockMultipleViewNotifications);
            expect(result.every(notification => notification.type === 'new-seen')).toBe(true);
        });

        it('should throw ApiException on database error', async () => {
            db.query.mockRejectedValue(new Error('Database connection failed'));

            await expect(Notification.getAllProfileViewNotificationsByUserId(1))
                .rejects
                .toThrow(new ApiException(500, 'Failed to fetch profile viewed notifications'));
        });

        it('should re-throw ApiException if it is already an ApiException', async () => {
            const apiError = new ApiException(503, 'Service temporarily unavailable');
            db.query.mockRejectedValue(apiError);

            await expect(Notification.getAllProfileViewNotificationsByUserId(1))
                .rejects
                .toThrow(apiError);
        });

        it('should handle different user IDs correctly', async () => {
            const mockNotifications = [
                {
                    id: 1,
                    user_id: 5,
                    concerned_user_id: 10,
                    type: 'new-seen',
                    title: 'Profile Viewed',
                    message: 'User viewed your profile',
                    seen: false
                }
            ];

            db.query.mockResolvedValue({ rows: mockNotifications });

            const result = await Notification.getAllProfileViewNotificationsByUserId(5);

            expect(db.query).toHaveBeenCalledWith(
                'SELECT * FROM notifications WHERE user_id = $1 AND type = $2',
                [5, 'new-seen']
            );
            expect(result).toEqual(mockNotifications);
        });

        it('should only return notifications with type "new-seen"', async () => {
            const mockNotifications = [
                {
                    id: 1,
                    user_id: 1,
                    concerned_user_id: 2,
                    type: 'new-seen',
                    title: 'Profile Viewed',
                    message: 'User viewed your profile',
                    seen: false
                }
            ];

            db.query.mockResolvedValue({ rows: mockNotifications });

            await Notification.getAllProfileViewNotificationsByUserId(1);

            // Verify that the query specifically filters by type 'new-seen'
            expect(db.query).toHaveBeenCalledWith(
                'SELECT * FROM notifications WHERE user_id = $1 AND type = $2',
                [1, 'new-seen']
            );
        });

        it('should handle SQL injection attempts safely', async () => {
            const maliciousUserId = "1; DROP TABLE notifications; --";

            db.query.mockResolvedValue({ rows: [] });

            await Notification.getAllProfileViewNotificationsByUserId(maliciousUserId);

            // Verify that parameterized query is used correctly
            expect(db.query).toHaveBeenCalledWith(
                'SELECT * FROM notifications WHERE user_id = $1 AND type = $2',
                [maliciousUserId, 'new-seen']
            );
        });
    });
});