const jwt = require('jsonwebtoken');
const dotenv = require('dotenv').config();

const SECRET_TOKEN = process.env.SECRET_TOKEN;

module.exports = (req, res, next) => {
	const authHeader = req.get('Authorization');
	if (!authHeader) {
		const error = new Error('Not authenticated');
		error.statusCode = 401;
		throw error;
	}
	const token = req.get('Authorization').split(' ')[1]; // after Bearer
	let decodedToken;
	try {
		decodedToken = jwt.verify(token, SECRET_TOKEN);
	} catch (err) {
		err.statusCode = 500;
		throw err;
	}

	if (!decodedToken) {
		const error = new Error('Not authenticated');
		error.statusCode = 401;
		throw error;
	}

	req.userId = decodedToken.userId;
	next();
};
