let randomWords = require('random-words');
module.exports = {
    p2048: p2048,
    hangman : hangman,
    pSlots : pSlots
}

let database = require('./database_functions.js');
let bot = require('./db_bot.js');

//Structure containing all needed data structures for game implentations
//Key = game_type+UserID (string concat)
let games_data = {};

//Calls functions to update the DB
/**
 * Updates the database when a game is won
 * @param {int} userID - the user id to send message to
 * @param {int} channelID - the channel id to send message to
 * @param {int} amount - amount of credits to add
 */
function winGame(userID,channelID,amount){
    database.insertCreditBot(userID,channelID,amount);
    return "You win!";
}

//Calls functions to update the DB
/**
 * Updates the database when a game is won
 * @param {int} userID - the user id to send message to
 * @param {int} channelID - the channel id to send message to
 * @param {int} amount - amount of credits to add
 */
function loseGame(userID,channelID,amount){
    database.insertCreditBot(userID,channelID,amount);
    return;
}


//Const for 2048
//Transpose mapping for 4x4 Matrix
let pairs = {};
pairs[2] = 5;
pairs[3] = 9;
pairs[4] = 13;
pairs[7] = 10;
pairs[8] = 14;
pairs[12] = 15;

pairs[5]  = 2;
pairs[9]  = 3;
pairs[13] = 4;
pairs[10] = 7;
pairs[14] = 8;
pairs[15] = 12;

/**
 * Creates the data structure for a new 2048 game
 * @param {int} userID - the user id to send message to
 * @param {int} channelID - the channel id to send message to
 * @return Returns board representation
 */
function startNew2048(userID,channelID){
    loseGame(userID,channelID,-1); //lose game subtracts credits when game is created.
    let userdata = {};
    userdata["type"] = "2048";
    let board = {};
    board[Math.floor(Math.random()*(16-1+1))+1] = 2; //set starting tile
    userdata['board'] = board;
    games_data["2048"+userID] = userdata;
    return printBoard(board);
}

//Iterates the game: attempts next move if existing game, otherwise makes new game
/**
 * Advances a 2048 game
 * @param {int} userID - the user id to send message to
 * @param {int} channelID - the channel id to send message to
 * @param {String} args - 'up' 'down' 'left' or 'right'
 * @return Returns board representation or error message if invalid move
 */
function p2048(userID, args,channelID){
    let r = "";
    if(games_data["2048"+userID] == undefined){
        r = startNew2048(userID,channelID);
    }else{
        r = update2048(userID, args,channelID);
    }
    return "2048 game for " + "<@!" + userID + ">\n"  + "\n" + r;
}

//Updates board based on direction choosen by user
//Valid args for dir: 'up' 'down' 'left' or 'right'
//Invalid arguments returns message and unaltered board
//Returns a string (updates game_data)
/**
 * Returns updated 2048 game structure
 * @param {int} userID - the user id to send message to
 * @param {int} channelID - the channel id to send message to
 * @param {String} dir - 'up' 'down' 'left' or 'right'
 * @return Returns the new game data (map) for the 2048 game
 */
function update2048(userID, dir, channelID){

    let userdata = games_data["2048"+userID];
    let board = userdata['board'];

    let valid = false;
    if((dir == 'up' | dir == 'down' | dir == 'right' | dir == 'left')){
        valid = true;
    }

    if(!valid){ //Invalid args
        return "Invalid Direction. Options: up, down, right, or left.\n\n" + printBoard(board);
    }

    let newBoard = collapse(dir, board);
    for(i=0;i<3;i++)
        newBoard = collapse(dir, newBoard);

    //Get game status, true -> win, false -> loss, map -> valid game
    let check = checkBoard(newBoard);

    //Check if win condition
    if(check == true){
        winGame(userID,channelID,20);
        games_data["2048"+userID] = undefined; //remove board data
        return "You won 2048.\n";
    }

    //check if loss condition
    if(check == false){
        games_data["2048"+userID] = undefined;
        return "You lost 2048.\n";
    }

    if(true || board != newBoard){

        //Add new tile to random empty space (2 or 4)
        let index = check[Math.floor(Math.random()*(check.length+1))];
        if(Math.floor(Math.random()*(11)) > 5){
            newBoard[index] = 2;
        }else{
            newBoard[index] = 4;
        }
        userdata['board'] = newBoard;
        games_data["2048"+userID] = userdata;
    }

    return printBoard(newBoard);

}

//Used for formmating of board
/**
 * Returns number of spaces needed for board formatting
 * @param {int} k - largest number of board
 * @return ceil(log(k))
 */
function intLength(k){
    if(k<10)
        return 1;
    if(k<100)
        return 2;
    if(k<1000)
        return 3;
    if(k<10000)
        return 4;
}

//Returns string representation of board
/**
 * String representation of 2048 board
 * @param {map} board - 2048 board
 * @return {String} Returns board representation
 */
