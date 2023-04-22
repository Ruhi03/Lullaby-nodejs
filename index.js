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

// const GridFsStorage = require('multer-gridfs-storage');
// const Grid = require('gridfs-stream');



const io = new Server(server, {
	cors: {
		origin: "*",
	}
});

// 로그 콘솔창에 출력
app.use(morgan('dev'));
app.use(cors('*'));
app.use(express.static('public'));

mongoose.connect('mongodb://ruhi03:ruhi03@127.0.0.1:27017/message?authSource=admin')
	.then(() => {
		console.log('Connected to MongoDB');
	})
	.catch(err => {
		console.log(err);
	});



// const conn = mongoose.connection;
// let gfs;

// conn.once('open', () => {
// 	gfs = Grid(conn.db, mongoose.mongo);
// 	gfs.collection('uploads'); // 파일 컬렉션 이름 설정
// });

// const storage = new GridFsStorage({
// 	db: conn,
// 	file: (req, file) => {
// 		return {
// 			filename: file.originalname
// 		};
// 	}
// });

// const upload = multer({ storage: storage }).single('file');

// app.post('/upload', upload, (req, res) => {
// 	res.json({ file: req.file });
// });



const messageSchema = new Schema({
	username: String,
	content: String,
	filePath: [String],
	createdAt: Date,
	id: String,
});

const Message = mongoose.model('Message', messageSchema);

io.on('connection', async socket => {
	console.log('a user connected');
	const data = await Message.find({}).sort({ createdAt: -1 }).limit(10);
	socket.emit('first load message', { data: data.sort((i, j) => i.createdAt - j.createdAt), type: 'recent', count: 10 })
	

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

	socket.on('load message', async (offset) => {
		const data = await Message.find({}).sort({createdAt: -1}).skip(offset).limit(10);
		socket.emit('load message', {data: data.sort((i, j) => i.createdAt - j.createdAt), type: 'recent', count: 10});
		
	});
});

server.listen(3000, () => {
	console.log('listening on *:3000');
});
