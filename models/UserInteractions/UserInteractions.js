const db = require('../../config/db.js');
const ApiException = require('../../exceptions/ApiException.js');

class UserInteractions {

	static async getLikeCountByUserId(userId) {
		try {
			const result = await db.query(
				'SELECT * FROM user_interactions WHERE user2 = $1 AND interaction_type = $2',
				[userId, 'like']
			);
			return result.rows.length;
		} catch {
			throw new ApiException(500, 'Failed to fetch like count');
		}
	}

	static async getLikesReceivedByUserId(userId) {
		try {
			const result = await db.query(
				'SELECT * FROM user_interactions WHERE user2 = $1 AND interaction_type = $2',
				[userId, 'like']
			);
			return result.rows;
		} catch {
			throw new ApiException(500, 'Failed to fetch likes');
		}
	}

	static async getLikesGivenByUserId(userId) {
		try {
			const result = await db.query(
				'SELECT * FROM user_interactions WHERE user1 = $1 AND interaction_type = $2',
				[userId, 'like']
			);
			return result.rows;
		} catch {
			throw new ApiException(500, 'Failed to fetch likes');
		}
	}

	static async likeUser(userId, user2Id) {
		try {
			const result = await db.query(
				'INSERT INTO user_interactions (user1, user2, interaction_type) VALUES ($1, $2, $3) RETURNING *',
				[userId, user2Id, 'like']
			);
			if (result.rows.length === 0) throw new ApiException(500, 'Failed to like user');
			return result.rows[0];
		} catch {
			throw new ApiException(500, 'Failed to like user');
		}
	}

	static async getProfileViewsByUserId(userId) {
		try {
			const result = await db.query(
				'SELECT * FROM user_interactions WHERE user2 = $1 AND interaction_type = $2',
				[userId, 'view']
			);
			return result.rows;
		} catch {
			throw new ApiException(500, 'Failed to fetch profile views');
		}
	}

	static async matchUsers(userId, user2Id) {
		try {
			const result = await db.query(
				'INSERT INTO user_interactions (user1, user2, interaction_type) VALUES ($1, $2, $3) RETURNING *',
				[userId, user2Id, 'match']
			);
			if (result.rows.length === 0) throw new ApiException(500, 'Failed to match users');
			return result.rows[0];
		} catch {
			throw new ApiException(500, 'Failed to match users');
		}
	}

	static async getMatchesByUserId(userId) {
		try {
			const result = await db.query(
				'SELECT * FROM user_interactions WHERE (user1 = $1 OR user2 = $1) AND interaction_type = $2',
				[userId, 'match']
			);
			return result.rows;
		} catch {
			throw new ApiException(500, 'Failed to fetch matches');
		}
	}

	static async blockUser(userId, user2Id) {
		try {
			const result = await db.query(
				'INSERT INTO user_interactions (user1, user2, interaction_type) VALUES ($1, $2, $3) RETURNING *',
				[userId, user2Id, 'block']
			);
			if (result.rows.length === 0) throw new ApiException(500, 'Failed to block user');
			return result.rows[0];
		} catch {
			throw new ApiException(500, 'Failed to block user');
		}
	}

	static async getBlockedUsersByUserId(userId) {
		try {
			const result = await db.query(
				'SELECT * FROM user_interactions WHERE (user1 = $1 OR user2 = $1) AND interaction_type = $2',
				[userId, 'block']
			);
			return result.rows;
		} catch {
			throw new ApiException(500, 'Failed to fetch blocked users');
		}
	}

	static async unlikeUser(userId, user2Id) {
		try {
			const result = await db.query(
				`DELETE FROM user_interactions WHERE ((user1 = $1 AND user2 = $2) OR (user1 = $2 AND user2 = $1)) AND (interaction_type = 'match' OR interaction_type = 'like')`,
				[userId, user2Id]
			);

			if (result.rowCount != 3) console.error('Unexpected behaviour when unliking user, rowCount:', result.rowCount);
		} catch {
			throw new ApiException(500, 'Failed to unlike user');
		}
	}

}

module.exports = UserInteractions;