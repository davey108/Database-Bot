var mysql = require('mysql');

var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "JoeHadit2018",
    database: "usersdb",
    timezone: 'utc'
});

/*
This code set up the database if not exist already
 */
con.connect(function(err) {
    if (err) throw err;
    console.log("Connected!");
    con.query("CREATE DATABASE IF NOT EXISTS usersdb", function(err,result){
        if(err) throw err;
        console.log("Database usersdb created");
    });
    // max discord limit is 32 chars, 35 for extra safety, id is 25 for safety purpose
    var sql = "CREATE TABLE users (name VARCHAR(35) not null, login DATETIME(0), credit INT not null, strike INT not null, id VARCHAR(20) not null)";
    con.query(sql, function(err,result){
        if(err) throw err;
        console.log("Table created");
        console.log(result);
    });

});