const db = require('../../config/db.js');
const ApiException = require('../../exceptions/ApiException.js');

class Notification {

	static async findAllByUserId(userId) {
		try {
			const queryResult = await db.query('SELECT * FROM notifications WHERE user_id = $1', [userId]);
			return queryResult.rows;
		} catch (error) {
			throw new ApiException(500, 'Failed to fetch notifications');
		}
	}

	static async findAllNotSeenNotificationsByUserId(userId) {
		try {
			const queryResult = await db.query('SELECT * FROM notifications WHERE user_id = $1 AND seen = false', [userId]);
			return queryResult.rows;
		} catch (error) {
			throw new ApiException(500, 'Failed to fetch unseen notifications');
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
			throw new ApiException(500, 'Failed to create notification');
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
			throw new ApiException(500, 'Failed to mark notifications as seen');
		}
	}

	static async deleteNotification(notificationId) {
		try {
			const queryResult = await db.query(
				'DELETE FROM notifications WHERE id = $1 RETURNING *',
				[notificationId]
			);
			if (queryResult.rows.length === 0) {
				throw new ApiException(404, 'Notification not found');
			}
			return queryResult.rows[0];
		} catch (error) {
			if (error instanceof ApiException) throw error;
			throw new ApiException(500, 'Failed to delete notification');
		}
	}

	static async findAllNotificationsByUserIdAndConcernedUserIdAndType(userId, concernedUserId, type) {
		try {
			const queryResult = await db.query(
				'SELECT * FROM notifications WHERE user_id = $1 AND concerned_user_id = $2 AND type = $3',
				[userId, concernedUserId, type]
			);
			if (queryResult.rows.length === 0) throw new ApiException(404, 'No notifications found for the specified criteria');
			return queryResult.rows;
		} catch (error) {
			if (error instanceof ApiException) throw error;
			throw new ApiException(500, 'Failed to fetch notifications by user and type');
		}
	}

	static async getAllProfileViewNotificationsByUserId(userId) {
		try {
			const queryResult = await db.query(
				'SELECT * FROM notifications WHERE user_id = $1 AND type = $2',
				[userId, 'new-seen']
			);
			return queryResult.rows;
		} catch (error) {
			if (error instanceof ApiException) throw error;
			throw new ApiException(500, 'Failed to fetch profile viewed notifications');
		}
	}

}

module.exports = Notification;