const passport = require('koa-passport');
const router = new (require('koa-router'))();
const busboy = require('async-busboy');
const qstring = require('querystring');

router.post('/login', async (ctx) => {
	const { fields } = await busboy(ctx.req);
	ctx.request.body = fields;
	return passport.authenticate('local', (err, user, info, status) => {
		if (err) {
			ctx.status = 500;
			console.log(err);
			return;
		}
		if (user) {
			ctx.redirect(ctx.request.body.retpage);
			console.log('Logged in successfully');
			ctx.login(user);
		} else {
			console.log('Invalid login');
			ctx.redirect('/login?' +
				qstring.stringify({ ret: ctx.request.body.retpage, failed: true}));
		}
	})(ctx);
});

router.post('/register', async (ctx) => {
	const { fields } = await busboy(ctx.req);
	ctx.request.body = fields;
	return passport.authenticate('local-signup', (err, user, info, status) => {
		if (err) {
			if (err === 'user exists') {
				console.log('User exists');
				ctx.redirect('/register?' +
					qstring.stringify({ ret: ctx.request.body.retpage, error: 'user-exists'}));
			} else if (err === 'invalid password') {
				console.log('Invalid password')

				ctx.redirect('/register?' +
					qstring.stringify({ ret: ctx.request.body.retpage, error: 'invalid-pw'}));
			} else {
				ctx.status = 500;
				console.log(err);
				return;
			}
		} else {
			if (user) {
				ctx.redirect(ctx.request.body.retpage);
				console.log('Registered successfully');
				ctx.login(user);
			} else {
				ctx.status = 500;
				return;
			}
		}
	})(ctx);
});

const pGrid = require('../lib/grid');
const shortId = require('shortid');
const files = require('../models/files');
const users = require('../models/users');
const mime  = require('mime-types');

const ALLOWED_MIMES = [
	'image/jpeg',
	'image/png',
	'image/gif',
	'image/webp',
	'image/svg+xml'
];

const TAG_REGEX = /^[a-z0-9](?:[a-z0-9\-]*[a-z0-9\-])?$/;

router.post('/upload', async (ctx) => {
	if (!ctx.isAuthenticated()) {
		ctx.throw('403');
	}

	const grid = await pGrid;

	let invalidMIME = false;

	let url = '/';
	let pId = null;
	let formdata = await busboy(ctx.req, {
		onFile: async (fieldname, file, filename, encoding, mimetype) => {
			let tempId;
			do {
				tempId = shortId.generate();
			} while (await files.findOne({ _id: tempId }));
			id = tempId;

			if (ALLOWED_MIMES.indexOf(mimetype) === -1) {
				file.resume();
				invalidMIME = true;
				return;
			}

			url = '/image/' + id;

			const gfsStream = grid.createWriteStream({
				_id: id,
				filename: filename,
				content_type: mimetype,
				metadata: {
					url:   url,
					embed: '/img/' + id + '.' + mime.extension(mimetype),
					thumb: '/img/' + id + '.' + mime.extension(mimetype),
					owner: ctx.state.user._id
				}
			});

			pId = new Promise(fulfill => {
				gfsStream.on('close', () => fulfill(id));
			});

			file.pipe(gfsStream);
		}
	});

	if (pId === null) {
		ctx.throw(500);
		return;
	}

	console.log(formdata);
	console.log(formdata.fields.tags.toLowerCase().split(' ').filter(s => TAG_REGEX.test(s)));

	files.update({ _id: await pId }, {
		$set: {
			'metadata.postname': formdata.fields.postname,
			'metadata.desc':     formdata.fields.desc,
			'metadata.tags':     formdata.fields.tags.toLowerCase().split(' ').filter(s => TAG_REGEX.test(s))
		}
	});

	ctx.redirect(url);
});

const DROP_TAG_REGEX = /^-[a-z0-9](?:[a-z0-9\-]*[a-z0-9\-])?$/;
router.post('/edit-tags', async (ctx) => {
	if (!ctx.isAuthenticated()) {
		ctx.throw('403');
	}

	const { fields } = await busboy(ctx.req);

	console.log(fields.tags.toLowerCase().split(' ').filter(s => TAG_REGEX.test(s)));
	console.log(fields.tags.toLowerCase().split(' ').filter(s => DROP_TAG_REGEX.test(s)));

	await files.update({ _id: fields.imageid }, {
		$addToSet: {
			'metadata.tags': {
				$each: fields.tags.toLowerCase().split(' ').filter(s => TAG_REGEX.test(s))
			}
		}
	});
	await files.update({ _id: fields.imageid }, {
		$pull: {
			'metadata.tags': {
				$in: fields.tags.toLowerCase().split(' ').filter(s => DROP_TAG_REGEX.test(s)).map(s => s.substring(1))
			}
		}
	});

	ctx.redirect('/image/' + fields.imageid);
});

module.exports = require('../lib/clean-router')(router);
