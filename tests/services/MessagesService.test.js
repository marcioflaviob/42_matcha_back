const Messages = require('../../models/Messages/Messages');
const MessagesService = require('../../services/MessagesService');
const PusherService = require('../../services/PusherService');
const NotificationService = require('../../services/NotificationService');

jest.mock('../../models/Messages/Messages');
jest.mock('../../services/PusherService');
jest.mock('../../services/NotificationService');

describe('MessagesService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getMessagesByUserId', () => {
        it('should fetch messages and request status update', async () => {
            const mockMessages = [
                { id: 1, sender_id: 1, receiver_id: 2, content: 'Hello!' },
                { id: 2, sender_id: 2, receiver_id: 1, content: 'Hi!' }
            ];

            Messages.getMessagesByUserId.mockResolvedValue(mockMessages);
            PusherService.requestStatus.mockResolvedValue(true);

            const result = await MessagesService.getMessagesByUserId(1, 2);

            expect(Messages.getMessagesByUserId).toHaveBeenCalledWith(1, 2);
            expect(PusherService.requestStatus).toHaveBeenCalledWith(1);
            expect(result).toEqual(mockMessages);
        });
    });

    describe('createMessage', () => {
        it('should create message, send via Pusher, and create notification', async () => {
            const mockMessage = {
                id: 1,
                sender_id: 1,
                receiver_id: 2,
                content: 'Hello!',
                timestamp: new Date(),
                is_read: false
            };
            const testTimestamp = new Date();

            Messages.createMessage.mockResolvedValue(mockMessage);
            PusherService.sendMessage.mockResolvedValue(true);
            NotificationService.newMessageNotification.mockResolvedValue(true);

            const result = await MessagesService.createMessage(1, 2, 'Hello!', testTimestamp);

            expect(Messages.createMessage).toHaveBeenCalledWith(1, 2, 'Hello!', null, testTimestamp);
            expect(PusherService.sendMessage).toHaveBeenCalledWith(mockMessage);
            expect(NotificationService.newMessageNotification).toHaveBeenCalledWith(2, 1);
            expect(result).toEqual(mockMessage);
        });

        it('should create message with undefined timestamp when not provided', async () => {
            const mockMessage = {
                id: 1,
                sender_id: 1,
                receiver_id: 2,
                content: 'Hello!',
                timestamp: new Date(),
                is_read: false
            };

            Messages.createMessage.mockResolvedValue(mockMessage);
            PusherService.sendMessage.mockResolvedValue(true);
            NotificationService.newMessageNotification.mockResolvedValue(true);

            const result = await MessagesService.createMessage(1, 2, 'Hello!');

            expect(Messages.createMessage).toHaveBeenCalledWith(1, 2, 'Hello!', null, undefined);
            expect(PusherService.sendMessage).toHaveBeenCalledWith(mockMessage);
            expect(NotificationService.newMessageNotification).toHaveBeenCalledWith(2, 1);
            expect(result).toEqual(mockMessage);
        });
    });

    describe('createDateMessage', () => {
        it('should create a message with dateId', async () => {
            const mockMessage = {
                id: 1,
                sender_id: 1,
                receiver_id: 2,
                content: 'Date',
                date_id: 123,
                timestamp: new Date(),
                is_read: false
            };
            const mockDate = { id: 123 };

            Messages.createMessage.mockResolvedValue(mockMessage);

            const result = await MessagesService.createDateMessage(1, 2, 'Date', mockDate);

            expect(Messages.createMessage).toHaveBeenCalledWith(1, 2, 'Date', 123, expect.any(String));
            expect(result).toEqual(mockMessage);
        });
    });

    describe('readAllMessages', () => {
        it('should mark all messages as read', async () => {
            const mockUpdatedCount = 2;

            Messages.readAllMessages.mockResolvedValue(mockUpdatedCount);

            const result = await MessagesService.readAllMessages(1, 2);

            expect(Messages.readAllMessages).toHaveBeenCalledWith(1, 2);
            expect(result).toBe(mockUpdatedCount);
        });
    });
});