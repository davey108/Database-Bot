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
 * @param message the message to check for censor words
 * @param userID the user that sent the message
 * @param channelID the channel that the message sent was in
 */
function checkMessage(message,userID,channelID){
    let messageSplit = message.split(" ");
    for(i = 0; i < messageSplit.length; i++){
        if(badWordsList.includes(messageSplit[i])){
            database.increaseStrikeBot(userID,channelID);
            break;
        }
    }
}

module.exports = {
    checkMessage: checkMessage
};
