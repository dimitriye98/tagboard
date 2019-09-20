const passport = require('koa-passport');
const crypto   = require('crypto');
const users    = require('../../models/users');

function doHash(password) {
	return crypto.createHash('sha512').update(password).digest('base64');
}

passport.serializeUser((user, done) => {
	console.log('Serialized id: ' + user._id);
	done(null, user._id);
});

passport.deserializeUser((id, done) => {
	console.log('deserialize');
	users.findOne({ _id: id }).then(user => done(null, user));
});

console.log('Serialization support ready');

const localStrategy = require('passport-local').Strategy;
passport.use('local', new localStrategy((username, password, done) => {
	const query = {
		_id: username.toLowerCase(),
		password: doHash(password)
	};
	users.findOne(query).then(user => done(null, user)).catch(done);
}));

const PW_REGEX = /^[\w.,;:!?&@#$%'"][\w.,;:!?&@#$%'" ]{6,}[\w.,;:!?&@#$%'"]$/;

passport.use('local-signup', new localStrategy((username, password, done) => {
	if (!PW_REGEX.test(password)) {
		done('invalid password');
		return;
	}
	const pwHash = doHash(password);
	const query = {
		_id: username.toLowerCase(),
		password: pwHash
	};
	users.findOne(query).then(user => {
		if (user) {
			done('user exists');
		} else {
			const newUser = {
				_id: username.toLowerCase(),
				username: username,
				password: pwHash
			};

			users.insert(newUser).then(res => done(null, res));
		}
	}).catch(done);
}));
