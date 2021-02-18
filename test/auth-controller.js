const expect = require('chai').expect;
const sinon = require('sinon');
const mongoose = require('mongoose');
const dotenv = require('dotenv').config();

const { DB_TEST_URI } = process.env;

const User = require('../models/user');
const AuthController = require('../controllers/auth');

describe('Auth controller', function () {
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

	it('Should throw an error with code 500 if accessing the database fails', function (done) {
		// mock database query
		sinon.stub(User, 'findOne');
		User.findOne.throws();

		// dummy req object
		const req = {
			body: {
				email: 'test@test.com',
				password: 'test',
			},
		};

		AuthController.login(req, {}, () => {})
			.then((result) => {
				expect(result).to.be.an('error');
				expect(result).to.have.property('statusCode', 500);
				done();
			})
			.catch((err) => {
				done(err);
			});

		User.findOne.restore();
	});

	it('Should send a response with a valid user status for an existing user', function (done) {
		const req = { userId: '5c0f66b979af55031b34728a' };
		const res = {
			statusCode: 500,
			userStatus: null,
			status: function (code) {
				this.statusCode = code;
				return this;
			},
			json: function (data) {
				this.userStatus = data.status;
			},
		};
		AuthController.getUserStatus(req, res, () => {})
			.then(() => {
				expect(res.statusCode).to.be.equal(200);
				expect(res.userStatus).to.be.equal('I am new!');
				done();
			})
			.catch((err) => {
				done(err);
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
