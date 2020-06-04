const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const { generateMessage } = require('./utils/message');
const {
	getUser,
	getUsersInRoom,
	addUser,
	removeUser,
} = require('./utils/user');

const port = process.env.PORT || 3000;
const publicDirectoryPath = path.join(__dirname, './public');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

app.use(express.static(publicDirectoryPath));

io.on('connection', (socket) => {
	console.log('New WebSocket connection');

	socket.on('join', (options, callback) => {
		const { error, user } = addUser({ id: socket.id, ...options });

		if (error) {
			return callback(error);
		}

		socket.join(user.room);

		socket.emit('message', generateMessage('Welcome!', 'Bot'));

		socket.broadcast
			.to(user.room)
			.emit(
				'message',
				generateMessage(`${user.username} has joined`, 'Bot')
			);

		io.to(user.room).emit('roomData', {
			room: user.room,
			users: getUsersInRoom(user.room),
		});
	});

	socket.on('sendMessage', (message, callback) => {
		const user = getUser(socket.id);

		if (!user) {
			return;
		}

		if (message === '') {
			return callback('Message is not empty!');
		}

		io.to(user.room).emit(
			'message',
			generateMessage(message, user.username)
		);
		callback();
	});

	socket.on('sendLocation', ({ latitude, longitude }, callback) => {
		const user = getUser(socket.id);

		if (!user) {
			return;
		}

		io.to(room).emit(
			'locationMessage',
			`https://google.com/maps?q=${latitude},${longitude}`
		);
		callback('Location shared!');
	});

	socket.on('disconnect', () => {
		const user = removeUser(socket.id);

		if (user) {
			io.to(user.room).emit(
				'message',
				generateMessage(`${user.username} has left`, 'Bot')
			);

			io.to(user.room).emit('roomData', {
				room: user.room,
				users: getUsersInRoom(user.room),
			});
		}
	});
});

server.listen(port, () => {
	console.log('Server is up on port ' + port);
});
