const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const {Server} = require('socket.io');
const io = new Server(server);
const mongoose = require('mongoose');
const {Schema} = require('mongoose');
const {v4: uuidv4} = require('uuid');
const morgan = require('morgan');

// 로그 콘솔창에 출력
app.use(morgan('dev'));

const messageSchema = new Schema({
	username: String,
	content: String,
	createdAt: Date,
	id: String,
});

const Message = mongoose.model('Message', messageSchema);

mongoose.connect('mongodb://127.0.0.1:27017/message')
	.then(() => {
		console.log('Connected to MongoDB');
	})
	.catch(err => {
		console.log(err);
	});

app.use(express.static('public'));

app.get('/', (req, res) => {
	res.sendFile(__dirname + '/index.html');
});

io.on('connection', socket => {
	console.log('a user connected');

	socket.on('disconnect', () => {
		console.log('user disconnected');
	});

	socket.on('enter user', username => {
		io.emit('enter user', username);
	});

	socket.on('send message', msg => {
		msg.id = uuidv4();
		const message = new Message(msg);
		message.save();
		io.emit('send message', msg);
	});

	socket.on('load message', async count => {
		const totalMessage = await Message.countDocuments({});
		let loadMessage;

		if (count === 0) {
			loadMessage = 'first load message';
		} else {
			loadMessage = 'load message';
		}

		if (totalMessage > count) {
			const data = await Message.find({}).sort({createdAt: -1}).skip(count).limit(50);
			socket.emit(loadMessage, {data: data.sort((i, j) => i.createdAt - j.createdAt), type: 'recent', count: 50});
			socket.emit('max count update', totalMessage);
		}
	});
});

server.listen(3000, () => {
	console.log('listening on *:3000');
});