function printBoard(board){
    let i;
    let max = 0;
    for(i=1;i<=16;i++){
        if(board[i] > max){
            max = board[i];
        }
    }
    let m = intLength(max);
    let r = "```";
    r = "";
    for(i=1;i<=16;i++){
        if(board[i] == undefined){
            r += "x"+" ".repeat(m);
        }else{
            r += board[i];
            r += " ".repeat(m-intLength(board[i])) + " ";
        }

        if(i%4 == 0){
            r+="\n";
        }
    }
    return r;
}

//Transpose of 4x4 matrix (map)
//Returns a new map
/**
 * Transpose of 4x4 in map representation
 * @param {map} - map of board representation
 * @return Returns new map of transpose of board matrix
 */
function transpose(board){
    //A -> A'
    //[[1 2 3 4] [5 6 7 8] [9 10 11 12] [13 14 15 16]] -> [[1 5 9 13] [2 6 10 14] [3 7 11 15] [4 8 12 16]]
    let newBoard = {};
    let i,j;
    for(i=1;i<=16;i++){
        j = getTrans(i);

        if(i==j){
            newBoard[i] = board[j];
            continue;
        }

        newBoard[i] = board[j];
        newBoard[j] = board[i];
    }
    return newBoard	;
}

//Shift board right, left, up, or down
//Returns board
/**
 * Helper method for shifting 2048 board
 * @param {String} dir - direction
 * @param {map} board - map representation of 2048 board
 * @return Returns new board map
 */
function collapse(dir, board){

    //dir : up, down, left, right
    //down(A) = right(A')
    //up(A)   = left(A')
    let i;
    if(dir == 'down'){
        //down(A) = right(A')'
        return transpose(collapse('right',transpose(board)));
    }

    if(dir == 'up'){
        //up(A) = left(A')'
        return transpose(collapse('left',transpose(board)));
    }

    //Move right
    if(dir == 'right'){
        for(i=1;i<=16;i++){
            if(i%4 == 0)
                continue;

            //move into empty space
            if(board[i+1] == undefined){

                j = getTrans(i);
                board[i+1] = board[i];
                board[i] = undefined;
            }

            //double value if equal tile
            if(board[i+1] == board[i]){
                board[i+1] = 2*board[i];
                board[i] = undefined;
            }

        }
    }

    if(dir == 'left'){
        for(i=16;i>=1;i--){
            if(i%4 == 1)
                continue;

            //move into empty space
            if(board[i-1] == undefined){
                board[i-1] = board[i];
                board[i] = undefined;
            }

            //double value if equal tile
            if(board[i-1] == board[i]){
                board[i-1] = 2*board[i];
                board[i] = undefined;
            }
        }
    }

    for(i=1;i<=16;i++){
        if(isNaN(parseInt(board[i])))
            board[i] = undefined;
    }

    return board;
}

//Return true if any space contains 2048 (win condition)
//Return false if no space contains 2048 and the board is full
//Otherwise, return list of empty spaces
/**
 * Helper method for 2048
 * @param {map} board - map representation of 2048 board
 * @return Returns new board or boolean
 */
function checkBoard(board){
    let empty = [];
    let i;
    for(i=1;i<=16;i++){
        if(board[i] == 2048){
            return true;
        }else{
            if(board[i] == undefined){
                empty.push(i);
            }
        }
    }
    if(empty.length == 0){
        //need to check if any final moves possible when full board
        let left = collapse('left',board);
        if(left != board)
            return empty; //can still move left

        let right = collapse('right',board);
        if(right != board)
            return empty;

        let up = collapse('up',board);
        if(up != board)
            return empty;

        let down = collapse('down',board);
        if(down != board)
            return empty;
        return false;
    }
    return empty;
}

//Given index (1-16), return the transpose index (4x4)
function getTrans(i){
    let r = pairs[i];
    if(r == undefined){
        return i;
    }
    return r
}

//Creates new data for game in game_data
/**
 * Creates new datastructure (map) for hangman game
 * @param {int} userID - the user id to send message to
 * @return Returns hangman map
 */
function startNewHangman(userID,channelID){
    loseGame(userID,channelID,-1); //subtract credits when game is created

    let word = randomWords();
    let userdata = {};
    userdata["type"] = "hangman"; //game type
    userdata["strikes"] = 0;
    userdata["word"] = word;
    userdata["letters_used"] = [];
    userdata["guesses"] = 0;
    userdata["board"] = "#".repeat(word.length);
    userdata["status"] = "valid";

    games_data[userID] = userdata;

    return "Current board:\t" + userdata['board'] + "\t(" + userdata['strikes'] + " stikes used)\n";

}

//iterates a hangman game, returns string of representation of board or error
/**
 * Helper function for hangman
 * @param {int} userID - the user id to send message to
 * @param {int} channelID - channel id to send message to
 * @param {String} letter - letter
 @return Returns string of game or error message
 */
