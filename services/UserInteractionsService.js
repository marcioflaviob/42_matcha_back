const UserInteractions = require('../models/UserInteractions/UserInteractions');
const UserService = require('../services/UserService')

exports.getLikeCountByUserId = async (userId) => {
	try {
		const likeCount = await UserInteractions.getLikeCountByUserId(userId);
		return likeCount;
	} catch (error) {
		throw new Error('Failed to fetch like count');
	}
}

exports.likeUser = async (userId, user2Id) => {
	try {
		const like = await UserInteractions.likeUser(userId, user2Id);

		if (await isUserAlreadyLiked(userId, user2Id)) {
			const match = await this.matchUsers(userId, user2Id);
			// TODO Trigger match notification
			return match;
		}

		return like;
	} catch (error) {
		throw new Error('Failed to like user');
	}
}

exports.seeProfile = async (userId, user2Id) => {
	try {
		const view = await UserInteractions.seeProfile(userId, user2Id);
		return view;
	} catch (error) {
		throw new Error('Failed to see profile');
	}
}

exports.getProfileViewsByUserId = async (userId) => {
	try {
		const views = await UserInteractions.getProfileViewsByUserId(userId);

		// Fetch users' details based on their IDs
		const users = views.map(async (view) => {
			return await UserService.getUserById(view.user1);
		});

		return users;
	} catch (error) {
		throw new Error('Failed to fetch profile views');
	}
}

exports.matchUsers = async (userId, user2Id) => {
	try {
		const match = await UserInteractions.matchUsers(userId, user2Id);
		return match;
	} catch (error) {
		throw new Error('Failed to match users');
	}
}

exports.getMatchesByUserId = async (userId) => {
    try {
        const matches = await UserInteractions.getMatchesByUserId(userId);
        const blockedBySet = await this.getBlockedUsersIdsByUserId(userId);

		// Convert Set to Array
		const blockedBy = Array.from(blockedBySet);

        const blockedUserIds = new Set(
            blockedBy.flatMap(blocked => [blocked.user1, blocked.user2])
        );

        const filteredMatches = matches.filter(match => 
            !blockedUserIds.has(match.user1) && !blockedUserIds.has(match.user2)
        );

        return filteredMatches;
    } catch (error) {
		console.error('Error fetching matches:', error);
        throw new Error('Failed to fetch matches');
    }
}

exports.blockUser = async (userId, user2Id) => {
	try {
		const block = await UserInteractions.blockUser(userId, user2Id);
		return block;
	} catch (error) {
		throw new Error('Failed to block user');
	}
}

exports.getBlockedUsersIdsByUserId = async (userId) => {
	try {
		const blockedUsers = await UserInteractions.getBlockedUsersByUserId(userId);

		const blockedUserIds = new Set(
            blockedUsers.flatMap(blocked => [blocked.user1, blocked.user2])
        );

		return blockedUserIds;
	} catch (error) {
		throw new Error('Failed to fetch blocked users');
	}
}

const isUserAlreadyLiked = async (userId, user2Id) => {
	try {
		const like = await UserInteractions.getLikesByUserId(userId);

		const isLiked = like.some(like => like.user1 == user2Id);

		return isLiked ? true : false;
	} catch (error) {
		throw new Error('Failed to check if user is already liked');
	}
}