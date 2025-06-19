process.env.PUSHER_APP_ID = 'test-app-id';
process.env.PUSHER_KEY = 'test-key';
process.env.PUSHER_SECRET = 'test-secret';
process.env.PUSHER_CLUSTER = 'test-cluster';

jest.mock('pusher', () => {
    const mockAuthorizeChannel = jest.fn();
    return jest.fn().mockImplementation(() => ({
        authorizeChannel: mockAuthorizeChannel,
        __mockAuthorizeChannel: mockAuthorizeChannel
    }));
});

const Pusher = require('pusher');
const { pusher, authenticate } = require('../../utils/PusherMiddleware.js');

describe('PusherMiddleware', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('pusher instance', () => {
        it('should export pusher instance', () => {
            expect(pusher).toBeDefined();
            expect(typeof pusher).toBe('object');
        });

        it('should have authorizeChannel method', () => {
            expect(pusher.authorizeChannel).toBeDefined();
            expect(typeof pusher.authorizeChannel).toBe('function');
        });
    });

    describe('authenticate function', () => {
        it('should call pusher.authorizeChannel with correct parameters', () => {
            const userId = 'user123';
            const socketId = 'socket456';
            const channelName = 'private-user-channel';
            const mockResult = { auth: 'test-auth-string' };

            pusher.authorizeChannel.mockReturnValue(mockResult);

            const result = authenticate(userId, socketId, channelName);

            expect(pusher.authorizeChannel).toHaveBeenCalledWith(
                socketId,
                channelName,
                { user_id: userId }
            );
            expect(result).toBe(mockResult);
        });

        it('should handle different user ID types', () => {
            const mockResult = { auth: 'test-auth-string' };
            pusher.authorizeChannel.mockReturnValue(mockResult);

            authenticate('123', 'socket1', 'channel1');
            expect(pusher.authorizeChannel).toHaveBeenCalledWith(
                'socket1',
                'channel1',
                { user_id: '123' }
            );

            authenticate(456, 'socket2', 'channel2');
            expect(pusher.authorizeChannel).toHaveBeenCalledWith(
                'socket2',
                'channel2',
                { user_id: 456 }
            );
        });

        it('should handle different channel types', () => {
            const mockResult = { auth: 'test-auth-string' };
            pusher.authorizeChannel.mockReturnValue(mockResult);

            authenticate('user1', 'socket1', 'private-user-1');
            expect(pusher.authorizeChannel).toHaveBeenCalledWith(
                'socket1',
                'private-user-1',
                { user_id: 'user1' }
            );

            authenticate('user2', 'socket2', 'presence-chat-room');
            expect(pusher.authorizeChannel).toHaveBeenCalledWith(
                'socket2',
                'presence-chat-room',
                { user_id: 'user2' }
            );
        });

        it('should return the result from pusher.authorizeChannel', () => {
            const mockResult = {
                auth: 'test-auth-string',
                channel_data: JSON.stringify({ user_id: 'user123' })
            };
            pusher.authorizeChannel.mockReturnValue(mockResult);

            const result = authenticate('user123', 'socket456', 'private-channel');

            expect(result).toEqual(mockResult);
        });

        it('should handle pusher authorization errors', () => {
            const error = new Error('Invalid channel name');
            pusher.authorizeChannel.mockImplementation(() => {
                throw error;
            });

            expect(() => {
                authenticate('user123', 'socket456', 'invalid-channel');
            }).toThrow('Invalid channel name');
        });

        it('should handle empty or null parameters', () => {
            const mockResult = { auth: 'test-auth-string' };
            pusher.authorizeChannel.mockReturnValue(mockResult);

            authenticate(null, null, null);
            expect(pusher.authorizeChannel).toHaveBeenCalledWith(
                null,
                null,
                { user_id: null }
            );

            authenticate('', '', '');
            expect(pusher.authorizeChannel).toHaveBeenCalledWith(
                '',
                '',
                { user_id: '' }
            );
        });
    });

    describe('module exports', () => {
        it('should export pusher and authenticate', () => {
            expect(pusher).toBeDefined();
            expect(authenticate).toBeDefined();
            expect(typeof authenticate).toBe('function');
        });
    });
});
