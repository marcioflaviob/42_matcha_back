const UserInteractions = require('../models/UserInteractions/UserInteractions.js');
const NotificationService = require('./NotificationService.js');
const ApiException = require('../exceptions/ApiException.js');
const LocationService = require('./LocationService.js');
const InterestsService = require('./InterestsService.js');
const UserService = require('./UserService.js');

exports.getLikeCountByUserId = async (userId) => {
	const likeCount = await UserInteractions.getLikeCountByUserId(userId);
	return likeCount;
}

exports.likeUser = async (userId, user2Id) => {
	if (!userId || !user2Id) throw new ApiException(400, 'User IDs are required');

	if (userId == user2Id) throw new ApiException(400, 'You cannot like yourself');

	const like = await UserInteractions.likeUser(userId, user2Id);
	await NotificationService.newLikeNotification(user2Id, userId);

	await UserService.addFameRating(user2Id, 10);

	if (await isUserAlreadyLiked(userId, user2Id)) {
		return await this.matchUsers(userId, user2Id);
	}

	return like;
}

exports.getProfileViewsByUserId = async (userId) => {
	if (!userId) throw new ApiException(400, 'User ID is required');

	const views = await UserInteractions.getProfileViewsByUserId(userId);

	const users = views.map(async (view) => {
		return await UserService.getUserById(view.user1);
	});

	return await Promise.all(users);
}

exports.matchUsers = async (userId, user2Id) => {
	const match = await UserInteractions.matchUsers(userId, user2Id);
	await NotificationService.newMatchNotification(userId, user2Id);

	const notification1 = await NotificationService.getNotificationByUserIdAndConcernedUserIdAndType(userId, user2Id, 'new-like');
	const notification2 = await NotificationService.getNotificationByUserIdAndConcernedUserIdAndType(user2Id, userId, 'new-like');

	await NotificationService.deleteNotification(notification1.id);
	await NotificationService.deleteNotification(notification2.id);

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
	const userPromises = matchesIds.map(async (id) => {
		return await UserService.getUserById(id);
	});
	return await Promise.all(userPromises);
}

exports.getMatchesIdsByUserId = async (userId) => {
	const matches = await this.getMatchesByUserId(userId);

	const userIds = matches.map(match => {
		return match.user1 == userId ? match.user2 : match.user1;
	});
	return userIds;
}

exports.getPotentialMatches = async (userId) => {
	const userData = await UserService.getUserById(userId);
	const filters = {
		userId: userId,
		gender: userData.gender,
		sexual_interest: userData.sexual_interest,
		age: userData.age,
		age_range_min: userData.age_range_min,
		age_range_max: userData.age_range_max,
		rating: userData.rating,
		min_desired_rating: userData.min_desired_rating,
		location_range: userData.location_range
	};

	const validUsers = await UserService.getPotentialMatches(filters);

	const finalMatches = await Promise.all(validUsers.map(async (match) => {
		match.liked_me = await isUserAlreadyLiked(userId, match.id);
		return match;
	}));

	return finalMatches;
}

exports.blockUser = async (userId, user2Id) => {

	if (!userId || !user2Id) throw new ApiException(400, 'User IDs are required');
	if (userId == user2Id) throw new ApiException(400, 'You cannot block yourself');

	const block = await UserInteractions.blockUser(userId, user2Id);
	await UserService.addFameRating(user2Id, -10);
	return block;
}

exports.reportUser = async (userId, user2Id) => {

	if (!userId || !user2Id) throw new ApiException(400, 'User IDs are required');
	if (userId == user2Id) throw new ApiException(400, 'You cannot report yourself');

	const block = await UserInteractions.blockUser(userId, user2Id);
	await UserService.addFameRating(user2Id, -15);
	return block;
}

exports.unlikeUser = async (userId, user2Id) => {

	if (!userId || !user2Id) throw new ApiException(400, 'User IDs are required');
	if (userId == user2Id) throw new ApiException(400, 'You cannot unlike yourself');

	await UserInteractions.unlikeUser(userId, user2Id);
	await NotificationService.newUnlikeNotification(user2Id, userId);
	await UserService.addFameRating(user2Id, -10);
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