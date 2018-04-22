let fs = require('fs');
let es = require('event-stream');
module.exports = {
    censorCheck: censorBot,
    banWord: banWord,
    unBanWord: unBanWord
}
let bot = require('./db_bot.js');
let path = "./bad_words.txt";
let database = require('./database_functions.js');
let badWordsList = [];
// From: https://stackoverflow.com/questions/16010915/parsing-huge-logfiles-in-node-js-read-in-line-by-line
// Parse the bad_words.txt to store words into the array
let s = fs.createReadStream('./bad_words.txt')
    .pipe(es.split())
    .pipe(es.mapSync(function(line){

            // pause the readstream
            s.pause();

            badWordsList.push(line.trim());
            if(line == '\n')
                console.log("ok");
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
 * Use when one of the ban/unban word command is issued. Format the
 * string to the way that badwordslist is stored (lower case)
 * @param {string} args - the string that contains list of words to ban
 * @return {string} the formatted string
 */
function formatMessage(args){
    var i = 1;
    var word = args[0];
    while(i < args.length){
        word += " " + args[i].toLowerCase().replace(/[.,\/#!$+<>%\^&\*;:{}=\-_`~()]/g,"");
        i++;
    }
    return word;
}
//adds message to bannedWords array if not already present
//reports to channel that the message has been banned or is already banned
/**
 * Adds message to badWordList if not already present
 * Reports to channel that the message has been banned or is already banned
 * @param channelID
 * @param args
 */
function banWord(channelID, args){
    let word = formatMessage(args);
    if(!badWordsList.includes(word)){
        bot.sendNotice(channelID,word,false,true);
        badWordsList.push(word);
        writeToFile(path);
    }
    else{
        bot.sendNotice(channelID,word,true,true);
    }
}

/**
 * Unban a word from the bad words list and send message to the channel
 * to notify users that a word has been unbanned
 * @param channelID - the channel id to send message to
 * @param args - the word to be unban
 */
function unBanWord(channelID, args){
    let word = formatMessage(args);
    //when message is currently unbanned
    if(!badWordsList.includes(word)){
        bot.sendNotice(channelID,word,false,false);
    }
    // when message is currently banned
    // Source: https://stackoverflow.com/questions/5767325/how-do-i-remove-a-particular-element-from-an-array-in-javascript
    // remove the bad word from the bad word list array
    else{
        bot.sendNotice(channelID,word,true,false);
        let indexToRemove = badWordsList.indexOf(word);
        if(indexToRemove > -1 ){
            badWordsList.splice(indexToRemove,1);
        }
        writeToFile(path);
    }
}

//checks if message is in need of censorship
//returns index of word in bannedWords if present
//returns -1 otherwise
/**
 * Checks if a message is in need of censorship
 * Returns index of word in badWordsList if present, -1 otherwise
 * @param {string} message the message to check
 * @return {number} the index of a word in the censor list, -1 otherwise
 */
function needsCensor(message){
    let msg = message.toLowerCase().replace(/[.,\/#!$+<>%\^&\*;:{}=\-_`~()?]/g,"");
    let msgSplit = msg.split(" ");
    let i;
    for(i = 0; i < msgSplit.length; i++){
        if(badWordsList.includes(msgSplit[i])){
            return i;
        }
    }
    return -1;
}

/**
 * Check if a message contains a censor word and send the appropriate
 * sensor to the user
 * @param message
 * @param userID
 * @param channelID
 * @param messageID
 */
function censorBot(message, userID, channelID, messageID){
    let censorIndex = needsCensor(message);
    // if there is a message to censor
    if(censorIndex > -1){
        bot.deleteMessage(channelID,messageID);
        // if bad words included, delete the message and send warn
        // admin doesn't get warn but get message delete still :)
        if (!bot.checkAdmin(userID)) {
                database.increaseStrikeBot(userID, channelID);
                warn(userID, censorIndex);
        }
    }
}

/**
 * Send warning to the user
 * @param {string} userID - the user id to send warning to
 * @param {int} censorIndex - the index of the censored word
 */
function warn(userID,censorIndex){
    let rand = Math.floor(Math.random() * 5);
    switch(rand){
        case 0:
            bot.sendWarnEmbed(userID, 0xF4D03F, ":warning: THIS IS A WARNING :warning:",
                "Please don't say bad words :upside_down:\nBanned phrase: " + bannedWords[censorIndex],
            );
        break;
        case 1:
            bot.sendWarnEmbed(userID,0X00ff00,":warning: THIS IS A WARNING :warning:",
                "No naughty wordies :speak_no_evil:\nBanned phrase: " + badWordsList[censorIndex]);
        break;
        case 2:
            bot.sendWarnEmbed(userID,0xffcc99,":warning: THIS IS A WARNING :warning:",
                "No one likes a potty mouth :thumbsdown:\nBanned phrase: " + bannedWords[censorIndex]);
        break;
        case 3:
            bot.sendWarnEmbed(userID,0x6699ff,":warning: THIS IS A WARNING :warning:",
                "My heart breaks everytime you swear :broken_heart:\nBanned phrase: " + bannedWords[censorIndex]);
        break;
        case 4:
            bot.sendWarnEmbed(userID,0x33cccc,":warning: THIS IS A WARNING :warning:",
                "Only losers say things like that :sunglasses:\nBanned phrase: " + bannedWords[censorIndex]);
        break;
    }
}

/**
 * Write the array to the file bad_words.txt
 * @param path - the path of the file
 */
function writeToFile(path){
    let logstream = fs.createWriteStream(path,{'flags': 'w'});
    let i;
    for(i = 0; i < badWordsList.length; i++){
        logstream.write(badWordsList[i] + '\n');
    }
    console.log("Wrote entire file");
}