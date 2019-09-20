const mongo = require('mongodb');
const db    = require('./griddb');
const grid  = require('gridfs-stream');

module.exports = db.then((dbObj) => grid(dbObj, mongo));
