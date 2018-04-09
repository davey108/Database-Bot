const Discord = require('discord.io');
var auth = require('./auth.json');
var mysql = require('mysql');
var moment = require('moment');
moment().format();
// Initialize Discord Bot
var bot = new Discord.Client({
   token: auth.token,
   autorun: true
});


var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "JoeHadit2018",
    database: "usersdb",
    timezone: 'utc'
});

bot.on('ready', function (evt) {
    console.log('Logged in as %s - %s\n', bot.username, bot.id);
});

/*
Function to mark the bot purpose is to send message while it is on
@param {string} message - the string to tell the bot .on function is to send message
@callback function - the function to do after bot.on(function to do) is successful
 */
/**
 * Callback function does the message sending to the server
 * @param {string} user - the system name of the user on discord: THIS NAME IS UNIQUE PER USER
 * @param {string} userID - the nickname of the user on discord for the room: This name is tag-able
 * @param {string} channelID - the channel to send the message to
 * @param {function} evt - event to do something extra, a potential callback
 */
bot.on('message', function (user, userID, channelID, message, evt) {
	if(channelID === 408777732579917824){
		// Our bot needs to know if it will execute a command
		// It will listen for messages that will start with `!`
		if (message.substring(0, 1) == '!') {
			let args = message.substring(1).split(' ');
			let cmd = args[0];
			args = args.splice(1);
			switch(cmd) {
				case 'daily':
				    getTimeFromDb(user,channelID,userID,time_result);
				break;
                case 'ban':
                    bot.sendMessage({
                        to: channelID,
                        message: removeUserFromDB(user,userID,channelID),
                    });
                    break;
				default:
					bot.sendMessage({
						to: channelID,
						message: "<@!" + userID + ">" + ' No commands matching! Type !help for list of commands',
					});
				// Just add any case commands if you want to..
			 }
		 }
	}
});

/*
Gets the last login time of user from the database based on their user name
@param {string} userName - the name of the user in discord
@param {string} channelID - the channel name that the message suppose to be send to
@param {string} userID - the userID to send the message to and update key to the database
@param {function} callback - a callback function depending on the result of the checking, most likely time_result()
 */
function getTimeFromDb(userName,channelID,userID,callback){
    let sql = "select * from users where name = " + "\'" + userName + "\'";
    let operation_result = false;
	con.query(sql, function(err, result){
		if(err) {
            console.log(err);
            return;
        }
        if(!Array.isArray(result) || !result.length){
            insertNewDataToDB(userID,userName,channelID);
        }
        else {
            let time = result[0].login;
            let credit = result[0].credit;
            let current = moment();
            let user_last_login = moment(time);
            let diff = current.diff(user_last_login, 'days');
            if (diff >= 1) {
                operation_result = true;
            }
            return callback(operation_result, channelID, userName, userID, credit);
        }
	});
}
/*
Accepts a result from a checking operation and does the insert, then print out to the appropriate user
the result of the operation
@param {boolean} result - the result of the checking operation
@param {string} channelID - the name of the channel to send message to
@param {string} userName - the name of the user in discord
@param {string} userID - the name of the user to tag in the message send
@param {int} previousValue - the current credit value before adding new credit
 */
function time_result(result,channelID,userName,userID,previousValue){
    if(result === true) {
        let currentValue = previousValue + 200;
        updateDBLogin(userID,userName,channelID,currentValue);
        bot.sendMessage({
            to: channelID,
            message: "<@!" + userID + ">" + ' You have received 200 daily credits',
        });
    }
    else{
        bot.sendMessage({
            to: channelID,
            message: "<@!" + userID + ">" + ' You has logged in within previous 24 hours',
        })
    }
}
/**
 * Update the database with a new credit value and login time
 * @param {string} userID - the user name key to look for to insert the data into that user row
 * @param {string} userName - the user name in discord
 * @param {object} value - the new credit value to insert
 * @param {string} channelID - the channel name to print out error message
 */
function updateDBLogin(userID,userName,channelID,value){
    //var sql = "update users set " + columnName + "=" +  "\'" + value + "\'" +" where name =" +"\'" + userID + "\'";
    let currentTime = moment().format("YYYY-MM-DD HH:mm:ss");
    let sql = "update users set credit" + "=" +  "\'" + value + "\'" + ", login=" + "\'" + currentTime + "\'"
        +" where name =" +"\'" + userName + "\'";
    con.query(sql,function(err,result){
       if(err){
           console.log(err);
           bot.sendMessage({
               to: channelID,
               message: "<@!" + userID + ">" + ' Failed to update your data in the database!',
           });
       }
    });
}

/**
 * Insert the new user data into the database with current time for login time, 200 credits for initial
 * @param userID - the unique userID on discord for error message
 * @param userName - the user name in the forum
 * @param channelID - the channel to send message to
 */
function insertNewDataToDB(userID,userName,channelID){
    let currentTime = moment().format("YYYY-MM-DD HH:mm:ss");
    let credit = 200;
    let strike = 0;
    let sql = "insert into users (name,login,credit,strike) values " + '(' + "\'" + userName + "\'" + "," +
        "\'" + currentTime + "\'" + "," + "\'" + credit + "\'" + "," + "\'" + strike + "\'" + ')';
    con.query(sql,function(err,result){
        if(err){
            console.log(err);
            bot.sendMessage({
                to: channelID,
                message: "<@!" + userID + ">" + ' Failed to create your data in the database!',
            });
        }
        else{
            bot.sendMessage({
                to: channelID,
                message: "<@!" + userID + ">" + ' You have received your daily 200 credits!',
            });
        }

    })
}

/**
 * Remove a user from the database, i.e use if they are banned
 * @param userName - the user name in the discord forum
 * @param userID - the user id in discord system
 * @param channelID - the channel to send the message to
 */
function removeUserFromDB(userName,userID,channelID){
    let sql = "delete from users where name =" + "\'" + userName + "\'";
    con.query(sql,function(err,result){
        if(err){
            console.log(err);
            bot.sendMessage({
               to: channelID,
               message: "<@!" + userID + ">" + ' Failed to remove data from database!',
            });
        }
        else{
            bot.sendMessage({
                to: channelID,
                message: "<@!" + userID + ">" + ' Data has been successfully removed!',
            });
        }
    });
}

