let res = [
	db.fs.files.createIndex( { 'uploadDate': -1 }),
	db.fs.files.createIndex( { 'metadata.owner': 1, 'uploadDate': -1 } ),
	db.fs.files.createIndex( { 'metadata.tags': 1, 'uploadDate': -1 } )
];

printjson(res);
