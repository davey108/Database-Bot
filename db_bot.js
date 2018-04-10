const Discord = require('discord.io');
const adminRoleID = '426481518274150420';
const serverID = '366786162238554112';
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
 * @param {int} userID - the nickname of the user on discord for the room: This name is tag-able
 * @param {int} channelID - the channel to send the message to
 * @param {function} evt - event to do something extra, a potential callback
 */
bot.on('message', function (user, userID, channelID, message, evt) {
    let serverID = '366786162238554112';
	if(channelID == 408777732579917824){
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
                case 'banself':
                    removeUserFromDB(user,userID,channelID);
                break;
                // admin priviledged command
                case 'remove':
                    if(checkAdminPriviledge(userID)){
                        // args[0] now is the next argument since we splice it by space
                        removeUserFromDB(args[0],userID,channelID);
                    }
                    else{
                        bot.sendMessage({
                           to: channelID,
                           message: "<@!" + userID + ">" + ' You do not have admin priviledge to use this command',
                        });
                    }

                break;
                case 'mark':
                    if(checkAdminPriviledge(userID)){
                        increaseStrike(print_strike,args[0],userID,channelID);
                    }
                    else{
                        bot.sendMessage({
                            to: channelID,
                            message: "<@!" + userID + ">" + ' You do not have admin priviledge to use this command',
                        });
                    }
                break;
                case 'mystrike':
                    print_strike(user,userID,channelID);
                break;
                case 'credit':
                    getCreditFromDB(printCredits,user,userID,channelID);
                break;
                case 'help':
                    bot.sendMessage({
                       to: channelID,
                       message: helpTable(),
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
@param {int} channelID - the channel name that the message suppose to be send to
@param {int} userID - the userID to send the message to and update key to the database
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
@param {int} channelID - the name of the channel to send message to
@param {string} userName - the name of the user in discord
@param {int} userID - the name of the user to tag in the message send
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
 * @param {int} userID - the user name key to look for to insert the data into that user row
 * @param {string} userName - the user name in discord
 * @param {object} value - the new credit value to insert
 * @param {int} channelID - the channel name to print out error message
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
 * @param userID {int}- the unique userID on discord for error message
 * @param userName {string} - the user name in the forum
 * @param channelID {int} - the channel to send message to
 */
function insertNewDataToDB(userID,userName,channelID){
    let currentTime = moment().format("YYYY-MM-DD HH:mm:ss");
    let credit = 200;
    let strike = 0;
    let sql = "insert into users (name,login,credit,strike,id) values " + '(' + "\'" + userName + "\'" + "," +
        "\'" + currentTime + "\'" + "," + "\'" + credit + "\'" + "," + "\'" + strike + "\'" + "," + "\'" + userID.toString() + "\'" + ')';
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
 * @param {string} userName - the user name in the discord forum
 * @param {int} userID - the user id in discord system
 * @param {int} channelID - the channel to send the message to
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
            if(result.affectedRows < 1){
                bot.sendMessage({
                    to: channelID,
                    message: "<@!" + userID + ">" + ' The data you requested for delete does not exist',
                });
            }
            else {
                bot.sendMessage({
                    to: channelID,
                    message: "<@!" + userID + ">" +  ' ' + userName + ' has been successfully removed!',
                });
            }
        }
    });
}

/**
 * Get the user credit from the database and display to them the number of credit they have
 * @callback cb - the call back function that is responsible for printing the message to the user
 * @param {string} userName - the user name on the discord forum
 * @param {int} userID - the user id on discord
 * @param {int} channelID - the channel to print the message to
 */
function getCreditFromDB(cb,userName,userID,channelID){
    let sql = "select * from users where name = " + "\'" + userName + "\'";
    let operation_result = false;
    con.query(sql, function(err, result){
        if(err) {
            console.log(err);
            return;
        }
        if(!Array.isArray(result) || !result.length){
            bot.sendMessage({
               to: channelID,
               message: "<@!" + userID + ">" + ' Your data does not exist! I recommend you to register by typing !daily',
            });
        }
        else {
            let credit = result[0].credit;
            return cb(credit, userID, channelID);
        }
    });
}

/**
 * Print out the credit value a user has
 * @param creditValue - the credit amount a user has
 * @param userID - the user id on discord
 * @param channelID - the channel to print message to
 */
function printCredits(creditValue,userID,channelID){
    bot.sendMessage({
       to: channelID,
       message: "<@!" + userID + ">" + ' Your credit amount is: ' + creditValue,
    });
}

/**
 * Check if the user has an admin priviledge
 * @param {int} userID - the userID to check priviledge
 * @return boolean - true if the user has admin priviledge, false otherwise
 */
function checkAdminPriviledge(userID){
    let isAdmin = bot.servers[serverID].members[userID.toString()].roles.includes(adminRoleID);
    return isAdmin;
}

/**
 * Get the strike from the user and increment it by 1, if the user reaches 3 strike, then they are ban
 * from the server, else, their new data is updated
 * @param cb callback - a callback to insert new strike to record
 * @param {string} userName - the user name on discord server
 * @param {int} userID - the user id on discord
 * @param {int} channelID - the channel id on discord
 */
function increaseStrike(cb,userName,userID,channelID){
    let sql = "select * from users where name = " + "\'" + userName + "\'";
    con.query(sql,function(err,result){
       if(err){
           console.log(err);
           return;
       }
       else{
           if(!Array.isArray(result) || !result.length){
               bot.sendMessage({
                  to: channelID,
                  message: "<@!" + userID + ">" + ' Cannot find the user: ' + userName + " in the database",
               });
           }
           else{
               let strike_amount = result[0].strike;
               strike_amount += 1;
               if(strike_amount == 3){
                   removeUserFromDB(userName,userID,channelID);
               }
               else{
                   updateNewStrikeVal(userName,userID,channelID,strike_amount);
               }
           }
       }
    });
}

/**
 * Get the user's strike from the database
 * @param {string} userName - the user name to look for in the database
 * @param {int} userID - the user id in discord
 * @param {int} channelID - the channel id in discord to send message to
 */
function print_strike(userName,userID,channelID){
    let sql = "select * from users where name =" + "\'" + userName + "\'";
    con.query(sql,function(err,result){
       if(err){
           console.log(err);
           bot.sendMessage({
              to: channelID,
              message: "<@!" + userID + ">" + ' Failed to access database! Check log for error',
           });
       }
       else{
           if(!Array.isArray(result) || !result.length){
               bot.sendMessage({
                  to: channelID,
                   message: "<@!" + userID + ">" + ' Your data does not exist! Please register with !daily',
               });
           }
           else{
               let strike = result[0].strike;
               bot.sendMessage({
                   to: channelID,
                   message: "<@!" + userID + ">" + ' Your current strike: ' + strike,
               });
           }
       }
    });
}

/**
 * Insert a new strike value to a desirable user's data
 * @param {string} userName - the name of the user in discord server
 * @param {int} userID - the user id int integer
 * @param {int} channelID - the channel id to send message to
 * @param {int} newStrikeValue - the new value of strike to insert to db
 */
function updateNewStrikeVal(userName,userID,channelID,newStrikeValue){
    let sql = "update users set strike =" + "\'" + newStrikeValue + "\'" + "where name=" + "\'" + userName + "\'";
    con.query(sql,function(err,result){
       if(err){
           console.log(err);
           bot.sendMessage({
              to: channelID,
              message: "<@!" + userID + ">" + ' Failed to update new strike value in database. Refer to log',
           });
       }
       // successful update
       else{
           let sql = "select * from users where name =" + "\'" + userName + "\'";
           con.query(sql,function(err,result){
              if(err){
                  console.log(err);
                  bot.sendMessage({
                      to: channelID,
                      message: "<@!" + userID + ">" + ' Failed to refetch value of user id. Refer to log for details',
                  });
              }
              else{
                  let id = result[0].id;
                  bot.sendMessage({
                      to: channelID,
                      message: "<@!" + id + ">" + ' You have been warned!',
                  });
              }
           });
       }
    });
}

/**
 * Return the list of command including their description in a string
 * @return {string} list of all commands and their description
 */
function helpTable(){
    let commandList = "Type ! in front of all these commands\n" +
        "daily - get yourself 200 credits every day (time between must be 24 hours apart)\n" +
        "banself - remove all your records from the database\n" +
        "remove userName - remove the specified userName from the database (must have admin access)\n" +
        "mark userName - increase the specified userName strike count by 1 (must have admin access)\n" +
        "mystrike - see how many strikes you have\n" +
        "credit - see how many credits you have\n";
    return commandList;
}
