/* eslint-disable no-alert */
// eslint-disable-next-line no-undef
const socket = io();
const messages = document.querySelector('.messages');
const form = document.querySelector('.form');
const input = document.querySelector('.input');
const fileBtn = document.querySelector('.file-btn');
const fileInput = document.querySelector('.file-input');
const fragment = document.createElement('div');

let username;
let count = 0;
let maxCount = 100;

username = prompt('이름을 입력해주세요');

if (username === null || username === '') {
	username = '익명';
}

socket.emit('load message', count);

fileBtn.addEventListener('click', () => {
	fileInput.click();
});

fileInput.addEventListener('change', () => {
	const {file} = fileInput;
});

form.addEventListener('submit', e => {
	e.preventDefault();

	if (input.value) {
		const message = {
			username,
			content: input.value,
			createdAt: Date.now(),
		};

		socket.emit('send message', message);
		input.value = '';
	}
});

messages.addEventListener('scroll', debounce(() => {
	if (messages.scrollTop < 100 && count < maxCount) {
		socket.emit('load message', count);
		messages.scrollTo(0, 1);
	}
}), 400);

function debounce(callback, limit) {
	let timeout;
	return function (...args) {
		clearTimeout(timeout);
		timeout = setTimeout(() => {
			callback.apply(this, args);
		}, limit);
	};
}

function createMessage(msg) {
	function displayedNickname(msgElements) {
		if (msgElements.length > 0) {
			if (msgElements[msgElements.length - 1].textContent === msg.username) {
				name.style.display = 'none';
				time.style.display = 'none';
			}
		}
	}

	const msgDiv = document.createElement('div');
	const name = document.createElement('div');
	const time = document.createElement('div');
	const text = document.createElement('div');
	const uesrInfo = document.createElement('div');
	let msgElements;

	if (msg.username === username) {
		msgDiv.classList.add('my');
		uesrInfo.appendChild(time);
		uesrInfo.appendChild(name);
	} else {
		uesrInfo.appendChild(name);
		uesrInfo.appendChild(time);
	}

	msgDiv.classList.add('msg');
	uesrInfo.className = 'user';
	name.className = 'name';
	text.className = 'text';
	
	if (count === 50) {
		msgElements = document.querySelectorAll('.name');
	} else {
		msgElements = fragment.querySelectorAll('.name');
	}

	displayedNickname(msgElements);

	const date = new Date(msg.createdAt);

	name.textContent = msg.username;
	time.textContent = date.toLocaleString();
	text.textContent = msg.content;

	msgDiv.appendChild(uesrInfo);
	msgDiv.appendChild(text);

	return msgDiv;
}

socket.on('first load message', data => {
	const msgs = data.data;
	count += 50;

	msgs.forEach(msg => {
		const item = createMessage(msg);
		messages.appendChild(item);
	});

	messages.scrollTo(0, messages.scrollHeight);
	socket.emit('enter user', username);
});

socket.on('enter user', username => {
	const msg = document.createElement('div');
	msg.textContent = `${username}님이 입장하셨습니다.`;
	msg.className = 'enter'
	messages.appendChild(msg);
	messages.scrollTo({
		top: messages.scrollHeight,
		left: 0,
		behavior: 'smooth',
	});
});

socket.on('load message', data => {
	const msgs = data.data;
	count += 50;

	msgs.forEach(msg => {
		const item = createMessage(msg);
		fragment.appendChild(item);
	});

	messages.prepend(...fragment.childNodes);

	while (fragment.firstChild) {
		fragment.removeChild(fragment.firstChild);
	}
});

socket.on('send message', msg => {
	const item = createMessage(msg);
	messages.appendChild(item);

	messages.scrollTo({
		top: messages.scrollHeight,
		left: 0,
		behavior: 'smooth',
	});
});

socket.on('max count update', count => {
	maxCount = count;
});