function checkLetter(userID, letter, channelID){
    let i;
    letter = letter.toString().toLowerCase().trim(); //fix bad inputs

    if(letter.length != 1){
        return  "You did not entery a valid guess. Please guess a single letter.\n" +
            "Current board : " + games_data[userID]['board'] + "\t(" + games_data[userID]['strikes'] + " strikes used)\n";
    }

    let userdata = games_data[userID];

    let validGuess = true;
    for(i=0;i<userdata['letters_used'].length;i++){
        if(userdata['letters_used'][i] == letter){
            validGuess = false;
            break;
        }
    }

    if(!validGuess){
        return  "You have already guessed the letter " + letter + ".\n" +
            "Current board : " + games_data[userID]['board'] + "\t(" + games_data[userID]['strikes'] + " strikes used)\n";
    }


    userdata['letters_used'][userdata['guesses']] = letter; //update guesses
    userdata['guesses'] += 1; //update count

    //If letter not in word, add a stike
    if(userdata['word'].indexOf(letter) == -1){
        userdata['strikes'] += 1;
    }

    //Game Over
    if(userdata['strikes'] > 5){
        games_data[userID] = undefined; //remove game
        return "You have used up all of your guesses.\nThe correct word was '" + userdata['word'] + "'.\n";
    }

    //Incorrect guess
    if(userdata['word'].indexOf(letter) == -1){
        return "The letter " + letter + " is not in the current word.\nA guess has been used.\n" +
            "Letters used so far: " + userdata["letters_used"] +
            "\nCurrent board : " + userdata['board'] + "\t(" + userdata['strikes'] + " strikes used)\n";
    }
    else{
        //Correct guess
        let w = userdata['word'];
        let newBoard = "";
        for(i=0;i<w.length;i++){
            if(w[i] == letter){
                newBoard += letter;
            }
            else{
                newBoard += userdata['board'][i];
            }
        }
        userdata['board'] = newBoard;
        let returnMessage = "Current board : " + userdata['board'] + "\t(" + userdata['strikes'] +  " strikes used)\n";

        //Game won
        if(newBoard.valueOf() == w.valueOf()){
            winGame(userID,channelID,5);
            returnMessage = "You have correctly guessed the word using only " + userdata['guesses'] + " guesses.\n";
            userdata = undefined; //use userdata to null
            games_data[userID] = undefined;
        }

        return returnMessage;

    }
}

//High level function called to progress game
//Will progress game if one exist, otherwise will create new one
/**
 * High level hangman function for main switch statement
 * @param {int} userID - the user id to send message to
 * @param {String} letter - user's guess
 * @param {String} user - username that corresponds to userID
 * @param {int} channelID - channel ID to send message to
 @return Returns string of current hangman instance
 */
function hangman(userID,letter,user,channelID){
    let r;
    if(games_data[userID] == undefined){
        r = startNewHangman(userID,channelID);
    }
    else{
        r = checkLetter(userID,letter,channelID);
    }
    return "Hangman game for " + "<@!" + userID + ">\n"  + "\n" + r;
}

//Creates random 3x3 matrix with vals 1-6
//Returns array of 3x3 map and boolean for if instance is a win
/**
 * Helper function for slot game
 */
function slots(){
    let min = 1;
    let max = 6;
    let board = {};
    for(i=0;i<9;i++){
        r = Math.floor(Math.random()*(max-min+1))+min;
        board[i] = r;
    }

    let win = false;
    if(board[0] == board[1] && board[1] == board[2]){
        win = true;
    }if(board[3] == board[4] && board[4] == board[5]){
        win = true;
    }if(board[6] == board[7] && board[7] == board[8]){
        win = true;
    }
    return [board, win];
}

//Returns string representation of slot board
/**
 * Helper function for slot game
 * @return Returns string represntation of slot instance
 */
function printSlot(vals){
    let r = "";
    let k;
    for(k=0;k<9;k++){
        if(k%3 == 0){
            r+="\n\n";
        }r+=emoj(vals[k])+' ';
    }
    return r;
}

//Translates number into emoji
/**
 * Helper function for slot game
 * @return emoji representation of int
 */
function emoj(n){
    switch(n){
        case 1: return ":cherries:";
        case 2: return ":watermelon:";
        case 3: return ":peach:";
        case 4: return ":grapes:";
        case 5: return ":chocolate_bar:";
        case 6: return ":green_apple:";
    }
}


//Bot calls iteself with args of UserID
//Returns print message to UI and repetedly edits it
//Returns void
/**
 * High level slot game function called by the main switch statement
 * @param {int} userID - the user id to send message to
 * @param {int} channel - the channel id to send message to
 * @param {int} mid - message id to edit when 'spinning' the slot
 */
function pSlots(userID,channelID,mid){
    loseGame(userID,channelID,-1);
    setTimeout(bot.editMessage, 500);
    let s = slots();
    let i,m;
    for(i=0;i<10;i++){ //spin
        s = slots();
        m = "Slots for " + "<@!" + userID + ">\n"  +  printSlot(s[0]) + "\n";
        bot.editMessage(channelID,mid,m);
    }
    let final = slots();
    m = "Slots for " + "<@!" + userID + ">\n"  +  printSlot(final[0]) + "\n";
    setTimeout(bot.editMessage, 3000); //will wait up to 3 seconds
    bot.editMessage(channelID,mid,m);

    if(final[1] == true){
        winGame(userID,channelID,10);
    }
}

