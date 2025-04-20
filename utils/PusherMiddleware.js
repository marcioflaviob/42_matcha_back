const Pusher = require('pusher');

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER,
  useTLS: true,
});

function authenticate(userId, socketId, channelName) {
	const result = pusher.authorizeChannel(socketId, channelName, {
		user_id: userId,
	  });
	return result;
}

module.exports = {
	pusher,
	authenticate,
  };