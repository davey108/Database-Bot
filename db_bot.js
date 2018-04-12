const Discord = require('discord.io');
const adminRoleID = '426481518274150420';
const serverID = '366786162238554112';
var auth = require('./auth.json');
// for exporting, must export before require the other file
module.exports = {
    sendMessage: sendMessage
};
var database = require('./database_functions.js');
// Initialize Discord Bot
var bot = new Discord.Client({
   token: auth.token,
   autorun: true
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
	if(channelID == 408777732579917824){
		// Our bot needs to know if it will execute a command
		// It will listen for messages that will start with `!`
		if (message.substring(0, 1) == '!') {
			let args = message.substring(1).split(' ');
			let cmd = args[0];
			args = args.splice(1);
			switch(cmd) {
				case 'daily':
				    database.getTimeFromDb(user,channelID,userID,database.time_result);
				break;
                case 'banself':
                    database.removeUserFromDB(user,userID,channelID);
                break;
                // admin priviledged command
                case 'remove':
                    if(checkAdminPriviledge(userID)){
                        // args[0] now is the next argument since we splice it by space
                        database.removeUserFromDB(args[0],userID,channelID);
                    }
                    else{
                        sendMessage(userID,channelID,"You do not have admin access to this command");
                    }
                break;
                case 'mark':
                    if(checkAdminPriviledge(userID)){
                        database.increaseStrike(args[0],userID,channelID);
                    }
                    else{
                        sendMessage(userID,channelID,"You do not have admin access to this command");
                    }
                break;
                case 'gcredit':
                    if(checkAdminPriviledge(userID)){
                        database.insertCreditAmount(args[1],userID,channelID,args[0]);
                    }
                    else{
                        sendMessage(userID,channelID,"You do not have admin access to this command");
                    }
                break;
                case 'mystrike':
                    database.print_strike(user,userID,channelID);
                break;
                case 'credit':
                    database.getCreditFromDB(database.printCredits,user,userID,channelID);
                break;
                case 't':
                    sendMessage(userID,channelID,"<:whatthe:433375157185413134>");
                break;
                case 'help':
                    bot.sendMessage({
                       to: channelID,
                       message: database.helpTable(),
                    });
                break;
                default:
                    sendMessage(userID,channelID,"No command matching! Type !help for list of commands");
				// Just add any case commands if you want to..
			 }
		 }
	}
});

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


/**
 * Check if the user has an admin priviledge
 * @param {int} userID - the userID to check priviledge
 * @return boolean - true if the user has admin priviledge, false otherwise
 */
function checkAdminPriviledge(userID){
    let isAdmin = bot.servers[serverID].members[userID.toString()].roles.includes(adminRoleID);
    return isAdmin;
}




