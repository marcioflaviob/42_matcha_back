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
                .toThrow(new ApiException('Failed to send message', 500));
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
                .toThrow(new ApiException('Failed to send message', 500));
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
                .toThrow(new ApiException('Failed to send message', 500));
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
                .toThrow(new ApiException('Failed to send message', 500));
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

        it('should throw error when authentication returns null/undefined', async () => {
            const userId = 'user123';
            const socketId = 'socket456';
            const channelName = 'private-channel';

            authenticate.mockReturnValue(null);

            await expect(PusherService.authenticatePusher(userId, socketId, channelName))
                .rejects
                .toThrow(ApiException);
        });

        it('should throw error when authentication fails with exception', async () => {
            const userId = 'user123';
            const socketId = 'socket456';
            const channelName = 'private-channel';

            authenticate.mockImplementation(() => {
                throw new Error('Authentication service unavailable');
            });

            await expect(PusherService.authenticatePusher(userId, socketId, channelName))
                .rejects
                .toThrow(ApiException);
        });
    });
});