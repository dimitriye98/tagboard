const db = require('../lib/db');

module.exports = db.get('users', {
	castIds: false
});

module.exports = db.get('users');
