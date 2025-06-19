const PusherController = require('../../controllers/PusherController.js');
const PusherService = require('../../services/PusherService.js');
const { createMockReqRes } = require('../utils/testSetup');

jest.mock('../../services/PusherService.js');

describe('PusherController', () => {
    let mockReq;
    let mockRes;

    beforeEach(() => {
        const mocks = createMockReqRes({
            req: {
                user: { id: 1 },
                body: {}
            }
        });
        mockReq = mocks.mockReq;
        mockRes = mocks.mockRes;
        jest.clearAllMocks();
    });

    describe('pusherAuthentication', () => {
        it('should authenticate successfully', async () => {
            const mockAuth = { auth: 'auth-token' };
            mockReq.body = {
                socket_id: 'socket123',
                channel_name: 'private-channel'
            };

            PusherService.authenticatePusher.mockResolvedValue(mockAuth);

            await PusherController.pusherAuthentication(mockReq, mockRes);

            expect(PusherService.authenticatePusher).toHaveBeenCalledWith(
                mockReq.user.id,
                mockReq.body.socket_id,
                mockReq.body.channel_name
            );
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(mockAuth);
        });

        it('should handle authentication failure', async () => {
            mockReq.body = {
                socket_id: 'socket123',
                channel_name: 'private-channel'
            };

            const error = new Error('Authentication failed');
            PusherService.authenticatePusher.mockRejectedValue(error);

            try {
                await PusherController.pusherAuthentication(mockReq, mockRes);
            } catch (err) {
                expect(err).toBe(error);
            }

            expect(PusherService.authenticatePusher).toHaveBeenCalledWith(
                mockReq.user.id,
                mockReq.body.socket_id,
                mockReq.body.channel_name
            );
        });
    });

    describe('broadcastOnlineStatus', () => {
        it('should broadcast online status successfully', async () => {
            PusherService.broadcastStatusChange.mockResolvedValue(true);

            await PusherController.broadcastOnlineStatus(mockReq, mockRes);

            expect(PusherService.broadcastStatusChange).toHaveBeenCalledWith(mockReq.user.id, 'online');
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.send).toHaveBeenCalledWith({ message: 'Status broadcasted successfully' });
        });

        it('should handle broadcast failure', async () => {
            const error = new Error('Broadcast failed');
            PusherService.broadcastStatusChange.mockRejectedValue(error);

            try {
                await PusherController.broadcastOnlineStatus(mockReq, mockRes);
            } catch (err) {
                expect(err).toBe(error);
            }

            expect(PusherService.broadcastStatusChange).toHaveBeenCalledWith(mockReq.user.id, 'online');
        });
    });

    describe('broadcastOfflineStatus', () => {
        it('should broadcast offline status successfully', async () => {
            PusherService.broadcastStatusChange.mockResolvedValue(true);

            await PusherController.broadcastOfflineStatus(mockReq, mockRes);

            expect(PusherService.broadcastStatusChange).toHaveBeenCalledWith(mockReq.user.id, 'offline');
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.send).toHaveBeenCalledWith({ message: 'Status broadcasted successfully' });
        });

        it('should handle broadcast failure', async () => {
            const error = new Error('Broadcast failed');
            PusherService.broadcastStatusChange.mockRejectedValue(error);

            try {
                await PusherController.broadcastOfflineStatus(mockReq, mockRes);
            } catch (err) {
                expect(err).toBe(error);
            }

            expect(PusherService.broadcastStatusChange).toHaveBeenCalledWith(mockReq.user.id, 'offline');
        });
    });
});