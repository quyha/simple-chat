function generateMessage(text, username) {
	return {
		username,
		message: text,
		createdAt: new Date().getTime(),
	};
}

module.exports = {
	generateMessage,
};
