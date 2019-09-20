const db = require('../lib/db');

module.exports = db.get('fs.files', {
	castIds: false
});
