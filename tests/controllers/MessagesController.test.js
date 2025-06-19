const MessagesService = require('../../services/MessagesService');
const MessagesController = require('../../controllers/MessagesController');
const { createMockReqRes } = require('../utils/testSetup');

jest.mock('../../services/MessagesService');

describe('MessagesController', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getMessagesByUserId', () => {
        it('should get messages and send 200 with messages data', async () => {
            const mockMessages = [
                { id: 1, sender_id: 1, receiver_id: 2, content: 'Hello!' },
                { id: 2, sender_id: 2, receiver_id: 1, content: 'Hi!' }
            ];
            const { mockReq, mockRes } = createMockReqRes({
                req: {
                    user: { id: 1 },
                    params: { id: 2 }
                }
            });

            MessagesService.getMessagesByUserId.mockResolvedValue(mockMessages);

            await MessagesController.getMessagesByUserId(mockReq, mockRes);

            expect(MessagesService.getMessagesByUserId).toHaveBeenCalledWith(1, 2);
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.send).toHaveBeenCalledWith(mockMessages);
        });
    });

    describe('createMessage', () => {
        it('should create message and send 201 with message data', async () => {
            const mockMessage = {
                id: 1,
                sender_id: 1,
                receiver_id: 2,
                content: 'Hello!',
                timestamp: new Date(),
                is_read: false
            };
            const req = {
                user: {
                    id: 1
                },
                body: {
                    receiver_id: 2,
                    content: 'Hello!'
                }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                send: jest.fn()
            };

            MessagesService.createMessage.mockResolvedValue(mockMessage);

            await MessagesController.createMessage(req, res);

            expect(MessagesService.createMessage).toHaveBeenCalledWith(
                req.user.id,
                req.body.receiver_id,
                req.body.content
            );
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.send).toHaveBeenCalledWith(mockMessage);
        });

        it('should return 400 if friend ID is missing', async () => {
            const req = {
                user: {
                    id: 1
                },
                body: {
                    content: 'Hello!'
                }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                send: jest.fn()
            };

            await MessagesController.createMessage(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.send).toHaveBeenCalledWith({ error: 'Friend ID is required' });
        });

        it('should return 400 if message content is missing', async () => {
            const req = {
                user: {
                    id: 1
                },
                body: {
                    receiver_id: 2
                }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                send: jest.fn()
            };

            await MessagesController.createMessage(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.send).toHaveBeenCalledWith({ error: 'Message content is required' });
        });
    });

    describe('readAllMessages', () => {
        it('should mark messages as read and send 204', async () => {
            const req = {
                user: {
                    id: 1
                },
                params: {
                    id: 2
                }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                send: jest.fn()
            };

            MessagesService.readAllMessages.mockResolvedValue(2);

            await MessagesController.readAllMessages(req, res);

            expect(MessagesService.readAllMessages).toHaveBeenCalledWith(req.user.id, req.params.id);
            expect(res.status).toHaveBeenCalledWith(204);
            expect(res.send).toHaveBeenCalled();
        });
    });
});