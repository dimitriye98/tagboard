const http     = require('http');
const koa      = require('koa');
const logger   = require('koa-logger');
const serve    = require('koa-static');
const stylus   = require('koa-stylus');
const session  = require('./lib/session');
const passport = require('koa-passport');
const routes   = require('./routes');
const paginate = require('koa-ctx-paginate');

console.log(paginate);

// Create koa app
var app = new koa();

app.use(session(app));

require('./lib/auth/passport.js');

app.use(passport.initialize());
app.use(passport.session());

// middleware
app.use(logger());
app.use(stylus('./public'));
app.use(serve('./public'));

app.use(paginate.middleware(30, 120));

// const cache = require('koa-redis-cache');
// app.use(cache({
// 	routes: ['/img'],
// 	redis: {
// 		host: 'redis'
// 	}
// }));

// load routes
app.use(routes);

// Create HTTP Server
http.createServer(app.callback()).listen(3000);
console.log('Server listening on port 3000');
