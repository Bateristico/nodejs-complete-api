const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const dotenv = require('dotenv').config();
const multer = require('multer');

const DB_URI = process.env.DB_URI;

const feedRoutes = require('./routes/feed');
const authRoutes = require('./routes/auth');

const app = express();

/*
const fileStorage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, 'images');
	},
	filename: (req, file, cb) => {
		cb(null, new Date().toISOString() + '-' + file.originalname);
	},
});

const fileFilter = (req, file, cb) => {
	if (
		file.mimetype === 'image/png' ||
		file.mimetype === 'image/jpeg' ||
		file.mimetype === 'image/jpg'
	) {
		cb(null, true);
	} else {
		cb(null, false);
	}
};

app.use(
	muter({ storage: fileStorage, fileFilter: fileFilter }).single('image')
);

*/
// used to parse the request
app.use(bodyParser.json()); // application/json

app.use('/images', express.static(path.join(__dirname, 'images')));

// set up the headers for the api responses
app.use((req, res, next) => {
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader(
		'Access-Control-Allow-Methods',
		'OPTIONS, GET, POST, PUT, PATCH, DELETE'
	);
	res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
	next();
});

app.use('/feed', feedRoutes);
app.use('/auth', authRoutes);
// socket io requests

// error handler
app.use((error, req, res, next) => {
	console.log(error);
	const status = error.statusCode || 500;
	const message = error.message;
	const data = error.data;
	res.status(status).json({ message: message, data: data });
});

mongoose
	.connect(DB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
	.then((result) => {
		console.log(`API up and running`);
		const server = app.listen(8080);
		const io = require('./socket').init(server);
		io.on('connection', (socket) => {
			console.log('Client connected');
		});
	})
	.catch((err) => console.log(err));
