const UserInteractionsService = require('../services/UserInteractionsService.js');

exports.getLikeCountByUserId = async (req, res) => {
	const userId = req.user.id;
	const likeCount = await UserInteractionsService.getLikeCountByUserId(userId);
	res.status(200).send(likeCount);
}

exports.likeUser = async (req, res) => {
	const userId = req.user.id;
	const likedUserId = req.params.id;
	const likeResult = await UserInteractionsService.likeUser(userId, likedUserId);
	res.status(200).send(likeResult);
}

exports.getProfileViewsByUserId = async (req, res) => {
	const userId = req.user.id;
	const profileViews = await UserInteractionsService.getProfileViewsByUserId(userId);
	res.status(200).send(profileViews);
}

exports.matchUsers = async (req, res) => {
	const userId = req.user.id;
	const matchedUserId = req.params.id;
	const matchResult = await UserInteractionsService.matchUsers(userId, matchedUserId);
	res.status(200).send(matchResult);
}

exports.getMatchesByUserId = async (req, res) => {
	const userId = req.user.id;
	const matches = await UserInteractionsService.getMatchesAsUsersByUserId(userId);
	res.status(200).send(matches);
}

exports.getPotentialMatches = async (req, res) => {
	const userId = req.user.id;
	const potentialMatches = await UserInteractionsService.getPotentialMatches(userId);
	res.status(200).send(potentialMatches);
}

exports.blockUser = async (req, res) => {
	const userId = req.user.id;
	const blockedUserId = req.params.id;
	const block = await UserInteractionsService.blockUser(userId, blockedUserId);
	res.status(200).send(block);
}

exports.reportUser = async (req, res) => {
	const userId = req.user.id;
	const reportedUserId = req.params.id;
	const block = await UserInteractionsService.reportUser(userId, reportedUserId);
	res.status(200).send(block);
}

exports.unlikeUser = async (req, res) => {
	const userId = req.user.id;
	const unlikedUser = req.params.id;
	await UserInteractionsService.unlikeUser(userId, unlikedUser);
	res.status(204).send();
}

exports.getBlockedUsersByUserId = async (req, res) => {
	const userId = req.user.id;
	const blockedUsers = await UserInteractionsService.getBlockedUsersIdsByUserId(userId);
	res.status(200).send(blockedUsers);
}