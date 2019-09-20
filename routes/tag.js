const router = new (require('koa-router'))();

async function handlePage(ctx) {
	const images = await files.find({}, {
		limit: 25,
		sort: { uploadDate: -1 },
		fields: { _id: 1, metadata: 1 }
	});
	const imgThumbs = images.map( img => ({ url: img.metadata.url, thumb: img.metadata.thumb }) );

	ctx.body = await render('index', { images: imgThumbs, userbox: mkUserbox(ctx) });
}

router.get('first', '/:tag/', async ctx => {
	ctx.params.page = 1;
	await handlePage(ctx);
});

router.get('/:tag/page/1', async ctx => ctx.redirect(301, router.url('first', ctx.params.tag)));

router.get('/:tag/page/:page(\\d+)', async ctx => await handlePage(ctx));
