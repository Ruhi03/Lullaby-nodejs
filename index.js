const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const {Server} = require('socket.io');
const mongoose = require('mongoose');
const {Schema} = require('mongoose');
const {v4: uuidv4} = require('uuid');
const morgan = require('morgan');
const cors = require('cors');

const io = new Server(server, {
	cors: {
		origin: "*",
	}
});

// 로그 콘솔창에 출력
app.use(morgan('dev'));
app.use(cors('*'));

const messageSchema = new Schema({
	username: String,
	content: String,
	createdAt: Date,
	id: String,
});

const Message = mongoose.model('Message', messageSchema);

mongoose.connect('mongodb://ruhi03:ruhi03@127.0.0.1:27017/message?authSource=admin')
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

io.on('connection', async socket => {
	console.log('a user connected');

	const totalMessage = await Message.countDocuments({});
	socket.emit('maxOffset', totalMessage);

	const data = await Message.find({}).sort({ createdAt: -1 }).limit(50);
	socket.emit('first load message', { data: data.sort((i, j) => i.createdAt - j.createdAt), type: 'recent', count: 50 })
	

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

	socket.on('load message', async (offset = 50) => {
		const data = await Message.find({}).sort({createdAt: -1}).skip(offset).limit(50);
		const totalMessage = await Message.countDocuments({});
		socket.emit('maxOffset', totalMessage);
		socket.emit('load message', {data: data.sort((i, j) => i.createdAt - j.createdAt), type: 'recent', count: 50});
		
	});
});

server.listen(3000, () => {
	console.log('listening on *:3000');
});
