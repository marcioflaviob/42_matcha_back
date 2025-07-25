const db = require('../../config/db.js');
const ApiException = require('../../exceptions/ApiException.js');

class Messages {
	static async createMessage(senderId, receiverId, content, date_id, timestamp) {
		try {
			const result = await db.query(`
				INSERT INTO messages (sender_id, receiver_id, content, date_id, timestamp)
				VALUES ($1, $2, $3, $4, $5::timestamptz)
				RETURNING *;
			`, [senderId, receiverId, content, date_id, timestamp]);
			return result.rows[0];
		} catch (error) {
			console.error('Error creating message:', error);
			throw new ApiException(500, 'Failed to create message');
		}
	}

	static async getMessagesByUserId(userId, friendId) {
		try {
			const result = await db.query(`
				SELECT * FROM messages
				WHERE (sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1)
				ORDER BY timestamp ASC;
			`, [userId, friendId]);
			return result.rows;
		} catch (error) {
			console.error('Error fetching messages:', error);
			throw new ApiException(500, 'Failed to fetch messages');
		}
	}

	static async readAllMessages(userId, friendId) {
		try {
			const result = await db.query(`
				UPDATE messages
				SET is_read = true
				WHERE sender_id = $2 AND receiver_id = $1 AND is_read = false;
			`, [userId, friendId]);
			return result.rowCount;
		} catch (error) {
			console.error('Error reading messages:', error);
			throw new ApiException(500, 'Failed to read messages');
		}
	}

	static async getUnreadMessages(userId, friendId) {
		try {
			const result = await db.query(`
				SELECT * FROM messages
				WHERE sender_id = $2 AND receiver_id = $1 AND is_read = false;
			`, [userId, friendId]);
			return result.rows;
		} catch (error) {
			console.error('Error fetching unread messages:', error);
			throw new ApiException(500, 'Failed to fetch unread messages');
		}
	}
}

module.exports = Messages;