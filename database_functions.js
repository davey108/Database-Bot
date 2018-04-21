var mysql = require('mysql');
var moment = require('moment');
var db_bot = require('./db_bot.js');
moment().format();

var con = mysql.createConnection({
    host: "",
    user: "",
    password: "",
    database: "usersdb",
    timezone: 'utc'
});

/*
Gets the last login time of user from the database based on their user name
@param {string} userName - the name of the user in discord
@param {int} channelID - the channel name that the message suppose to be send to
@param {int} userID - the userID to send the message to and update key to the database
@param {function} callback - a callback function depending on the result of the checking, most likely time_result()
 */
function getTimeFromDb(userName,channelID,userID,callback){
    sql = "select * from users where name = " + "\'" + userName + "\'";
    operation_result = false;
    con.query(sql, function(err, result){
        if(err) {
            console.log(err);
            return;
        }
        if(!Array.isArray(result) || !result.length){
            insertNewDataToDB(userID,userName,channelID);
        }
        else {
            time = result[0].login;
            credit = result[0].credit;
            current = moment();
            user_last_login = moment(time);
            // prevent rounding
            diff = current.diff(user_last_login, 'days',true);
            if (diff >= 1) {
                operation_result = true;
            }
            return callback(operation_result, channelID, userName, userID, credit);
        }
    });
};
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
        currentValue = previousValue + 200;
        updateDBLogin(userID,userName,channelID,currentValue);
        db_bot.sendMessage(userID,channelID,"You have received daily: 200 :moneybag:");
    }
    else{
        db_bot.sendMessage(userID,channelID,"You have logged in within previous 24 hours");
    }
};
/**
 * Update the database with a new credit value and login time
 * @param {int} userID - the user name key to look for to insert the data into that user row
 * @param {string} userName - the user name in discord
 * @param {object} value - the new credit value to insert
 * @param {int} channelID - the channel name to print out error message
 */
function updateDBLogin(userID,userName,channelID,value){
    //var sql = "update users set " + columnName + "=" +  "\'" + value + "\'" +" where name =" +"\'" + userID + "\'";
    currentTime = moment().format("YYYY-MM-DD HH:mm:ss");
    sql = "update users set credit" + "=" +  "\'" + value + "\'" + ", login=" + "\'" + currentTime + "\'"
        +" where name =" +"\'" + userName + "\'";
    con.query(sql,function(err,result){
        if(err){
            console.log(err);
            db_bot.sendMessage(userID,channelID,"Failed to update your data in the database");
        }
    });
};

/**
 * Insert the new user data into the database with current time for login time, 200 credits for initial
 * @param userID {int}- the unique userID on discord for error message
 * @param userName {string} - the user name in the forum
 * @param channelID {int} - the channel to send message to
 */
function insertNewDataToDB(userID,userName,channelID){
    currentTime = moment().format("YYYY-MM-DD HH:mm:ss");
    credit = 200;
    strike = 0;
    sql = "insert into users (name,login,credit,strike,id) values " + '(' + "\'" + userName + "\'" + "," +
        "\'" + currentTime + "\'" + "," + "\'" + credit + "\'" + "," + "\'" + strike + "\'" + "," + "\'" + userID.toString() + "\'" + ')';
    con.query(sql,function(err,result){
        if(err){
            console.log(err);
            db_bot.sendMessage(userID,channelID,"Failed to create your data in the database");
        }
        else{
            db_bot.sendMessage(userID,channelID,"You have received daily: 200 :moneybag:!");
        }

    });
};

/**
 * Remove a user from the database, i.e use if they are banned
 * @param {string} userName - the user name in the discord forum
 * @param {int} userID - the user id in discord system
 * @param {int} channelID - the channel to send the message to
 */
function removeUserFromDB(userName,userID,channelID){
    sql = "delete from users where name =" + "\'" + userName + "\'";
    con.query(sql,function(err,result){
        if(err){
            console.log(err);
            db_bot.sendMessage(userID,channelID,"Failed to remove data from database. Check log for error");
        }
        else{
            if(result.affectedRows < 1){
                db_bot.sendMessage(userID,channelID,"The data you request for delete does not exist");
            }
            else {
                db_bot.sendEmbed(userID,channelID,true,0);
            }
        }
    });
};

/**
 * Get the user credit from the database and display to them the number of credit they have
 * @callback cb - the call back function that is responsible for printing the message to the user
 * @param {string} userName - the user name on the discord forum
 * @param {int} userID - the user id on discord
 * @param {int} channelID - the channel to print the message to
 */
