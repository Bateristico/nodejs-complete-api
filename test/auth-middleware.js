const expect = require('chai').expect;
const jwt = require('jsonwebtoken');
const sinon = require('sinon');

const authMiddleware = require('../middleware/is-auth');

describe('Auth middleware', function () {
	it('Should throw an error if no authorization header is present', function () {
		const req = {
			get: function () {
				return null;
			},
		};
		//call the middleware with req with empty header (reference)
		expect(authMiddleware.bind(this, req, {}, () => {})).to.throw(
			'Not authenticated'
		);
	});

	it('Should throw an error if the authorization header is only one string', function () {
		const req = {
			get: function (headerName) {
				return 'asd';
			},
		};

		expect(authMiddleware.bind(this, req, {}, () => {})).to.throw();
	});

	it('Should throw an error if the token cannot be verified', function () {
		const req = {
			get: function () {
				return 'Bearer asd';
			},
		};
		expect(authMiddleware.bind(this, req, {}, () => {})).to.throw();
	});

	it('Should yield a userId after decoding the token', function () {
		const req = {
			get: function () {
				return 'Bearer asd';
			},
		};
		// mock jwt verification
		sinon.stub(jwt, 'verify');
		jwt.verify.returns({ userId: 'fake user' });

		authMiddleware(req, {}, () => {});
		expect(req).to.have.property('userId');
		expect(req).to.have.property('userId', 'fake user');
		expect(jwt.verify.called).to.be.true;
		jwt.verify.restore();
	});
});
