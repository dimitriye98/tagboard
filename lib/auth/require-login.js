const render = require('../views');
const qstring = require('querystring');

module.exports = async (ctx, next) => {
	if (ctx.isAuthenticated()) {
		await next();
	} else {
		// ctx.status = 401;
		// console.log(ctx.request.path);
		// ctx.body = await render('login', {retpage: ctx.request.path.toString()});
		ctx.redirect('/login?' + qstring.stringify({ret: ctx.request.path}));
	}
};
