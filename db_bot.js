const Discord = require('discord.io');
const adminRoleID = '426481518274150420';
const serverID = '366786162238554112';
let auth = require('./auth.json');
// initialize discord bot
let bot = new Discord.Client({
    token: auth.token,
    autorun: true
});
// for exporting, must export before require the other file
module.exports = {
    sendMessage: sendMessage,
    sendEmbed: sendEmbed,
    bot: bot, // will we need to pass bot object directly???
    serverID: serverID,
    checkAdmin: checkAdminPriviledge,
    editMessage: editMessage,
    sendNotice: sendNoticeWordEmbed,
    deleteMessage: deleteMessage,
    sendWarnEmbed: sendWarnEmbed
};
let database = require('./database_functions.js');
let censor = require('./CensorShip.js');
let game = require('./game.js');

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
            // game.js blocks starts here--------------------------------------------
            case "pt":
                let tGame = game.evalInstanceT(userID, channelID);
                sendMessage(userID,channelID,"'s TicTacToe Board:\n\n   " + "`"+ game.printBoardT(tGame, userID)+"`");
            break;
            case "pc":
                let cGame = game.evalInstanceC(userID, channelID);
                sendMessage(userID,channelID,"'s Connect-4 Board:\n\n " + "`"+game.printBoardC(cGame, userID)+"`");
            break;
            case "pb":
                let bGame = game.evalInstanceB(userID, channelID);
                sendMessage(userID,channelID,"'s Blokus Board:\n\n   " + "`"+game.printBoardB(bGame, userID)+"`");
            break;
            case 't':
                bot.sendMessage({
                    to: channelID,
                    message: game.playTicTacToe(parseInt(args[0]), parseInt(args[1]), userID),
                });
            break;
            case "c":
                bot.sendMessage({
                    to: channelID,
                    message: game.playConnect4(parseInt(args[0]), userID),
                });
            break;
            case "b":
                bot.sendMessage({
                    to: channelID,
                    message: game.playBlokus(parseInt(args[0]), parseInt(args[1]), parseInt(args[2]), userID),
                });
            break;
            // game.js blocks ends here------------------------------------
            // gameTwo.js blocks starts here -------------------------------------------------
            case 'hangman':
                bot.sendMessage({
                    to: channelID,
                    message: game.hangman(userID,args,channelID),
                });
            break;
            case '2048':
                bot.sendMessage({
                    to: channelID,
                    message: game.p2048(userID,args,channelID),
                });
            break;
            case 'slots':
                setTimeout(game.pSlots,3000);
                let mid = evt.d.id;
                if(userID != bot.id) {
                    bot.sendMessage({
                        to: channelID,
                        message: "!slots " + userID,
                    });
                }
                else
                    game.pSlots(args[0],channelID,mid);
            break;
            // gameTwo.js blocks end here------------------------------------------------------
            // censorship.js begins here---------------------------------------------------
            case 'ban':
                if(checkAdminPriviledge(userID)){
                    censor.banWord(channelID,args);
                }
                else{
                    sendMessage(userID,channelID,"You do not have admin access to this command");
                }
            break;
            case 'unban':
                if(checkAdminPriviledge(userID)){
                    censor.unBanWord(channelID,args);
                }
                else{
                    sendMessage(userID,channelID,"You do not have admin access to this command");
                }
            break;
            case 'help':
                bot.sendMessage({
                   to: channelID,
                   embed:{
                       color: 0x40ff00,
                       fields: [{
                           name: "<:whatthe:433375157185413134>__***Help Table***__",
                           // would make more sense if help table is inside bot...
                           value: database.helpTable()
                       }]
                   }
                });
            break;
            default:
                censor.censorCheck(message.substring(1),userID,channelID,evt.d.id);
                sendMessage(userID,channelID,"No command matching! Type !help for list of commands");
         }
     }
     else {
        // check so that the bot doesn't listen to itself
        if(bot.id != userID) {
            censor.censorCheck(message,userID,channelID,evt.d.id);
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
 * Send embed message to indicate the user ban or warn
 * @param userID - the userID to send warn/ban message to
 * @param channelID - the channel to send message to
 * @param isBan - true if the message is for ban, false if the message is for warn
 * @param amount - current strike for the user
 */
function sendEmbed(userID,channelID,isBan,amount){
    if(isBan) {
        kickUser(userID,serverID);
        bot.sendMessage({
            to: channelID,
            embed: {
                color: 0xFF0000,
                fields: [{
                    name: ":no_entry: User Banned",
                    value: "**Name**: " +  bot.users[userID].username + "#" + bot.users[userID].discriminator
                    + "\n\n**ID**: " + userID,
                }]
            }
        });
    }
    else{
        sendMessage(userID,channelID,"You have been warned!");
        bot.sendMessage({
            to: userID,
            embed: {
                color: 0xFFFF00,
                fields: [{
                    name: ":warning: User Warned",
                    value: "**Name**: " + bot.users[userID].username + "#" + bot.users[userID].discriminator
                    + "\n\n**ID**: " + userID + "\n\n**Strike**: " + amount,
                }]
            }
        });
    }
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


//Updates the UI given the channelID, messageID, and content
/**
 * Function to edit an existing message (Used for slots game)
 * @param {int} channelID - channelID id to send message to
 * @param {int} messageID - messageID, id of message to update
 * @param {String} message - new message to set
 */
function editMessage(channelID, messageID, message){
    bot.editMessage({
        channelID: channelID,
        messageID: messageID,
        message: message,
    });
}


/**
 * Send a notice to the channel of a ban word has been added to the list
 * @param {int}channelID - the channel id to send message to
 * @param {string} word - the word that was added to the list
 * @param {boolean} isIn - indicate if this word is already in ban list or not
 * @param {boolean} forBan - indicate if this send embed is for banning or unbanning word
 */
function sendNoticeWordEmbed(channelID,word,isIn,forBan) {
    if(forBan) {
        if (!isIn) {
            bot.sendMessage({
                to: channelID,
                embed: {
                    color: 0xe74C3C,
                    fields: [{
                        name: ":x: WORD BANNED :x:",
                        value: "the phrase \"**" + word+ "**\" has been banned\n"
                    }]
                }
            });
        }
        else {
            bot.sendMessage({
                to: channelID,
                embed: {
                    color: 0xe74C3C,
                    fields: [{
                        name: ":x: WORD ALREADY BANNED :x:",
                        value: "the phrase \"**" + word+ "**\" has already been banned\n"
                    }]
                }
            });
        }
    }
    else{
        if(!isIn) {
            bot.sendMessage({
                to: channelID,
                embed: {
                    color: 0x2ECC71,
                    fields: [{
                        name: ":white_check_mark: WORD ALREADY ALLOWED :white_check_mark:",
                        value: "the phrase \"**" + word + "**\" was not banned!\n"
                    }]
                }
            });
        }
        else{
            bot.sendMessage({
                to: channelID,
                embed: {
                    color: 0x2ECC71,
                    fields: [{
                        name: ":white_check_mark: WORD UNBANNED :white_check_mark:",
                        value: "the phrase \"**" + word + "**\" has been unbanned!\n"
                    }]
                }
            });
        }
    }
}

/**
 * Delete a message from a channel
 * @param channelID - the channel id to delete message from
 * @param messageID - the id of the message to be deleted
 */
function deleteMessage(channelID,messageID){
    bot.deleteMessage({
        channelID: channelID,
        messageID: messageID,
    }, function(err){
        if(err) {
            console.log("Cannot delete message with messageID: " + messageID+ " with channelID: " + channelID +
            ". Check DISCORD IMMEDIATELY!");
        }
    });
}

/**
 * Send an embed warning to the user
 * @param {string} userID - the user id to send embed to
 * @param {int} color - the color in hex of the embed
 * @param {string} name - the name of the field
 * @param {string} text - the text of the field
 */
function sendWarnEmbed(userID,color,name,text){
    bot.sendMessage({
        to: userID,
        embed: {
            color: color,
            fields: [{
                name: name,
                value: text,
            }]
        }
    });
}

/**
 * Kick a user from the server
 * @param {int} userID the user id to kick
 * @param {string} serverID the server id to kick the user from
 */
function kickUser(userID,serverID){
    bot.kick({
        serverID: serverID,
        userID: userID,
    },function(err){
        if(err){
            console.log("Error trying to kick userID: " + bot.users[userID].username + "#" + bot.users[userID].discriminator
                + " Check server IMMEDIATELY!");
        }
    });
}