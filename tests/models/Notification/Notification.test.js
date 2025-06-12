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
});