module.exports = function(ctx) {
	return {
		page: ctx.request.url,
		user: ctx.state.user !== undefined ? ctx.state.user.username : null
	};
}

