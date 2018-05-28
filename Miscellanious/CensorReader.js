let fs = require('fs');
let es = require('event-stream');
let badWordsList = [];
let database = require('./database_functions.js');
let db_bot = require('./db_bot.js');


// set up list of bad words
let s = fs.createReadStream('./bad_words.txt')
    .pipe(es.split())
    .pipe(es.mapSync(function(line){

            // pause the readstream
            s.pause();

            badWordsList.push(line.trim());
            // process line here and call s.resume() when rdy

            // resume the readstream, possibly from a callback
            s.resume();
        })
            .on('error', function(err){
                console.log('Error while reading file.', err);
            })
            .on('end', function(){
                console.log('Read entire file.');
            })
    );

/**
 * Check whether or not a message contains a word in the list of bad words
 * and call the appropriate warning action to strike in database
 * @param {string} message the message to check for censor words
 * @param {int} userID the user that sent the message
 * @param {int} channelID the channel that the message sent was in
 * @param {int} messageID the message ID to check against
 */
function checkMessage(message,userID,channelID,messageID){
    let messageSplit = message.split(" ");
    for(i = 0; i < messageSplit.length; i++){
        // if bad words included, delete the message and send warn
        // admin doesn't get warn but get message delete still :)
        if(badWordsList.includes(messageSplit[i])){
            if(!db_bot.checkAdmin(userID)) {
                database.increaseStrikeBot(userID, channelID);
            }
            deleteMessage(messageID,channelID);
            break;
        }
    }
}

/**
 * Delete a message given a channel id and the message id
 * @param {int} messageID - the id of the message to delete
 * @param {int} channelID - the id of the channel to read message
 */
function deleteMessage(messageID,channelID){
    db_bot.bot.deleteMessage({channelID,messageID},function(err){
        if(err) {
            console.log("Error deleting message. Check Server IMMEDIATELY!");
        }
    });
}

/**
 * Kick a user from the server
 * @param {int} userID the user id to kick
 * @param {string} serverID the server id to kick the user from
 */
function kickUser(userID,serverID){
    db_bot.bot.kick({serverID,userID},function(err){
        if(err){
            console.log("Error trying to kick userID: " + db_bot.bot.users[userID].username + "#" + db_bot.bot.users[userID].discriminator
                + " Check server IMMEDIATELY!");
        }
    })
}

module.exports = {
    checkMessage: checkMessage,
    kickUser: kickUser
};
