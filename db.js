var mysql2 = require('mysql2');

var db = mysql2.createConnection({
  host: "localhost",
  user: "root",
  password: "root",
  database: "cafe"
});



module.exports=db;