function getCreditFromDB(cb,userName,userID,channelID){
    sql = "select * from users where name = " + "\'" + userName + "\'";
    operation_result = false;
    con.query(sql, function(err, result){
        if(err) {
            console.log(err);
            return;
        }
        if(!Array.isArray(result) || !result.length){
            db_bot.sendMessage(userID,channelID,'Your data does not exist! I recommend you to register by typing !daily')
        }
        else {
            credit = result[0].credit;
            return cb(credit, userID, channelID);
        }
    });
};

/**
 * Print out the credit value a user has
 * @param creditValue - the credit amount a user has
 * @param userID - the user id on discord
 * @param channelID - the channel to print message to
 */
function printCredits(creditValue,userID,channelID){
    db_bot.sendMessage(userID,channelID,"Your :moneybag: is: " + creditValue);
}



/**
 * Get the strike from the user and increment it by 1, if the user reaches 3 strike, then they are ban
 * from the server, else, their new data is updated
 * @param {string} userName - the user name on discord server
 * @param {int} userID - the user id on discord
 * @param {int} channelID - the channel id on discord
 */
function increaseStrike(userName,userID,channelID){
    sql = "select * from users where name = " + "\'" + userName + "\'";
    con.query(sql,function(err,result){
        if(err){
            console.log(err);
            return;
        }
        else{
            if(!Array.isArray(result) || !result.length){
                db_bot.sendMessage(userID,channelID,"Cannot find the user: " + userName + " in the database");
            }
            else{
                strike_amount = result[0].strike;
                strike_amount += 1;
                if(strike_amount == 5){
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
    sql = "select * from users where id = " + "\'" + userID + "\'";
    con.query(sql,function(err,result){
        if(err){
            console.log(err);
        }
        else{
            if(!Array.isArray(result) || !result.length){
                db_bot.sendMessage(userID,channelID,"Cannot find the requested user from database");
            }
            else{
                strike_amount = result[0].strike;
                strike_amount += 1;
                if(strike_amount == 5){
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
    sql = "delete from users where id =" + "\'" + userID + "\'";
    con.query(sql,function(err,result){
        if(err){
            console.log(err);
        }
        else{
            if(result.affectedRows < 1){
                db_bot.sendMessage(userID,channelID,"The data for this user does not exist");
            }
            else {
                db_bot.sendEmbed(userID,channelID,true,0);
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
    sql = "update users set strike =" + "\'" + newStrikeValue + "\'" + "where id=" + "\'" + userID + "\'";
    con.query(sql,function(err,result){
        if(err){
            console.log(err);
            db_bot.sendMessage(userID,channelID,"Failed to access the database. Check log for error");
        }
        // successful update
        else{
            db_bot.sendEmbed(userID,channelID,false,newStrikeValue);
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
    sql = "select * from users where name =" + "\'" + userName + "\'";
    con.query(sql,function(err,result){
        if(err){
            console.log(err);
            db_bot.sendMessage(userID,channelID,'Failed to access database! Check log for error');
        }
        else{
            if(!Array.isArray(result) || !result.length){
                db_bot.sendMessage(userID,channelID,'Your data does not exist! Please register with !daily');
            }
            else{
                strike = result[0].strike;
                db_bot.sendMessage(userID,channelID,"You current strike: " + strike);
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
    sql = "update users set strike =" + "\'" + newStrikeValue + "\'" + "where name=" + "\'" + userName + "\'";
    con.query(sql,function(err,result){
        if(err){
            console.log(err);
            db_bot.sendMessage(userID,channelID,'Failed to update new strike value in database. Refer to log');
        }
        // successful update
        else{
            sql = "select * from users where name =" + "\'" + userName + "\'";
            con.query(sql,function(err,result){
                if(err){
                    console.log(err);
                    db_bot.sendMessage(userID,channelID,'Failed to refetch value of user id. Refer to log for details');
                }
                else{
                    id = result[0].id;
                    db_bot.sendEmbed(id,channelID,false,newStrikeValue)
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
    commandList = "__*Type ! in front of all these commands*__\n" +
        "**daily** - get yourself 200 credits every day (time between must be 24 hours apart)\n" +
        "**banself** - remove all your records from the database\n" +
        "**remove userName** - remove the specified **userName** from the database (must have admin access)\n" +
        "**mark userName** - increase the specified **userName** strike count by 1 (must have admin access)\n" +
        "**mystrike** - see how many strikes you have\n" +
        "**credit** - see how many credits you have\n";
    return commandList;
}

/**
 * Add the desired amount into the specified user's credit (can be negative to subtract)
 * @param {string} amountAdd - the amount to add
 * @param {int} userID - the user id on discord
 * @param {int} channelID - the channel to send message to
 * @param {string} userName - the user name on discord server to add credit to
 */
function insertCreditAmount(amountAdd,userID,channelID,userName){
    sql = "select * from users where name =" + "\'" + userName + "\'";
    con.query(sql,function(err,result){
        if(err){
            console.log(err);
            db_bot.sendMessage(userID,channelID,"Failed to fetch the data from database. Refer to log for error");
        }
        else{
            if(!Array.isArray(result) || !result.length){
                db_bot.sendMessage(userID,channelID,"User data does not exist! Tell them to register using !daily");
            }
            else{
                currentCredit = result[0].credit;
                addedUserID = result[0].id;
                // if the adding amount contains a digit, don't convert
                if(amountAdd.match(/[a-z]/i)){
                    db_bot.sendMessage(userID,channelID,"You did not enter a valid number amount");
                    return;
                }
                amountAdd = parseInt(amountAdd);
                // if the amount adding is negative and it is greater than current own credit, then only subtract credit
                // until reaches 0
                if(amountAdd < 0 && Math.abs(amountAdd) > currentCredit){
                    amountAdd = currentCredit * -1;
                }
                // if the amount add is 0 after all checking, don't need to access database
                if(amountAdd == 0){
                    db_bot.sendMessage(userID,channelID,"The user you requested don't have enough credit");
                }
                else {
                    newCredit = currentCredit + amountAdd;
                    sql = "update users set credit=" + "\'" + newCredit + "\'" + "where name=" + "\'" + userName + "\'";
                    con.query(sql, function (err, result) {
                        if (err) {
                            console.log(err);
                            db_bot.sendMessage(userID, channelID, "Failed to update data. Refer to log for error");
                        }
                        else {
                            if (amountAdd < 0) {
                                db_bot.sendMessage(addedUserID, channelID, "You have lost: " + amountAdd * -1 + " :moneybag:");
                            }
                            else {
                                db_bot.sendMessage(addedUserID, channelID, "You have received: " + amountAdd + " :moneybag:");
                            }
                        }
                    });
                }
            }
        }
    });
}

/**
 * Add a number of credit to a user's account (can be negative). ONLY USE BY AUTOMATED SYSTEM
 * @param {int} userID - the user id to add credits to
 * @param {int} channelID - the channel id to send message to
 * @param {string} amount - the amount to increase the user's credit by
 */
function insertCreditBot(userID,channelID,amount){
    sql = "select * from users where id =" + "\'" + userID + "\'";
    con.query(sql,function(err,result){
        if(err){
            console.log(err);
            db_bot.sendMessage(userID,channelID,"Failed to fetch data. Check log for error!");
        }
        else{
            if(!Array.isArray(result) || !result.length){
                db_bot.sendMessage(userID,channelID,"User data does not exist. Register by typing !daily");
            }
            else{
                currentCredit = result[0].credit;
                amount = parseInt(amount);
                // negative credit
                if(amount < 0 && Math.abs(amount) > currentCredit){
                    amount = currentCredit * -1;
                }
                if(amount == 0){
                    db_bot.sendMessage(userID,channelID,"You do not have enough credit");
                }
                else {
                    newCredit = currentCredit + amount;
                    sql = "update users set credit=" + "\'" + newCredit + "\'" + "where id=" + "\'" + userID + "\'";
                    con.query(sql, function (err, result) {
                        if (err) {
                            console.log(err);
                            db_bot.sendMessage(userID,channelID,"Failed to update user data. Refer to log for error!");
                        }
                        else {
                            db_bot.sendMessage(userID, channelID, "You have received: " + amount + " :moneybag:");
                        }
                    });
                }
            }
        }
    });
}


// for exporting
module.exports = {
    getTimeFromDb: getTimeFromDb,
    time_result: time_result,
    updateDBLogin: updateDBLogin,
    insertNewDataToDB: insertNewDataToDB,
    removeUserFromDB: removeUserFromDB,
    getCreditFromDB:  getCreditFromDB,
    printCredits: printCredits,
    increaseStrike: increaseStrike,
    increaseStrikeBot: increaseStrikeBot,
    print_strike: print_strike,
    updateNewStrikeVal: updateNewStrikeVal,
    helpTable: helpTable,
    insertCreditAmount: insertCreditAmount,
    insertCreditBot: insertCreditBot
};



