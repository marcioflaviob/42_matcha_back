const UserInteractions = require('../models/UserInteractions/UserInteractions.js');
const UserService = require('./UserService.js');
const NotificationService = require('./NotificationService.js');

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

		await NotificationService.newLikeNotification(user2Id, userId);

		return like;
	} catch (error) {
		throw new Error('Failed to like user');
	}
}

exports.seeProfile = async (userId, user2Id) => {
	try {
		const view = await UserInteractions.seeProfile(userId, user2Id);
		await NotificationService.newProfileViewNotification(user2Id, userId);
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
		await NotificationService.newMatchNotification(userId, user2Id);
		return match;
	} catch (error) {
		throw new Error('Failed to match users');
	}
}

exports.getMatchesByUserId = async (userId) => {
    try {
        const matches = await UserInteractions.getMatchesByUserId(userId);
        const blockedUsers = await this.getBlockedUsersIdsByUserId(userId);

        const filteredMatches = matches.filter(match => 
            !blockedUsers.has(match.user1) && !blockedUsers.has(match.user2)
        );

        return filteredMatches;
    } catch (error) {
		console.error('Error fetching matches:', error);
        throw new Error('Failed to fetch matches');
    }
}

exports.getMatchesAsUsersByUserId = async (userId) => {
	try {
		const matchesIds = await this.getMatchesIdsByUserId(userId);

		const users = await Promise.all(matchesIds.map(async (id) => {
			return await UserService.getUserById(id);
		}));

		return users;
	} catch (error) {
		console.error('Error fetching matches:', error);
		throw new Error('Failed to fetch matches');
	}
}

exports.getMatchesIdsByUserId = async (userId) => {
	try {
		const matches = await this.getMatchesByUserId(userId);

		const userIds = matches.map(match => {
			return match.user1 == userId ? match.user2 : match.user1;
		});

		return userIds;
	} catch (error) {
		console.error('Error fetching matches:', error);
		throw new Error('Failed to fetch matches');
	}
}

exports.getPotentialMatches = async (userId) => {
	try {
		const userData = await UserService.getUserById(userId);
		const validUsers = await UserService.getValidUsers(userId);

		const likedProfiles = await this.getLikedProfilesIdsByUserId(userId);
		const blockedBySet = await this.getBlockedUsersIdsByUserId(userId);
        const unwantedMatches = new Set([...blockedBySet, ...likedProfiles]);

		const interested_genders = userData.sexual_interest == 'Any'
			? ['Female', 'Male', 'Other']
			: [userData.sexual_interest];

        const filteredMatches = validUsers.filter(match => {
            const hasCommonInterest = match.interests.some(interest =>
				userData.interests.some(userInterest => userInterest.id === interest.id)
			);

			const isInterestedInMyGender = match.sexual_interest == 'Any' ||
				match.sexual_interest == userData.gender;

            return !unwantedMatches.has(match.id) &&
			interested_genders.includes(match.gender) &&
			hasCommonInterest && isInterestedInMyGender;
		});

        return filteredMatches;
	} catch (error) {
		console.error('Error fetching potential matches:', error);
		throw new Error('Failed to fetch potential matches');
	}
}

exports.blockUser = async (userId, user2Id) => {
	try {
		const block = await UserInteractions.blockUser(userId, user2Id);
		await NotificationService.newBlockNotification(user2Id, userId);
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

		blockedUserIds.delete(userId);
		return blockedUserIds;
	} catch (error) {
		throw new Error('Failed to fetch blocked users');
	}
}

exports.getLikedProfilesIdsByUserId = async (userId) => {
	try {
		const likes = await UserInteractions.getLikesGivenByUserId(userId);

		const likedUserIds = new Set(
			likes.flatMap(like => [like.user1, like.user2])
		);

		return likedUserIds;
	} catch (error) {
		throw new Error('Failed to fetch liked users');
	}
}

const isUserAlreadyLiked = async (userId, user2Id) => {
	try {
		const like = await UserInteractions.getLikesReceivedByUserId(userId);

		const isLiked = like.some(like => like.user1 == user2Id);

		return isLiked ? true : false;
	} catch (error) {
		throw new Error('Failed to check if user is already liked');
	}
}