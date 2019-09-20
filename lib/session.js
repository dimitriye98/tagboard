const session    = require('koa-session');
const redisStore = require('koa-redis');

const CONFIG = {
	key: 'tboard:sess', /** (string) cookie key (default is koa:sess) */
	/** (number || 'session') maxAge in ms (default is 1 days) */
	/** 'session' will result in a cookie that expires when session/browser is closed */
	/** Warning: If a session cookie is stolen, this cookie will never expire */
	maxAge: 86400000,
	overwrite: true, /** (boolean) can overwrite or not (default true) */
	httpOnly: true, /** (boolean) httpOnly or not (default true) */
	signed: true, /** (boolean) signed or not (default true) */
	rolling: false, /** (boolean) Force a session identifier cookie to be set on every response. The expiration is reset to the original maxAge, resetting the expiration countdown. default is false **/
	store: new redisStore({
		host: 'redis'
	})
};

module.exports = (app) => {
	app.keys = ['secrets and stuff'];

	return session(CONFIG, app);
};
