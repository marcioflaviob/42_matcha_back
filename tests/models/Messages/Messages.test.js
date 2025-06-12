const Messages = require('../../../models/Messages/Messages');
const db = require('../../../config/db');
const ApiException = require('../../../exceptions/ApiException');

jest.mock('../../../config/db');

describe('Messages Model', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    beforeEach(() => {
        jest.spyOn(console, 'log').mockImplementation(() => { });
        jest.spyOn(console, 'error').mockImplementation(() => { });
    });

    afterEach(() => {
        console.log.mockRestore();
        console.error.mockRestore();
    });


    describe('createMessage', () => {
        it('should create a new message successfully', async () => {
            const mockMessage = {
                id: 1,
                sender_id: 1,
                receiver_id: 2,
                content: 'Hello!',
                date_id: null,
                timestamp: new Date(),
                is_read: false
            };

            db.query.mockResolvedValueOnce({ rows: [mockMessage] });

            const result = await Messages.createMessage(1, 2, 'Hello!', null);

            expect(db.query).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO messages'),
                [1, 2, 'Hello!', null]
            );
            expect(result).toEqual(mockMessage);
        });

        it('should throw ApiException on database error', async () => {
            db.query.mockRejectedValueOnce(new Error('Database error'));

            await expect(Messages.createMessage(1, 2, 'Hello!', null))
                .rejects
                .toThrow(ApiException);
        });
    });

    describe('getMessagesByUserId', () => {
        it('should get all messages between two users', async () => {
            const mockMessages = [
                { id: 1, sender_id: 1, receiver_id: 2, content: 'Hi!' },
                { id: 2, sender_id: 2, receiver_id: 1, content: 'Hello!' }
            ];

            db.query.mockResolvedValueOnce({ rows: mockMessages });

            const result = await Messages.getMessagesByUserId(1, 2);

            expect(db.query).toHaveBeenCalledWith(
                expect.stringContaining('SELECT * FROM messages'),
                [1, 2]
            );
            expect(result).toEqual(mockMessages);
        });

        it('should throw ApiException on database error', async () => {
            db.query.mockRejectedValueOnce(new Error('Database error'));

            await expect(Messages.getMessagesByUserId(1, 2))
                .rejects
                .toThrow(ApiException);
        });
    });

    describe('readAllMessages', () => {
        it('should mark all messages as read between users', async () => {
            db.query.mockResolvedValueOnce({ rowCount: 2 });

            const result = await Messages.readAllMessages(1, 2);

            expect(db.query).toHaveBeenCalledWith(
                expect.stringContaining('UPDATE messages'),
                [1, 2]
            );
            expect(result).toBe(2);
        });

        it('should throw ApiException on database error', async () => {
            db.query.mockRejectedValueOnce(new Error('Database error'));

            await expect(Messages.readAllMessages(1, 2))
                .rejects
                .toThrow(ApiException);
        });
    });

    describe('getUnreadMessages', () => {
        it('should get all unread messages from a specific sender', async () => {
            const mockUnreadMessages = [
                { id: 1, sender_id: 2, receiver_id: 1, content: 'Hi!', is_read: false }
            ];

            db.query.mockResolvedValueOnce({ rows: mockUnreadMessages });

            const result = await Messages.getUnreadMessages(1, 2);

            expect(db.query).toHaveBeenCalledWith(
                expect.stringContaining('SELECT * FROM messages'),
                [1, 2]
            );
            expect(result).toEqual(mockUnreadMessages);
        });

        it('should throw ApiException on database error', async () => {
            db.query.mockRejectedValueOnce(new Error('Database error'));

            await expect(Messages.getUnreadMessages(1, 2))
                .rejects
                .toThrow(ApiException);
        });
    });
});