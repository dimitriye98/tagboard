const compose = require('koa-compose');

module.exports = (router) => {
	const fn = compose([router.routes(), router.allowedMethods()]);
	fn.router = router;
	return fn;
};
