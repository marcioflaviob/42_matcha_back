const db = require('../../config/db.js');

class UserInteractions {

	static async getLikeCountByUserId(userId) {
		try {
			const result = await db.query(
				'SELECT * FROM user_interactions WHERE user2 = $1 AND interaction_type = $2',
				[userId, 'like']
			);
			return result.rows.length;
		} catch (error) {
			console.error('Error fetching like count:', error);
			throw new Error('Failed to fetch like count');
		}
	}

	static async getLikesReceivedByUserId(userId) {
		try {
			const result = await db.query(
				'SELECT * FROM user_interactions WHERE user2 = $1 AND interaction_type = $2',
				[userId, 'like']
			);
			return result.rows;
		} catch (error) {
			console.error('Error fetching likes:', error);
			throw new Error('Failed to fetch likes');
		}
	}

	static async getLikesGivenByUserId(userId) {
		try {
			const result = await db.query(
				'SELECT * FROM user_interactions WHERE user1 = $1 AND interaction_type = $2',
				[userId, 'like']
			);
			return result.rows;
		} catch (error) {
			console.error('Error fetching likes:', error);
			throw new Error('Failed to fetch likes');
		}
	}

	static async likeUser(userId, user2Id) {
		try {
			const result = await db.query(
				'INSERT INTO user_interactions (user1, user2, interaction_type) VALUES ($1, $2, $3) RETURNING *',
				[userId, user2Id, 'like']
			);
			return result.rows[0];
		} catch (error) {
			console.error('Error liking user:', error);
			throw new Error('Failed to like user');
		}
	}

	static async getProfileViewsByUserId(userId) {
		try {
			const result = await db.query(
				'SELECT * FROM user_interactions WHERE user2 = $1 AND interaction_type = $2',
				[userId, 'view']
			);
			return result.rows;
		} catch (error) {
			console.error('Error fetching profile views:', error);
			throw new Error('Failed to fetch profile views');
		}
	}

	static async matchUsers(userId, user2Id) {
		try {
			const result = await db.query(
				'INSERT INTO user_interactions (user1, user2, interaction_type) VALUES ($1, $2, $3) RETURNING *',
				[userId, user2Id, 'match']
			);
			return result.rows[0];
		} catch (error) {
			console.error('Error matching users:', error);
			throw new Error('Failed to match users');
		}
	}

	static async getMatchesByUserId(userId) {
		try {
			const result = await db.query(
				'SELECT * FROM user_interactions WHERE (user1 = $1 OR user2 = $1) AND interaction_type = $2',
				[userId, 'match']
			);
			return result.rows;
		} catch (error) {
			console.error('Error fetching matches:', error);
			throw new Error('Failed to fetch matches');
		}
	}

	static async blockUser(userId, user2Id) {
		try {
			const result = await db.query(
				'INSERT INTO user_interactions (user1, user2, interaction_type) VALUES ($1, $2, $3) RETURNING *',
				[userId, user2Id, 'block']
			);
			return result.rows[0];
		} catch (error) {
			console.error('Error blocking user:', error);
			throw new Error('Failed to block user');
		}
	}

	static async getBlockedUsersByUserId(userId) {
		try {
			const result = await db.query(
				'SELECT * FROM user_interactions WHERE (user1 = $1 OR user2 = $1) AND interaction_type = $2',
				[userId, 'block']
			);
			return result.rows;
		} catch (error) {
			console.error('Error fetching blocked users:', error);
			throw new Error('Failed to fetch blocked users');
		}
	}

}

module.exports = UserInteractions;