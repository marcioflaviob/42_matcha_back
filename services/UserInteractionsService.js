const UserInteractions = require('../models/UserInteractions/UserInteractions.js');
const UserService = require('./UserService.js');
const LocationService = require('./LocationService.js');
const NotificationService = require('./NotificationService.js');
const ApiException = require('../exceptions/ApiException.js');

exports.getLikeCountByUserId = async (userId) => {
	const likeCount = await UserInteractions.getLikeCountByUserId(userId);
	return likeCount;
}

exports.likeUser = async (userId, user2Id) => {
	if (!userId || !user2Id) throw new ApiException(400, 'User IDs are required');

	if (userId == user2Id) throw new ApiException(400, 'You cannot like yourself');

	const like = await UserInteractions.likeUser(userId, user2Id);
	await UserService.addFameRating(user2Id, 10);
	if (await isUserAlreadyLiked(userId, user2Id)) {
		return await this.matchUsers(userId, user2Id);
	}

	await NotificationService.newLikeNotification(user2Id, userId);

	return like;
}

exports.getProfileViewsByUserId = async (userId) => {
	if (!userId) throw new ApiException(400, 'User ID is required');

	const views = await UserInteractions.getProfileViewsByUserId(userId);

	// Fetch users' details based on their IDs
	const users = views.map(async (view) => {
		return await UserService.getUserById(view.user1);
	});

	return users;
}

exports.matchUsers = async (userId, user2Id) => {
	const match = await UserInteractions.matchUsers(userId, user2Id);
	await NotificationService.newMatchNotification(userId, user2Id);
	return match;
}

exports.getMatchesByUserId = async (userId) => {
	if (!userId) throw new ApiException(400, 'User ID is required');
	const matches = await UserInteractions.getMatchesByUserId(userId);
	const blockedUsers = await this.getBlockedUsersIdsByUserId(userId);

	const filteredMatches = matches.filter(match =>
		!blockedUsers.has(match.user1) && !blockedUsers.has(match.user2)
	);

	return filteredMatches;
}

exports.getMatchesAsUsersByUserId = async (userId) => {
	const matchesIds = await this.getMatchesIdsByUserId(userId);

	const users = await Promise.all(matchesIds.map(async (id) => {
		return await UserService.getUserById(id);
	}));

	return users;
}

exports.getMatchesIdsByUserId = async (userId) => {
	const matches = await this.getMatchesByUserId(userId);

	const userIds = matches.map(match => {
		return match.user1 == userId ? match.user2 : match.user1;
	});

	return userIds;
}

exports.getUsersByMinimumFameRating = async (minFameRating, validUsers) => {
	const filteredUsers = validUsers.filter(user => user.rating >= minFameRating);
	return filteredUsers;
}

exports.getPotentialMatches = async (userId) => {
	const userData = await UserService.getUserById(userId);
	const validUsers = await UserService.getValidUsers(userId);

	const likedProfiles = await this.getLikedProfilesIdsByUserId(userId);
	const blockedBySet = await this.getBlockedUsersIdsByUserId(userId);
	const unwantedMatches = new Set([...blockedBySet, ...likedProfiles]);

	const interested_genders = userData.sexual_interest == 'Any'
		? ['Female', 'Male', 'Other']
		: [userData.sexual_interest];

	const filteredUsers = validUsers.filter(match => {
		const hasCommonInterest = match.interests.some(interest =>
			userData.interests.some(userInterest => userInterest.id === interest.id)
		);

		const isInterestedInMyGender = match.sexual_interest == 'Any' ||
			match.sexual_interest == userData.gender;

		const isFameRatingSufficient = match.rating >= userData.min_desired_rating;

		const isWithinRadius = userData.location && match.location ?
			LocationService.calculateDistance(
				userData.location.latitude,
				userData.location.longitude,
				match.location.latitude,
				match.location.longitude
			) <= 10 : false;

		return !unwantedMatches.has(match.id) &&
			interested_genders.includes(match.gender) &&
			hasCommonInterest &&
			isInterestedInMyGender &&
			isFameRatingSufficient &&
			isWithinRadius;
	});

	const filteredMatches = await Promise.all(filteredUsers.map(async (match) => {
		match.liked_me = await isUserAlreadyLiked(userId, match.id);
		return match;
	}));
	return filteredMatches;
}

exports.blockUser = async (userId, user2Id) => {

	if (!userId || !user2Id) throw new ApiException(400, 'User IDs are required');
	if (userId == user2Id) throw new ApiException(400, 'You cannot block yourself');

	const block = await UserInteractions.blockUser(userId, user2Id);
	await NotificationService.newBlockNotification(user2Id, userId);
	await UserService.addFameRating(user2Id, -10);
	return block;
}

exports.getBlockedUsersIdsByUserId = async (userId) => {
	if (!userId) throw new ApiException(400, 'User ID is required');

	const blockedUsers = await UserInteractions.getBlockedUsersByUserId(userId);

	const blockedUserIds = new Set(
		blockedUsers.flatMap(blocked => [blocked.user1, blocked.user2])
	);

	blockedUserIds.delete(userId);
	return blockedUserIds;
}

exports.getLikedProfilesIdsByUserId = async (userId) => {
	if (!userId) throw new ApiException(400, 'User ID is required');

	const likes = await UserInteractions.getLikesGivenByUserId(userId);

	const likedUserIds = new Set(
		likes.flatMap(like => [like.user1, like.user2])
	);

	return likedUserIds;
}

const isUserAlreadyLiked = async (userId, user2Id) => {
	const like = await UserInteractions.getLikesReceivedByUserId(userId);

	const isLiked = like.some(like => like.user1 == user2Id);

	return isLiked ? true : false;
}