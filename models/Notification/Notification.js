const db = require('../../config/db.js');

class Notification {

	static async findAllByUserId(userId) {
		try {
			const queryResult = await db.query('SELECT * FROM notifications WHERE user_id = $1', [userId]);
			return queryResult.rows;
		} catch (error) {
			throw new Error('Failed to fetch notifications');
		}
	}

	static async findAllNotSeenNotificationsByUserId(userId) {
		try {
			const queryResult = await db.query('SELECT * FROM notifications WHERE user_id = $1 AND seen = false', [userId]);
			return queryResult.rows;
		} catch (error) {
			throw new Error('Failed to fetch notifications');
		}
	}

	static async createNotification(userId, senderId, type, title, message) {
		try {
			const queryResult = await db.query(
				'INSERT INTO notifications (user_id, concerned_user_id, type, title, message) VALUES ($1, $2, $3, $4, $5) RETURNING *',
				[userId, senderId, type, title, message]
			);
			return queryResult.rows[0];
		} catch (error) {
			throw new Error('Failed to create notification');
		}
	}

	static async markAllAsSeen(userId) {
		try {
			const queryResult = await db.query(
				'UPDATE notifications SET seen = true WHERE user_id = $1 RETURNING *',
				[userId]
			);
			return queryResult.rows;
		} catch (error) {
			throw new Error('Failed to mark notifications as seen');
		}
	}

}

module.exports = Notification;