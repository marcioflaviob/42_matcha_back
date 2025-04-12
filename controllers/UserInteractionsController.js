const UserInteractionsService = require('../services/UserInteractionsService');

exports.getLikeCountByUserId = async (req, res) => {
	try {
		const userId = req.user.id;
		const likeCount = await UserInteractionsService.getLikeCountByUserId(userId);
		res.send(likeCount);
	} catch (err) {
		res.status(404).send({ error: err.message });
	}
}

exports.likeUser = async (req, res) => {
	try {
		const userId = req.user.id;
		const likedUserId = req.params.id;
		const likeResult = await UserInteractionsService.likeUser(userId, likedUserId);
		res.send(likeResult);
	} catch (err) {
		res.status(404).send({ error: err.message });
	}
}

exports.seeProfile = async (req, res) => {
	try {
		const userId = req.user.id;
		const profileUserId = req.params.id;
		const seeProfileResult = await UserInteractionsService.seeProfile(userId, profileUserId);
		res.send(seeProfileResult);
	} catch (err) {
		res.status(404).send({ error: err.message });
	}
}

exports.getProfileViewsByUserId = async (req, res) => {
	try {
		const userId = req.user.id;
		const profileViews = await UserInteractionsService.getProfileViewsByUserId(userId);
		res.send(profileViews);
	} catch (err) {
		res.status(404).send({ error: err.message });
	}
}

exports.matchUsers = async (req, res) => {
	try {
		const userId = req.user.id;
		const matchedUserId = req.params.id;
		const matchResult = await UserInteractionsService.matchUsers(userId, matchedUserId);
		res.send(matchResult);
	} catch (err) {
		res.status(404).send({ error: err.message });
	}
}

exports.getMatchesByUserId = async (req, res) => {
	try {
		const userId = req.user.id;
		const matches = await UserInteractionsService.getMatchesByUserId(userId);
		res.status(200).send(matches);
	} catch (err) {
		res.status(404).send({ error: err.message });
	}
}

exports.blockUser = async (req, res) => {
	try {
		const userId = req.user.id;
		const blockedUserId = req.params.id;
		const blockResult = await UserInteractionsService.blockUser(userId, blockedUserId);
		res.send(blockResult);
	} catch (error) {
		throw new Error('Failed to block user');
	}
}

exports.getBlockedUsersByUserId = async (req, res) => {
	try {
		const userId = req.user.id;
		const blockedUsers = await UserInteractionsService.getBlockedUsersByUserId(userId);
		res.send(blockedUsers);
	} catch (err) {
		res.status(404).send({ error: err.message });
	}
}