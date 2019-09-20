var monk = require('monk');

// Initialize database connection
module.exports = monk('mongo/test');
