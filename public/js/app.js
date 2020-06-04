const socket = io();

const $msgForm = document.querySelector('#message-form');
const $msgFormInput = document.querySelector('input');
const $msgFormButton = document.querySelector('button');
const $locationButton = document.querySelector('#send-location');
const $msg = document.querySelector('#messages');
const $sidebar = document.querySelector('#sidebar');

const messageTemplate = document.querySelector('#message-template').innerHTML;
const locationTemplate = document.querySelector('#location-template').innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;

const { username, room } = Qs.parse(location.search, {
	ignoreQueryPrefix: true,
});

function autoScroll() {
	const $newMessage = $msg.lastElementChild;
	const newMessageStyle = getComputedStyle($newMessage);
	const newMessageMargin = parseInt(newMessageStyle.marginBottom, 10);
	const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;
	const visibleHeight = $msg.offsetHeight;
	const containerHeight = $msg.scrollHeight;
	const scrollOffset = $msg.scrollTop + visibleHeight;

	if (containerHeight - newMessageHeight <= scrollOffset) {
		$msg.scrollTop = $msg.scrollHeight;
	}
}

socket.on('message', ({ username, message, createdAt }) => {
	const html = Mustache.render(messageTemplate, {
		username,
		message,
		createdAt: moment(createdAt).format('h:mm A'),
	});
	$msg.insertAdjacentHTML('beforeend', html);
	autoScroll();
});

socket.on('locationMessage', (url) => {
	const html = Mustache.render(locationTemplate, { url });
	$msg.insertAdjacentHTML('beforeend', html);
	autoScroll();
});

socket.on('roomData', ({ room, users }) => {
	const html = Mustache.render(sidebarTemplate, {
		room,
		users,
	});
	$sidebar.innerHTML = html;
});

$msgForm.addEventListener('submit', (e) => {
	e.preventDefault();

	$msgFormButton.setAttribute('disabled', 'disabled');

	const message = e.target.elements.message.value;

	socket.emit('sendMessage', message, (error) => {
		$msgFormButton.removeAttribute('disabled');
		$msgFormInput.value = '';
		$msgFormInput.focus();

		if (error) {
			console.log(error);
		}
	});
});

$locationButton.addEventListener('click', () => {
	if (!navigator.geolocation) {
		return alert('Geolocation is not supported by your browser!');
	}

	$locationButton.setAttribute('disabled', 'disabled');

	navigator.geolocation.getCurrentPosition(
		(position) => {
			const { latitude, longitude } = position.coords;

			socket.emit('sendLocation', { latitude, longitude }, (msg) => {
				console.log(msg);
				$locationButton.removeAttribute('disabled');
			});
		},
		(error) => console.log({ error })
	);
});

socket.emit('join', { username, room }, (error) => {
	if (error) {
		location.href = '/';
	}
});
