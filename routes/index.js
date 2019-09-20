const router    = new (require('koa-router'))();
const render    = require('../lib/views');
const reqLogin  = require('../lib/auth/require-login');
const compose   = require('koa-compose');
const files     = require('../models/files');
const mkUserbox = require('../lib/mkUserbox');
const paginate = require('koa-ctx-paginate');

async function queryFn(ctx, query, page, extraParams) {
	const processing = {
		sort: { uploadDate: -1 },
		limit: ctx.query.limit,
		skip: ctx.paginate.skip,
		fields: { _id: 1, metadata: 1 }
	};

	console.log(query);

	const images = await files.find(query, processing);
	const itemCount = await files.count(query);
	const pageCount = Math.ceil(itemCount / ctx.query.limit);

	const imgThumbs = images.map( img => ({ url: img.metadata.url, thumb: img.metadata.thumb }) );

	const renderParams = {
		images: imgThumbs,
		userbox: mkUserbox(ctx),
		pagination: {
			curPage: ctx.query.page,
			pages: paginate.getArrayPages(ctx)(7, pageCount, ctx.query.page),
			prev: ctx.state.paginate.hasPreviousPages ? ctx.state.paginate.href(true) : null,
			next: ctx.state.paginate.hasNextPages(pageCount) ?
					ctx.state.paginate.href({page: ctx.query.page + 1}) : null,
			lindent: Math.max(0, Math.min(4 - ctx.query.page, 7 - pageCount)),
			rindent: Math.max(0, 3 - (pageCount - ctx.query.page))
		}
	};

	Object.assign(renderParams, extraParams);

	console.log(renderParams.pagination.next);

	ctx.body = await render(page, renderParams);
}

router.get('/', async ctx => queryFn(ctx, {}, 'index', {}));
router.get('/tags/:tag', async ctx =>
	queryFn(ctx, { 'metadata.tags': { $all: [ ctx.params.tag ] }}, 'tag', { tag: ctx.params.tag }));
router.get('/users/:user', async ctx =>
	queryFn(ctx, { 'metadata.owner': ctx.params.user }, 'user', { user: ctx.params.user }));

const USER_REGEX = /^user:(\w+)$/;
const TAG_REGEX = /^\w+$/;
router.get('/query', async ctx => {
	let qLower = ctx.query.q.toLowerCase();
	let userOnly = qLower.match(USER_REGEX);
	if (userOnly !== null) {
		ctx.status = 301;
		ctx.redirect('/users/' + userOnly[1]);
		return;
	}

	let oneTag = qLower.match(TAG_REGEX);
	if (oneTag !== null) {
		ctx.status = 301;
		ctx.redirect('/tags/' + oneTag[0]);
		return;
	}

	let query = { };
	let tags = [];

	let split_query = qLower.split(' ');
	for (i = 0; i < split_query.length; ++i) {
		let user = split_query[i].match(USER_REGEX);

		if (user !== null) {
			query['metadata.owner'] = user[1];
		} else if (TAG_REGEX.test(split_query[i])) {
			tags.push(split_query[i]);
		}
	}

	query['metadata.tags'] = { $all: tags };

	await queryFn(ctx, query, 'index', {});
});

router.get('/image/:id/edit-tags', async (ctx) => {
	const file = await files.findOne({ _id: ctx.params.id });

	if (!file) {
		ctx.throw(404, 'Image does not exist');
	}

	ctx.body = await render('edit-tags', {
		userbox: mkUserbox(ctx),
		imageid: ctx.params.id,
		tags: file.metadata.tags
	});
});

router.del('/image/:id/tag/:tag', async ctx => {
	await files.update({ _id: ctx.params.id }, {
		$pull: { 'metadata.tags': ctx.params.tag }
	});

	ctx.status = 200;
	ctx.body = 'Deleted tag ' + ctx.params.tag;
});

router.put('/image/:id/tag/:tag', async ctx => {
	if (!TAG_REGEX.test(ctx.params.tag)) {
		ctx.throw(403);
	}
	await files.update({ _id: ctx.params.id }, {
		$addToSet: { 'metadata.tags': ctx.params.tag }
	});

	ctx.status = 200;
	ctx.body = 'Added tag ' + ctx.params.tag;
});

const users = require('../models/users');
router.get('/image/:id', async (ctx) => {
	const file = await files.findOne({ _id: ctx.params.id });

	if (!file) {
		ctx.throw(404, 'Image does not exist');
	}

	ctx.body = await render('image', {
		userbox: mkUserbox(ctx),
		postname: file.metadata.postname,
		embed: file.metadata.embed,
		ownerId: file.metadata.owner,
		ownerName: (await users.findOne({ _id: file.metadata.owner })).username,
		tags: file.metadata.tags,
		desc: file.metadata.desc,
		id: ctx.params.id
	});
});

router.use('/form', require('./form'));
router.use('/img',  require('./img'));

router.get('/upload', compose([reqLogin, async (ctx) => {
	ctx.body = await render('upload', { userbox: mkUserbox(ctx)});
}]));

router.get('/login', async (ctx) => {
	const ret = ctx.request.query.ret !== undefined ? ctx.request.query.ret : "/";
	if (ctx.isAuthenticated()) {
		ctx.response.statusCode = 303;
		ctx.redirect(ret);
	} else {
		ctx.body = await render('login',
			{ retpage: ret, failed: ctx.request.query.failed, userbox: mkUserbox(ctx) });
	}
});

router.get('/register', async (ctx) => {
	const ret = ctx.request.query.ret !== undefined ? ctx.request.query.ret : "/";
	if (ctx.isAuthenticated()) {
		ctx.response.statusCode = 303;
		ctx.redirect(ret);
	} else {
		ctx.body = await render('register',
			{ retpage: ret, error: ctx.request.query.error, userbox: mkUserbox(ctx) });
	}
});

router.get('/logout', async (ctx) => {
	ctx.logout();
	ctx.redirect('back');
});

module.exports = require('../lib/clean-router')(router);
