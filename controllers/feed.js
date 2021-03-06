const fs = require('fs');
const path = require('path');
const { validationResult } = require('express-validator');

const io = require('../socket');
const Post = require('../models/post');
const User = require('../models/user');

// get all posts
exports.getPosts = async (req, res, next) => {
	// pagination logic
	const currentPage = req.query.page || 1;
	const perPage = 5;
	try {
		const totalItems = await Post.find().countDocuments();
		const posts = await Post.find()
			.sort({ createdAt: -1 })
			.populate('creator')
			.skip((currentPage - 1) * perPage)
			.limit(perPage);

		res.status(200).json({
			message: 'Fetched posts successfully',
			posts: posts,
			totalItems: totalItems,
		});
	} catch (err) {
		if (!err.statusCode) {
			err.statusCode = 500;
		}
		next(err);
	}
	// pagination logic end
};

// create a post
exports.createPost = async (req, res, next) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		const error = new Error('validation failed, entered data is incorrect.');
		error.statusCode = 422;
		throw error;
	}
	/*
	//check for an image
	if (!req.file) {
		const error = new Error('No image provided.');
		error.statusCode = 422;
		throw error;
	}
	*/

	//const imageUrl = req.file.path;
	const title = req.body.title;
	const content = req.body.content;
	let imageUrl = req.body.imageUrl;
	let creator;

	const post = new Post({
		title: title,
		content: content,
		imageUrl: imageUrl,
		creator: req.userId,
	});

	try {
		// Create post in db
		const result = await post.save();
		const user = await User.findById(req.userId);
		user.posts.push(post);

		const savedUser = await user.save();
		/*
		// inform all other users (socket.io)
		io.getIO().emit('posts', {
			action: 'create',
			post: { ...post._doc, creator: { _id: req.userId, name: user.name } },
		});
		*/

		res.status(201).json({
			message: 'Post created successfully!',
			post: post,
			creator: { _id: user._id, name: user.name },
		});
		return savedUser;
	} catch (err) {
		if (!err.statusCode) {
			err.statusCode = 500;
		}
		next(err);
	}
};

// get a single post
exports.getPost = async (req, res, next) => {
	const postId = req.params.postId;
	try {
		const post = await Post.findById(postId);
		if (!post) {
			const error = new Error('Couldnt find post.');
			error.statusCode = 404;
			throw error;
		}
		res.status(200).json({ message: 'Post fetched', post: post });
	} catch (err) {
		if (!err.statusCode) {
			err.statusCode = 500;
		}
		next(err);
	}
};

// update a single post
exports.updatePost = async (req, res, next) => {
	const postId = req.params.postId;

	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		const error = new Error('validation failed, entered data is incorrect.');
		error.statusCode = 422;
		throw error;
	}

	const title = req.body.title;
	const content = req.body.content;
	let imageUrl = req.body.imageUrl;
	if (req.file) {
		imageUrl = req.file.path;
	}
	if (!imageUrl) {
		const error = new Error('No file picked');
		error.statusCode = 422;
		throw error;
	}

	try {
		const post = await Post.findById(postId);

		if (!post) {
			const error = new Error('Couldnt find post.');
			error.statusCode = 404;
			throw error;
		}
		if (post.creator.toString() !== req.userId) {
			const error = new Error('Not Authorize');
			error.statusCode = 404;
			throw error;
		}
		if (imageUrl !== post.imageUrl) {
			clearImage(post.imageUrl);
		}

		post.title = title;
		post.imageUrl = imageUrl;
		post.content = content;
		const result = await post.save();
		res.status(200).json({ message: 'Post updated!', post: result });
	} catch (err) {
		if (!err.statusCode) {
			err.statusCode = 500;
		}
		next(err);
	}
};

exports.deletePost = async (req, res, next) => {
	const postId = req.params.postId;

	try {
		const post = await Post.findById(postId);

		if (!post) {
			const error = new Error('Couldnt find post.');
			error.statusCode = 404;
			throw error;
		}

		if (post.creator.toString() !== req.userId) {
			const error = new Error('Not Authorize');
			error.statusCode = 404;
			throw error;
		}

		// check logged in user
		//clearImage(post.imageUrl);
		await Post.findByIdAndRemove(postId);

		const user = await User.findById(req.userId);

		user.posts.pull(postId);
		await user.save();

		res.status(200).json({ message: 'Post deleted' });
	} catch (err) {
		if (!err.statusCode) {
			err.statusCode = 500;
		}
		next(err);
	}
};

const clearImage = (filePath) => {
	filePath = path.join(__dirname, '..', filePath);
	fs.unlink(file, (err) => console.log(err));
};
