const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

// Map to store active user connections
const activeUsers = new Map();

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

function setupSocketServer(server) {
  const io = new Server(server, {
    cors: {
		origin: (origin, callback) => {
			callback(null, origin);
		},
		methods: ['GET', 'POST'],
		credentials: true
    }
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication error'));
    }
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      socket.user = decoded;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User ${socket.user.id} connected`);
    
    activeUsers.set(socket.user.id, socket);
    
    // Broadcast user's online status
    io.emit('user-status-change', { 
      userId: socket.user.id, 
      status: 'online' 
    });

    // Handle private messages
    socket.on('private-message', async (data) => {
      try {
        const { receiverId, message } = data;

        // Send to recipient if online
        const recipientSocket = activeUsers.get(parseInt(receiverId));
        if (recipientSocket) {
          recipientSocket.emit('private-message', {
            senderId: socket.user.id,
            message,
            timestamp: new Date()
          });
        }
        
        // Also send back to sender to confirm delivery
        socket.emit('message-delivered', {
          receiverId,
          message,
          timestamp: new Date()
        });
      } catch (error) {
        socket.emit('error', { message: 'Failed to deliver message' });
      }
    });

    // Handle notifications
    socket.on('notification', (data) => {

    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User ${socket.user.id} disconnected`);
      activeUsers.delete(socket.user.id);
    });
  });

  return io;
}

module.exports = { setupSocketServer, activeUsers };