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
    host: "",
    user: "",
    password: "",
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
                        sendMessage(userID,channelID,"You do not have admin access to this command");
                    }
                break;
                case 'mark':
                    if(checkAdminPriviledge(userID)){
                        increaseStrike(args[0],userID,channelID);
                    }
                    else{
                        sendMessage(userID,channelID,"You do not have admin access to this command");
                    }
                break;
                case 'gcredit':
                    if(checkAdminPriviledge(userID)){
                        insertCreditAmount(args[1],userID,channelID,args[0]);
                    }
                    else{
                        sendMessage(userID,channelID,"You do not have admin access to this command");
                    }
                break;
                case 'mystrike':
                    print_strike(user,userID,channelID);
                break;
                case 'credit':
                    getCreditFromDB(printCredits,user,userID,channelID);
                break;
                case 't':
                    sendMessage(userID,channelID,"<:whatthe:433375157185413134>");
                break;
                case 'help':
                    bot.sendMessage({
                       to: channelID,
                       message: helpTable(),
                    });
                break;
                default:
                    sendMessage(userID,channelID,"No command matching! Type !help for list of commands");
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
        sendMessage(userID,channelID,"You have received 200 daily :moneybag:");
    }
    else{
        sendMessage(userID,channelID,"You have logged in within previous 24 hours");
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
           sendMessage(userID,channelID,"Failed to update your data in the database");
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
            sendMessage(userID,channelID,"Failed to create your data in the database");
        }
        else{
            sendMessage(userID,channelID,"You have received your 200 daily :moneybag:!");
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
            sendMessage(userID,channelID,"Failed to remove data from database. Check log for error");
        }
        else{
            if(result.affectedRows < 1){
                sendMessage(userID,channelID,"The data you request for delete does not exist");
            }
            else {
                sendMessage(userID,channelID,userName + ' has been removed!');
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
            sendMessage(userID,channelID,'Your data does not exist! I recommend you to register by typing !daily')
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
   sendMessage(userID,channelID,"Your :moneybag: is: " + creditValue);
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
 * @param {string} userName - the user name on discord server
 * @param {int} userID - the user id on discord
 * @param {int} channelID - the channel id on discord
 */
function increaseStrike(userName,userID,channelID){
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
 * Increase a user's strike record. ONLY USE BY THE AUTOMATED SYSTEM
 * @param {int} userID - the user id to increase strike
 * @param {int} channelID - the channel to print the message to
 */
function increaseStrikeBot(userID,channelID){
    let sql = "select * from users where id = " + "\'" + userID + "\'";
    con.query(sql,function(err,result){
        if(err){
            console.log(err);
        }
        else{
            if(!Array.isArray(result) || !result.length){
                bot.sendMessage({
                    to: channelID,
                    message: "Cannot find the user requested in the database",
                });
            }
            else{
                let strike_amount = result[0].strike;
                strike_amount += 1;
                if(strike_amount == 3){
                    removeUserFromDBBot(userID,channelID);
                }
                else{
                    updateStrikeBot(userID,channelID,strike_amount);
                }
            }
        }
    });
}
/**
 * Remove a user from the database, ONLY FOR THE BOT AUTOMATION TO USE!
 * @param {int} userID - the user id to remove
 * @param {int} channelID - the channel id to send confirmation message to
 */
function removeUserFromDBBot(userID,channelID){
    let sql = "delete from users where id =" + "\'" + userID + "\'";
    con.query(sql,function(err,result){
        if(err){
            console.log(err);
        }
        else{
            if(result.affectedRows < 1){
                sendMessage(userID,channelID,"The data for this user does not exist");
            }
            else {
                // not sure if work if the user is banned
                sendMessage(userID,channelID,"has been banned from server!");
            }
        }
    });
}

/**
 * Update a user's strike amount in the database, ONLY FOR THE BOT AUTOMATION TO USE!
 * @param {int} userID - the user id to increase strike amount
 * @param {int} channelID - the channel id to send message to
 */
function updateStrikeBot(userID,channelID,newStrikeValue){
    let sql = "update users set strike =" + "\'" + newStrikeValue + "\'" + "where id=" + "\'" + userID + "\'";
    con.query(sql,function(err,result){
        if(err){
            console.log(err);
            bot.sendMessage({
                to: channelID,
                message: "Failed to access database. Refer to log for error",
            })
        }
        // successful update
        else{
            sendMessage(userID,channelID,"You have been warned!");
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
                   sendMessage(userID,channelID,'Failed to access database! Check log for error');
               }
               else{
                   if(!Array.isArray(result) || !result.length){
                       sendMessage(userID,channelID,'Your data does not exist! Please register with !daily');
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
           sendMessage(userID,channelID,'Failed to update new strike value in database. Refer to log');
       }
       // successful update
       else{
           let sql = "select * from users where name =" + "\'" + userName + "\'";
           con.query(sql,function(err,result){
              if(err){
                  console.log(err);
                  sendMessage(userID,channelID,'Failed to refetch value of user id. Refer to log for details');
              }
              else{
                  let id = result[0].id;
                  sendMessage(id,channelID,"You have been warned!");
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

/**
 * Add the desired amount into the specified user's credit
 * @param {string} amountAdd - the amount to add
 * @param {int} userID - the user id on discord
 * @param {int} channelID - the channel to send message to
 * @param {string} userName - the user name on discord server to add credit to
 */
function insertCreditAmount(amountAdd,userID,channelID,userName){
    let sql = "select * from users where name =" + "\'" + userName + "\'";
    con.query(sql,function(err,result){
       if(err){
           console.log(err);
           sendMessage(userID,channelID,"Failed to fetch the data from database. Refer to log for error");
       }
       else{
           if(!Array.isArray(result) || !result.length){
               sendMessage(userID,channelID,"User data does not exist! Tell them to register using !daily");
           }
           else{
               let currentCredit = result[0].credit;
               let addedUserID = result[0].id;
               amountAdd = parseInt(amountAdd);
               // if the amount adding is negative and it is greater than current own credit, then only subtract credit
               // until reaches 0
               if(amountAdd < 0 && Math.abs(amountAdd) > currentCredit){
                   amountAdd = currentCredit * -1;
               }
               // if the amount add is 0 after all checking, don't need to access database
               if(amountAdd == 0){
                   sendMessage(userID,channelID,"You don't have enough credit");
               }
               else {
                   let newCredit = currentCredit + amountAdd;
                   let sql = "update users set credit=" + "\'" + newCredit + "\'" + "where name=" + "\'" + userName + "\'";
                   con.query(sql, function (err, result) {
                       if (err) {
                           console.log(err);
                           sendMessage(userID, channelID, "Failed to update data. Refer to log for error");
                       }
                       else {
                           if (amountAdd < 0) {
                               sendMessage(addedUserID, channelID, "You have lost " + amountAdd * -1 + " :moneybag:");
                           }
                           else {
                               sendMessage(addedUserID, channelID, "You have received " + amountAdd + " :moneybag:");
                           }
                       }
                   });
               }
           }
       }
    });
}

/**
 * Add a number of credit to a user's account. ONLY USE BY AUTOMATED SYSTEM
 * @param {int} userID - the user id to add credits to
 * @param {int} channelID - the channel id to send message to
 * @param {string} amount - the amount to increase the user's credit by
 */
function insertCreditBot(userID,channelID,amount){
    let sql = "select * from users where id =" + "\'" + userID + "\'";
    con.query(sql,function(err,result){
        if(err){
            console.log(err);
            bot.sendMessage({
                to: channelID,
                message: "Failed to fetch data. Refer to log for error!",
            });
        }
        else{
            if(!Array.isArray(result) || !result.length){
                bot.sendMessage({
                   to: channelID,
                   message: "User data does not exist!",
                });
            }
            else{
                let currentCredit = result[0].credit;
                amount = parseInt(amount);
                // negative credit
                if(amount < 0 && Math.abs(amount) > currentCredit){
                    amount = currentCredit * -1;
                }
                if(amount == 0){
                    sendMessage(userID,channelID,"You do not have enough credit");
                }
                else {
                    let newCredit = currentCredit + amount;
                    let sql = "update users set credit=" + "\'" + newCredit + "\'" + "where id=" + "\'" + userID + "\'";
                    con.query(sql, function (err, result) {
                        if (err) {
                            console.log(err);
                            bot.sendMessage({
                                to: channelID,
                                message: "Failed to update user data. Refer to log for error!",
                            });
                        }
                        else {
                            sendMessage(userID, channelID, "You have received " + amount + " :moneybag:");
                        }
                    });
                }
            }
        }
    });
}

/**
 * Send the appropriate message to the user
 * @param {int} userID - the user id to send message to
 * @param {int} channelID - the channel id to send message to
 * @param {string} message - the message
 */
function sendMessage(userID,channelID,message){
    bot.sendMessage({
       to: channelID,
       message: "<@!" + userID + ">" + " " + message,
    });
}
