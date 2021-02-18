const expect = require('chai').expect;
const sinon = require('sinon');
const mongoose = require('mongoose');
const dotenv = require('dotenv').config();

const { DB_TEST_URI } = process.env;

const User = require('../models/user');
const FeedController = require('../controllers/feed');

describe('Feed controller', function () {
	//inizialization
	before(function (done) {
		mongoose
			.connect(DB_TEST_URI, { useNewUrlParser: true, useUnifiedTopology: true })
			.then((result) => {
				const user = new User({
					email: 'test@test.com',
					password: 'tester',
					name: 'Test',
					posts: [],
					_id: '5c0f66b979af55031b34728a',
				});
				return user.save();
			})
			.then(() => {
				done();
			});
	});

	it('Should add a created post to the posts of the creator', function (done) {
		// dummy req object
		const req = {
			body: {
				title: 'Test Post',
				content: 'A Test Post',
				imageUrl: 'imageurl',
			},
			userId: '5c0f66b979af55031b34728a',
		};

		//dummy data
		const res = {
			status: function () {
				return this;
			},
			json: function () {},
		};

		FeedController.createPost(req, res, () => {}).then((savedUser) => {
			expect(savedUser).to.have.property('posts');
			expect(savedUser.posts).to.have.length(1);
			done();
		});
	});

	//clean the table
	after(function (done) {
		User.deleteMany({}).then(() => {
			return mongoose.disconnect().then(() => {
				done();
			});
		});
	});
});
