const PusherService = require('../services/PusherService.js');

exports.pusherAuthentication = async (req, res) => {
    const userId = req.user.id;
    const { socket_id, channel_name } = req.body;

	const auth = await PusherService.authenticatePusher(userId, socket_id, channel_name);

    if (!auth) {
      return res.status(403).json({ message: "Forbidden" });
    }

    res.status(200).json(auth);
}

exports.broadcastOnlineStatus = async (req, res) => {
	const userId = req.user.id;

	try {
		await PusherService.broadcastStatusChange(userId, 'online');
		return res.status(200).send({ message: 'Status broadcasted successfully' });
	} catch (err) {
		console.error(err);
		return res.status(500).send({ error: err.message || 'Server error during broadcasting status' });
	}
}

exports.broadcastOfflineStatus = async (req, res) => {
	const userId = req.user.id;

	try {
		await PusherService.broadcastStatusChange(userId, 'offline');
		return res.status(200).send({ message: 'Status broadcasted successfully' });
	} catch (err) {
		console.error(err);
		return res.status(500).send({ error: err.message || 'Server error during broadcasting status' });
	}
}