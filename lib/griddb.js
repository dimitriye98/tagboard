const mongo = require('mongodb');

module.exports = new Promise((fulfill, reject) => {
	mongo.MongoClient.connect('mongodb://mongo/test', (err, db) => {
		if (err) {
			reject(err);
		}
		fulfill(db);
	});
});
