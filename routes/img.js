const router = new (require('koa-router'))();
//const render = require('../lib/views');

const files = require('../models/files');
const pGrid  = require('../lib/grid');

function snapSize(s) {
	if ((s & (s - 1)) === 0) {
		return s;
	}
	return 1 << Math.ceil(Math.log2(s));
}

router.get('/:id([a-zA-Z0-9\\_\\-\\=]+)', async (ctx) => {
	const file = await files.findOne({ _id: ctx.params.id });

	if (!file) {
		ctx.throw(404, 'Image does not exist');
	}

	const extMatch = file.filename.match('\\.\\w+?$');
	const extension = extMatch ? extMatch[0].toLowerCase() : null;

	ctx.response.status = 301;
	ctx.response.redirect(ctx.params.id + extension + ctx.query.s ? '?s=' + snapSize(parseInt(ctx.query.s)) : '');
});

const compose = require('koa-compose');
const sharp = require('sharp');

router.get('/:id([a-zA-Z0-9\\_\\-\\=]+).:ext', async (ctx) => {
	let s = null;
	if (ctx.query.s) {
		s = parseInt(ctx.query.s);
		if ((s & (s - 1)) !== 0) {
			console.log((s & (s - 1)));
			s = snapSize(s);
			ctx.status = 301;
			ctx.redirect(ctx.request.path + '?s=' + s);
			return;
		}
	}

	const file = await files.findOne({ _id: ctx.params.id });

	if (!file) {
		ctx.throw(404, 'Image does not exist');
	}

	const extMatch = file.filename.match('\\.(\\w+?)$');
	const extension = extMatch ? extMatch[1].toLowerCase() : null;

	if (extension && extension !== ctx.params.ext.toLowerCase()) {
		ctx.response.status = 301;
		let redirect = ctx.params.id + '.' + extension;
		if (ctx.querystring) {
			redirect += '?' + ctx.querystring;
		}
		ctx.response.redirect(redirect);
	}

	const grid = await pGrid;

	ctx.response.type = extension;

	const stream = grid.createReadStream({_id: ctx.params.id});
	if (s) {
		ctx.response.body = stream.pipe(sharp().resize(s).withoutEnlargement());
	} else {
		ctx.response.body = stream;
	}
});

module.exports = require('../lib/clean-router')(router);
