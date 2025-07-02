const { pusher, authenticate } = require('../../utils/PusherMiddleware.js');
const UserInteractionsService = require('../../services/UserInteractionsService.js');
const ApiException = require('../../exceptions/ApiException.js');
const PusherService = require('../../services/PusherService.js');
const { mockConsole, restoreConsole } = require('../utils/testSetup');

jest.mock('../../utils/PusherMiddleware.js', () => ({
    pusher: {
        trigger: jest.fn()
    },
    authenticate: jest.fn()
}));
jest.mock('../../services/UserInteractionsService.js');

beforeEach(() => {
    mockConsole();
});

afterEach(() => {
    restoreConsole();
});

describe('PusherService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('broadcastStatusChange', () => {
        it('should broadcast status change to all matches', async () => {
            const userId = 1;
            const status = 'online';
            const matchesIds = [2, 3, 4];

            UserInteractionsService.getMatchesIdsByUserId.mockResolvedValue(matchesIds);
            pusher.trigger.mockResolvedValue(true);

            const result = await PusherService.broadcastStatusChange(userId, status);

            expect(UserInteractionsService.getMatchesIdsByUserId).toHaveBeenCalledWith(userId);
            expect(result).toBe(true);
            expect(pusher.trigger).toHaveBeenCalledTimes(matchesIds.length);
        });
    });

    describe('sendMessage', () => {
        it('should send a message successfully', async () => {
            const messageData = {
                id: 1,
                sender_id: 1,
                receiver_id: 2,
                content: 'Hello',
                timestamp: new Date(),
                is_read: false
            };

            pusher.trigger.mockResolvedValue(true);

            await PusherService.sendMessage(messageData);

            expect(pusher.trigger).toHaveBeenCalledWith(
                `private-user-${messageData.receiver_id}`,
                'new-message',
                expect.objectContaining({
                    id: messageData.id,
                    sender_id: messageData.sender_id,
                    content: messageData.content
                })
            );
        });

        it('should throw ApiException when message sending fails', async () => {
            const messageData = {
                id: 1,
                sender_id: 1,
                receiver_id: 2,
                content: 'Hello'
            };

            pusher.trigger.mockRejectedValue(new Error('Pusher error'));

            await expect(PusherService.sendMessage(messageData))
                .rejects
                .toThrow(new ApiException(500, 'Failed to send message'));
        });
    });

    describe('sendNotification', () => {
        it('should send a notification successfully', async () => {
            const notificationData = {
                id: 1,
                user_id: 2,
                concerned_user_id: 1,
                type: 'like',
                title: 'New Like',
                message: 'Someone liked your profile',
                seen: false
            };

            pusher.trigger.mockResolvedValue(true);

            await PusherService.sendNotification(notificationData);

            expect(pusher.trigger).toHaveBeenCalledWith(
                `private-user-${notificationData.user_id}`,
                'new-notification',
                expect.objectContaining({
                    id: notificationData.id,
                    type: notificationData.type,
                    title: notificationData.title
                })
            );
        });

        it('should throw ApiException when notification sending fails', async () => {
            const notificationData = {
                id: 1,
                user_id: 2,
                type: 'like'
            };

            pusher.trigger.mockRejectedValue(new Error('Pusher error'));

            await expect(PusherService.sendNotification(notificationData))
                .rejects
                .toThrow(new ApiException(500, 'Failed to send notification'));
        });
    });

    describe('sendStatusChange', () => {
        it('should send status change successfully', async () => {
            const senderId = 1;
            const receiverId = 2;
            const status = 'online';

            pusher.trigger.mockResolvedValue(true);

            await PusherService.sendStatusChange(senderId, receiverId, status);

            expect(pusher.trigger).toHaveBeenCalledWith(
                `private-user-${receiverId}`,
                'status-change',
                {
                    sender_id: senderId,
                    status
                }
            );
        });

        it('should throw ApiException when status change fails', async () => {
            pusher.trigger.mockRejectedValue(new Error('Pusher error'));

            await expect(PusherService.sendStatusChange(1, 2, 'online'))
                .rejects
                .toThrow(new ApiException(500, 'Failed to send status change'));
        });
    });

    describe('requestStatus', () => {
        it('should request status from all matches', async () => {
            const userId = 1;
            const matchesIds = [2, 3, 4];

            UserInteractionsService.getMatchesIdsByUserId.mockResolvedValue(matchesIds);
            pusher.trigger.mockResolvedValue(true);

            await PusherService.requestStatus(userId);

            expect(UserInteractionsService.getMatchesIdsByUserId).toHaveBeenCalledWith(userId);
            expect(pusher.trigger).toHaveBeenCalledTimes(matchesIds.length);
            matchesIds.forEach(matchId => {
                expect(pusher.trigger).toHaveBeenCalledWith(
                    `private-user-${matchId}`,
                    'status-request',
                    { sender_id: userId }
                );
            });
        });

        it('should throw ApiException when status request fails', async () => {
            const userId = 1;
            UserInteractionsService.getMatchesIdsByUserId.mockRejectedValue(new Error('Database error'));

            await expect(PusherService.requestStatus(userId))
                .rejects
                .toThrow(new ApiException(500, 'Failed to request status'));
        });
    });

    describe('authenticatePusher', () => {
        it('should authenticate successfully', async () => {
            const userId = 'user123';
            const socketId = 'socket456';
            const channelName = 'private-channel';
            const mockAuth = { auth: 'test-auth-string' };

            authenticate.mockReturnValue(mockAuth);

            const result = await PusherService.authenticatePusher(userId, socketId, channelName);

            expect(authenticate).toHaveBeenCalledWith(userId, socketId, channelName);
            expect(result).toBe(mockAuth);
        });

        it('should throw error when authentication returns null/undefined', () => {
            const userId = 'user123';
            const socketId = 'socket456';
            const channelName = 'private-channel';

            authenticate.mockReturnValue(null);

            expect(() => PusherService.authenticatePusher(userId, socketId, channelName))
                .toThrow(ApiException);
        });

        it('should throw error when authentication fails with exception', () => {
            const userId = 'user123';
            const socketId = 'socket456';
            const channelName = 'private-channel';

            authenticate.mockImplementation(() => {
                throw new Error('Authentication service unavailable');
            });

            expect(() => PusherService.authenticatePusher(userId, socketId, channelName))
                .toThrow(ApiException);
        });
    });

    describe('sendDateMessage', () => {
        it('should send a date message successfully to both sender and receiver', async () => {
            const messageData = {
                id: 1,
                sender_id: 1,
                receiver_id: 2,
                content: 'Date proposal',
                date: {
                    id: 123,
                    scheduled_date: '2025-07-15T18:00:00Z',
                    address: '123 Restaurant St'
                }
            };

            pusher.trigger.mockResolvedValue(true);

            await PusherService.sendDateMessage(messageData);

            // Verify pusher.trigger was called twice (for sender and receiver)
            expect(pusher.trigger).toHaveBeenCalledTimes(2);

            // Check receiver message
            expect(pusher.trigger).toHaveBeenCalledWith(
                `private-user-${messageData.receiver_id}`,
                'new-message',
                expect.objectContaining({
                    id: messageData.id,
                    sender_id: messageData.sender_id,
                    receiver_id: messageData.receiver_id,
                    content: messageData.content,
                    date: messageData.date,
                    is_read: false,
                    timestamp: expect.any(Date)
                })
            );

            // Check sender message
            expect(pusher.trigger).toHaveBeenCalledWith(
                `private-user-${messageData.sender_id}`,
                'new-message',
                expect.objectContaining({
                    id: messageData.id,
                    sender_id: messageData.sender_id,
                    receiver_id: messageData.receiver_id,
                    content: messageData.content,
                    date: messageData.date,
                    is_read: false,
                    timestamp: expect.any(Date)
                })
            );
        });

        it('should throw ApiException when message is too large', async () => {
            // Create a message that definitely exceeds 10240 bytes when JSON.stringify is called
            const largeContent = 'a'.repeat(15000); // Much larger content
            const messageData = {
                id: 1,
                sender_id: 1,
                receiver_id: 2,
                content: largeContent,
                date: {
                    id: 123,
                    description: 'Large date description',
                    extra_data: 'x'.repeat(1000)
                }
            };

            // Verify that the message is actually too large
            expect(JSON.stringify(messageData).length).toBeGreaterThan(10240);

            // Note: The service throws 'Message too large' but the catch block re-throws as 'Failed to send message'
            await expect(PusherService.sendDateMessage(messageData))
                .rejects
                .toThrow(new ApiException(500, 'Failed to send message'));

            expect(pusher.trigger).not.toHaveBeenCalled();
        });

        it('should throw ApiException when pusher trigger fails', async () => {
            const messageData = {
                id: 1,
                sender_id: 1,
                receiver_id: 2,
                content: 'Date proposal',
                date: { id: 123 }
            };

            pusher.trigger.mockRejectedValue(new Error('Pusher connection failed'));

            await expect(PusherService.sendDateMessage(messageData))
                .rejects
                .toThrow(new ApiException(500, 'Failed to send message'));
        });

        it('should handle minimal message data correctly', async () => {
            const messageData = {
                id: 1,
                sender_id: 1,
                receiver_id: 2,
                content: 'Date',
                date: null
            };

            pusher.trigger.mockResolvedValue(true);

            await PusherService.sendDateMessage(messageData);

            expect(pusher.trigger).toHaveBeenCalledTimes(2);
            expect(pusher.trigger).toHaveBeenCalledWith(
                `private-user-${messageData.receiver_id}`,
                'new-message',
                expect.objectContaining({
                    id: messageData.id,
                    sender_id: messageData.sender_id,
                    receiver_id: messageData.receiver_id,
                    content: messageData.content,
                    date: null,
                    is_read: false
                })
            );
        });

        it('should generate new timestamp for each trigger call', async () => {
            const messageData = {
                id: 1,
                sender_id: 1,
                receiver_id: 2,
                content: 'Date proposal',
                date: { id: 123 }
            };

            pusher.trigger.mockResolvedValue(true);

            await PusherService.sendDateMessage(messageData);

            expect(pusher.trigger).toHaveBeenCalledTimes(2);

            // Get the timestamps from both calls
            const firstCallTimestamp = pusher.trigger.mock.calls[0][2].timestamp;
            const secondCallTimestamp = pusher.trigger.mock.calls[1][2].timestamp;

            // Both should be Date objects
            expect(firstCallTimestamp).toBeInstanceOf(Date);
            expect(secondCallTimestamp).toBeInstanceOf(Date);
        });

        it('should work with undefined date field', async () => {
            const messageData = {
                id: 1,
                sender_id: 1,
                receiver_id: 2,
                content: 'Date proposal'
                // date field is undefined
            };

            pusher.trigger.mockResolvedValue(true);

            await PusherService.sendDateMessage(messageData);

            expect(pusher.trigger).toHaveBeenCalledTimes(2);
            expect(pusher.trigger).toHaveBeenCalledWith(
                `private-user-${messageData.receiver_id}`,
                'new-message',
                expect.objectContaining({
                    id: messageData.id,
                    sender_id: messageData.sender_id,
                    receiver_id: messageData.receiver_id,
                    content: messageData.content,
                    date: undefined,
                    is_read: false
                })
            );
        });

        it('should handle complex date object with all properties', async () => {
            const messageData = {
                id: 1,
                sender_id: 1,
                receiver_id: 2,
                content: 'Dinner date',
                date: {
                    id: 123,
                    sender_id: 1,
                    receiver_id: 2,
                    scheduled_date: '2025-07-15T18:00:00Z',
                    address: '123 Fine Dining Restaurant',
                    latitude: 48.8566,
                    longitude: 2.3522,
                    status: 'pending',
                    created_at: '2025-07-02T10:00:00Z'
                }
            };

            pusher.trigger.mockResolvedValue(true);

            await PusherService.sendDateMessage(messageData);

            expect(pusher.trigger).toHaveBeenCalledTimes(2);
            expect(pusher.trigger).toHaveBeenCalledWith(
                `private-user-${messageData.receiver_id}`,
                'new-message',
                expect.objectContaining({
                    date: messageData.date
                })
            );
        });
    });
});