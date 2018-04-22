const Discord = require('discord.io');
let auth = require('./auth.json');
let fs = require('fs');
let database = require('./database_functions.js');
let db_bot = require('./db_bot.js');

//Structure containing all needed data structures for game implentations
//Key = game_type+UserID (string concat) 
let games_data = {};
let tGames = [];
let cGames = [];
let bGames = [];

let boardSide = 3;
let bBoardSide = 10;


//Calls functions to update the DB
/**
 * Updates the database when a game is won
 * @param {int} userID - the user id to send message to
 * @param {int} channelID - the channel id to send message to
 * @param {int} amount - amount of credits to add
 */
function winGame(userID,channelID,amount){
	database.insertCreditBot(userID,channelID,amount);
	console.log(userID+"\tWIN GAME CALLED");
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
	console.log(userID+"\tLOSE GAME CALLED");
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

//Creates new 2048 Board
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
	for(let i=0;i<3;i++)
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
	let max = 0;
	for(let i=1;i<=16;i++){
		if(board[i] > max){
			max = board[i];
		}
	}let m = intLength(max);
		
	let r = "```";
	r = "";
	for(let i=1;i<=16;i++){
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
	for(let i=1;i<=16;i++){
		let j = getTrans(i);
		
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
		let j = 0;
		for(let i=1;i<=16;i++){
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
		for(let i=16;i>=1;i--){
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
	
	for(let i=1;i<=16;i++){
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
	let empty = []
	for(let i=1;i<=16;i++){
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
		let left = collapse('left',board)
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
	}return empty;
}

//Given index (1-16), return the transpose index (4x4)
function getTrans(i){
	let r = pairs[i];
	if(r == undefined){
		return i;
	}return r
}

//Creates new data for game in game_data
/**
 * Creates new datastructure (map) for hangman game
 * @param {int} userID - the user id to send message to
 * @return Returns hangman map
 */
function startNewHangman(userID,channelID){
	let words = fs.readFileSync("./words.txt", 'utf8').split('\n');
	
	loseGame(userID,channelID,-1); //subtract credits when game is created
	
	let word = words[Math.floor(Math.random()*Math.floor(words.length)) - 1];
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
	
	let letter = letter.toString().toLowerCase().trim(); //fix bad inputs
		
	if(letter.length != 1){
		return  "You did not entery a valid guess. Please guess a single letter.\n" +
				"Current board : " + games_data[userID]['board'] + "\t(" + games_data[userID]['strikes'] + " strikes used)\n";
	}
	
	let userdata = games_data[userID];
		
	let validGuess = true;
	for(let i=0;i<userdata['letters_used'].length;i++){
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
	}else{
		//Correct guess
		let w = userdata['word'];
		let newBoard = "";
		for(let i=0;i<w.length;i++){
			if(w[i] == letter){
				newBoard += letter;
			}else{
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
	let r = "";
	if(games_data[userID] == undefined){
		r = startNewHangman(userID,channelID);
	}else{
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
	let min = 1; let max = 6;
	let board = {};
	for(let i=0;i<9;i++){
		let r = Math.floor(Math.random()*(max-min+1))+min;
		board[i] = r;
	}
	
	let win = false;
	if(board[0] == board[1] && board[1] == board[2]){
		win = true;
	}if(board[3] == board[4] && board[4] == board[5]){
		win = true;
	}if(board[6] == board[7] && board[7] == board[8]){
		win = true;
	}return [board, win];
}

//Returns string representation of slot board
/**
 * Helper function for slot game
 * @return Returns string represntation of slot instance
 */
function printSlot(vals){
	let r = "";
	for(let k=0;k<9;k++){
		if(k%3 == 0){
			r+="\n\n";
		}r+=emoj(vals[k])+' ';
	}return r;
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

//Updates the UI given the channelID, messageID, and content
/**
 * Function to edit an existing message (Used for slots game)
 * @param {int} c - channelID id to send message to
 * @param {int} mid - messageID, id of message to update
 * @param {String} mess - new message to set
 */
function editMessage(c, mid, mess){
	//wrapper for edit function in discord.io api
	db_bot.bot.editMessage({channelID: c, messageID: mid, message: mess})	
}

function checkSlotWin(final,userID,channelID){
	if(final[1] == true){
		winGame(userID,channelID,10);
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
	let s = slots();
	let m = ""
	for(let i=0;i<10;i++){ //spin
		let s = slots();
		m = "Slots for " + "<@!" + userID + ">\n"  +  printSlot(s[0]) + "\n";
		editMessage(channelID,mid,m);
	}
					
	let final = slots();
	m = "Slots for " + "<@!" + userID + ">\n"  +  printSlot(final[0]) + "\n";
	
	editMessage(channelID,mid,m)
	checkSlotWin(final,userID,channelID);
}

// Phong's code begin

//-------------------------------------------------------------------------------------------------------------
/**
 * removes a game instance once a player finishes a game
 * @param {object} game - a game instance
 */
function removeInstance(game){
	let i;
	if(game.type == "tictactoe"){
		for(i = 0; i < tGames.length; i++){
			if(tGames[i].id == game.id){
				tGames.splice(i, 1);
				return;
			}
		}
	}
	else if(game.type == "connect4"){
		for(i = 0; i < cGames.length; i++){
			if(cGames[i].id == game.id){
				cGames.splice(i, 1);
				return;
			}
		}
	}
	else if(game.type == "blokus"){
		for(i = 0; i < bGames.length; i++){
			if(bGames[i].id == game.id){
				bGames.splice(i, 1);
				return;
			}
		}
	}
	else{
		console.log("Error should not be printing. Not an instance of any games");
	}
}

/**
 * Used to check if an input can be an int
 * https://stackoverflow.com/questions/14636536/how-to-check-if-a-variable-is-an-integer-in-javascript
 * @param {int} value - the input being checked
 */
function isInt(value){
  return !isNaN(value) && 
         parseInt(Number(value)) == value && 
         !isNaN(parseInt(value, 10));
}

/**
 * Used for cloning an array
 * https://blog.andrewray.me/how-to-clone-a-nested-array-in-javascript/
 * @param {array} arr - the array being cloned
 */
function arrayClone(arr){
    let i = undefined;
    let copy = undefined;
    if( Array.isArray( arr ) ) {
        copy = arr.slice( 0 );
        for( i = 0; i < copy.length; i++ ) {
            copy[ i ] = arrayClone( copy[ i ] );
        }
        return copy;
    } else if( typeof arr === 'object' ) {
        throw 'Cannot clone array containing an object!';
    } else {
        return arr;
    }
}

/**
 * Prints a menu that displays all commands
 */
function printCommandTable(){
	command = "`$help				    -print out all commands\n" +
				  "$t <row> <col>		    -mark x at row/column on tictactoe board\n" +
				  "$c <col>				    -drop x on column on the connect4 board\n" +
				  "$b <block> <row> <col>   -place a block's pin to row/column\n" +
				  "$pt    -print the tictactoe board\n" +
				  "$pc    -print the connect 4 board\n" +
				  "$pb    -print the blokus board\n`"
	return command;
}
//-------------------------------------------------------------------------------------------------------------
/**
 * Main function to launch Tic Tac Toe
 * @param {int} row - the row to mark at
 * @param {int} col - the col to mark at
 * @param {int} userID - the userID to pass modify credits to
 * @param {int} channelID - the channelID to modify credits to
 */
function playTicTacToe(row, col, userID, channelID){
	if (!isInt(row) || !isInt(col)){
		return "`Invalid Argument(s). Try again.`";
	}

	let tGame = evalInstanceT(userID, channelID);
	if(row < 0 || row > boardSide-1 || col < 0 || col > boardSide-1 ||(tGame.board[row][col] != "")){
		return "`Out of bound or cell not available. Try again.`";
	}

	// player move
	tGame.board[row][col] = "x";
	let index = checkItemInArrayT(tGame.availableCells,[row,col]);
	tGame.availableCells.splice(index, 1);
	let winnerString = checkIfWinnerT(tGame);
	if(winnerString == "You just won!" || winnerString == "You just lost!" || winnerString == "Tie!"){
		if(winnerString == "You just won!"){
			// insertCreditBot(userID,channelID, 3);
		}
		removeInstance(tGame);
		return "<@!" + userID + ">" + "'s TicTacToe Board:\n\n   " + "`"+printBoardT(tGame, userID)+winnerString+"`";
	}

	// bot move
	let move = checkNextMoveT(tGame);
	let indexOfCellToBeRemoved = undefined;
	if (move[0] == -1 && move[1] == -1){ // random move
		indexOfCellToBeRemoved = Math.floor(Math.random() * tGame.availableCells.length);
	} 
	else{ // smart move
		indexOfCellToBeRemoved = checkItemInArrayT(tGame.availableCells,[move[0],move[1]]);
	}
	move = tGame.availableCells[indexOfCellToBeRemoved];
	tGame.board[move[0]][move[1]] = "o";
	tGame.availableCells.splice(indexOfCellToBeRemoved, 1);

	winnerString = checkIfWinnerT(tGame);
	if(winnerString == "You just won!" || winnerString == "You just lost!" || winnerString == "Tie!"){
		if(winnerString == "You just won!"){
			// insertCreditBot(userID,channelID, 3);
		}
		removeInstance(tGame);
	}
	return "<@!" + userID + ">" + "'s TicTacToe Board:\n\n   " + "`"+printBoardT(tGame, userID)+winnerString+"`";

}
// check for horizontals, verticals, and diagonals
function checkIfWinnerT(tGame){
	let i, j;
	if(tGame.availableCells.length == 0){
		return "Tie!"
	}
	let numWins = 0;
	// horizontals
	for(i = 0; i < boardSide; i++){
		for(j = 0; j < boardSide; j++){
			if(tGame.board[i][j] == "x")
				numWins++;
			else if(tGame.board[i][j] == "o")
				numWins--;
		}
		if(numWins == boardSide)
			return "You just won!"
		else if(numWins == -boardSide)
			return "You just lost!"
		else
			numWins = 0;
	}
	// verticals
	for(j = 0; j < boardSide; j++){
		for(i = 0; i < boardSide; i++){
			if(tGame.board[i][j] == "x")
				numWins++;
			else if(tGame.board[i][j] == "o")
				numWins--;
		}
		if(numWins == boardSide)
			return "You just won!"
		else if(numWins == -boardSide)
			return "You just lost!"
		else
			numWins = 0;
	}
	// diagonals
	for(i = 0; i < boardSide; i++){
		if(tGame.board[i][i] == "x")
			numWins++;
		else if(tGame.board[i][i] == "o")
			numWins--;
	}
	if(numWins == boardSide)
		return "You just won!"
	else if(numWins == -boardSide)
		return "You just lost!"
	else
		numWins = 0;

	for(i = 0; i < boardSide; i++){
		if(tGame.board[i][boardSide-1 - i] == "x")
			numWins++;
		else if(tGame.board[i][boardSide-1 - i] == "o")
			numWins--;
	}
	if(numWins == boardSide)
		return "You just won!"
	else if(numWins == -boardSide)
		return "You just lost!"
	else
		numWins = 0;
	
	return "No winner yet. Keep playing!";
}

// check one move ahead of the game to win against 
// the player or to block user's winning move
function checkNextMoveT(tGame){
	let a, b;
	for(a = 0; a < boardSide; a++){
		for(b = 0; b < boardSide; b++){
			if(tGame.board[a][b] == ""){
				tGame.board[a][b] = "o";
				if(checkIfWinnerT(tGame) == "You just lost!"){
					tGame.board[a][b] = "";
					return [a,b];
				} 
				tGame.board[a][b] = "";
			}
		}
	}
	for(a = 0; a < boardSide; a++){
		for(b = 0; b < boardSide; b++){
			if(tGame.board[a][b] == ""){
				tGame.board[a][b] = "x";
				if(checkIfWinnerT(tGame) == "You just won!"){
					tGame.board[a][b] = "";
					return [a,b];
				}
				tGame.board[a][b] = "";
			}
		}
	}
	return [-1,-1];
}

// https://stackoverflow.com/questions/24943200/javascript-2d-array-indexof
function checkItemInArrayT(array, item) {
	let i;
    for (i = 0; i < array.length; i++) {
        // This if statement depends on the format of your array
        if (array[i][0] == item[0] && array[i][1] == item[1]) {
            return i;   // Found it
        }
    }
    return -1;   // Not found
}

// check if the game instance exists. If yes, access it
// If no, create it and initalize members.
function evalInstanceT(idCheck, channelID){
	let i;
	for(i = 0; i < tGames.length; i++){
		if(tGames[i].id == idCheck){
			return tGames[i];
		}
	}
	let tGame = {
		id: idCheck,
		type: "tictactoe",
		board: [],
		availableCells: []
	}
	initBoardT(tGame, idCheck, channelID);
	tGames.push(tGame);
	return tGame;
}

// initialize members in the game object
function initBoardT(tGame, userID, channelID){
	let i, j;
	for(i = 0; i < boardSide; i++){
		tGame.board[i] = [];
		for(j = 0; j < boardSide; j++){
			tGame.board[i][j] = "";
			tGame.availableCells[i*boardSide+j] = [i,j];
		}
	}
	// insertCreditBot(userID,channelID,-1);
}

// display the board as a string
function printBoardT(tGame, userID){
	let boardString = "0 1 2 \n";
	let i, j;
	for (i = 0; i < boardSide; i++) { 
		boardString += i+"|";
    	for (j = 0; j < boardSide; j++) { 
    		if(tGame.board[i][j] == "x" || tGame.board[i][j] == "o")
    			boardString += tGame.board[i][j] + "|";
    		else
    			boardString += " |";
    	}
    	boardString += "\n";
    }
	return boardString;
}
//-------------------------------------------------------------------------------------------------------------
/**
 * Main function to launch Connect-4
 * @param {int} col - the col to drop a marker on
 * @param {int} userID - the userID to pass modify credits to
 * @param {int} channelID - the channelID to modify credits to
 */
function playConnect4(col, userID, channelID){
	if (!isInt(col) || col < 0 || col > 6){
		return "`Invalid Argument. Try again.`";
	}
	let cGame = evalInstanceC(userID, channelID);
	if ((cGame.board[0][col] != "")){
		return "`Column Full. Try again.`";
	}

	// player move
	let row = undefined;
	let i;
	for(i = 5; i >= 0; i--){
		if(cGame.board[i][col] != "x" && cGame.board[i][col] != "o"){
			cGame.board[i][col] = "x";
			row = i;
			break;
		} 
	}
	updateAvailableCols(cGame, col);
	let winnerString = checkIfWinnerC(cGame, [row, col]);
	if(winnerString == "You just won!" || winnerString == "You just lost!" || winnerString == "Tie!"){
		if(winnerString == "You just won!"){
			// insertCreditBot(userID,channelID, 6);
		}
		removeInstance(cGame);
		return "<@!" + userID + ">" + "'s Connect-4 Board:\n\n " + "`"+printBoardC(cGame, userID)+winnerString+"`";
	}

	// bot move
	let move = checkNextMoveC(cGame);
	let indexOfCellToBeRemoved = undefined;
	if (move[0] == -1 && move[1] == -1){ // random move
		indexOfCellToBeRemoved = Math.floor(Math.random() * cGame.availableCols.length);
	} 
	else{ // smart move
		indexOfCellToBeRemoved = checkItemInArrayC(cGame.availableCols, move[1]);
	}
	col = cGame.availableCols[indexOfCellToBeRemoved];
	for(i = 5; i >= 0; i--){
		if(cGame.board[i][col] != "x" && cGame.board[i][col] != "o"){
			row = i;
			break;
		} 
	}
	cGame.board[row][col] = "o";
	if(cGame.board[0][col] == "x" || cGame.board[0][col] == "o"){
		cGame.availableCols.splice(indexOfCellToBeRemoved, 1);
	}
	winnerString = checkIfWinnerC(cGame, [row, col]);
	if(winnerString == "You just won!" || winnerString == "You just lost!" || winnerString == "Tie!"){
		if(winnerString == "You just won!"){
			// insertCreditBot(userID,channelID, 6);
		}
		removeInstance(cGame);
	}
	return "<@!" + userID + ">" + "'s Connect-4 Board:\n\n " + "`"+printBoardC(cGame, userID)+winnerString+"`";

}
// update the avaiableCols
function updateAvailableCols(cGame, col){
	if(cGame.board[0][col] == "x" || cGame.board[0][col] == "o"){
		for(i = 0; i < cGame.availableCols.length; i++){
			if(cGame.availableCols[i] == col){
				cGame.availableCols.splice(i, 1);
				break;
			}
		}
	}
}

// check for horizontals, verticals, and diagonals
function checkIfWinnerC(cGame, move){
	if(cGame.availableCols.length == 0)
		return "Tie!"
	let numWins = 0;
	let returnString = undefined;
	let val = cGame.board[move[0]][move[1]];

	if(val == "x") returnString = "You just won!";
	else if(val == "o") returnString = "You just lost!";
	let i,j ;
	// down
	for(i = move[0]; i < 6; i++){
		if(cGame.board[i][move[1]] == val)
			numWins++;
		else
			break;
	}
	if(numWins == 4) return returnString;
	else numWins = 0;

	// right and left
	for(j = move[1]; j < 7; j++){
		if(cGame.board[move[0]][j] == val)
			numWins++;
		else
			break;
	}
	for(j = move[1]; j >= 0; j--){
		if(cGame.board[move[0]][j] == val)
			numWins++;
		else
			break;
	}
	numWins--;
	if (numWins == 4) return returnString;
	else numWins = 0;

	// diagonals
	i = move[0]; j = move[1];
	while(i >= 0 && j < 7){ // top right
		if(cGame.board[i][j] == val)
			numWins++;
		else
			break;
		i--; j++;
	}
	i = move[0]; j = move[1];
	while(i < 6 && j >= 0){ // bottom left
		if(cGame.board[i][j] == val)
			numWins++;
		else{
			i = move[0]; j = move[1];
			break;}
		i++; j--;
	}
	numWins--;
	if(numWins == 4) return returnString;
	else numWins = 0;

	i = move[0]; j = move[1];
	while(i >= 0 && j >= 0){ // top left
		if(cGame.board[i][j] == val)
			numWins++;
		else{
			i = move[0]; j = move[1];
			break;}
		i--; j--;
	}
	i = move[0]; j = move[1];
	while(i < 6 && j < 7){ // bottom right
		if(cGame.board[i][j] == val)
			numWins++;
		else{
			i = move[0]; j = move[1];
			break;}
		i++; j++;
	}
	numWins--;
	if(numWins == 4) return returnString;
	else numWins = 0;

	return "No winner yet. Keep playing!";
}

// check one move ahead of the game to win against 
// the player or to block user's winning move
function checkNextMoveC(cGame){
	let a, b;
	for(a = 0; a < 6; a++){
		for(b = 0; b < 7; b++){
			if(cGame.board[a][b] == ""){
				cGame.board[a][b] = "o";
				if(checkIfWinnerC(cGame, [a,b]) == "You just lost!"){
					cGame.board[a][b] = "";
					return [a,b];
				} 
				cGame.board[a][b] = "";
			}
		}
	}
	for(a = 0; a < 6; a++){
		for(b = 0; b < 7; b++){
			if(cGame.board[a][b] == ""){
				cGame.board[a][b] = "x";
				if(checkIfWinnerC(cGame, [a,b]) == "You just won!"){
					cGame.board[a][b] = "";
					return [a,b];
				}
				cGame.board[a][b] = "";
			}
		}
	}
	return [-1,-1];
}

// check for an item in an array and return the index
function checkItemInArrayC(array, item) {
	let i, j;
    for (i = 0; i < array.length; i++) {
        if (array[i] == item) {
            return i;   // Found it
        }
    }
    return -1;   // Not found
}

// check if the game instance exists. If yes, access it
// If no, create it and initalize members.
function evalInstanceC(idCheck, channelID){
	let i;
	for(i = 0; i < cGames.length; i++){
		if(cGames[i].id == idCheck){
			return cGames[i];
		}
	}
	let cGame = {
		id: idCheck,
		type: "connect4",
		board: [],
		availableCols: []
	}
	initBoardC(cGame, idCheck, channelID);
	cGames.push(cGame);
	return cGame;
}

// initialize members in the game object
function initBoardC(cGame, userId, channelID){
	let i, j;
	for(i = 0; i < 6; i++){
		cGame.board[i] = [];
		for(j = 0; j < 7; j++){
			cGame.board[i][j] = "";
		}
	}
	for(i = 0; i < 7; i++){
		cGame.availableCols[i] = i;
	}
	// insertCreditBot(userID,channelID,-2);
}

// display the current board of the game
function printBoardC(cGame, userID){
	let boardString = "0 1 2 3 4 5 6 \n";
	let i, j;
	for (i = 0; i < 6; i++) { 
		boardString += "|";
    	for (j = 0; j < 7; j++) { 
    		if(cGame.board[i][j] == "x" || cGame.board[i][j] == "o")
    			boardString += cGame.board[i][j] + "|";
    		else
    			boardString += " |";
    	}
    	boardString += "\n"
    }
    boardString += " 0 1 2 3 4 5 6 \n"
	return boardString;
}
//-------------------------------------------------------------------------------------------------------------
/**
 * Main function to launch Blokus
 * @param {[]} piece - the piece to pin
 * @param {int} row - the row to pin the piece on
 * @param {int} col - the col to pin the piece on
 * @param {int} userID - the userID to pass modify credits to
 * @param {int} channelID - the channelID to modify credits to
 */
function playBlokus(piece, row, col, userID, channelID){
	if (!isInt(piece) || piece < 0 || piece > 15 || !isInt(row) || row < 0 || row > 15 || !isInt(col) || col < 0 || col > 15){
		return "`Invalid Argument(s). Try again.`";
	}
	let bGame = evalInstanceB(userID, channelID);
	if (bGame.board[row][col] != "" || !hasAtLeastOneDiagonal(bGame, [row,col], "x") || !isValidMove(bGame, bGame.availablePiecesX[piece], row, col, "x")){
		return "Either the pieces' components are overlapping, the pieces are out of bounds, or the components are adjacent to other blocks. Try Again.";
	}
	//user move
	let result = markPiece(bGame, bGame.availablePiecesX[piece], row, col, "x");

	if(result == "N/A"){
		return "Block already used. Try Again.";
	}

	let indexOfPiece1 = findPiece(bGame.availablePiecesXS, bGame.availablePiecesX[piece]);
	bGame.availablePiecesXS.splice(indexOfPiece1, 1);
	bGame.availablePiecesX[piece] = "N/A"
	let winnerString = checkIfWinnerB(bGame, "x");
	if(winnerString == "You just won!" || winnerString == "You just lost!"){
		removeInstance(bGame);
		if(winnerString == "You just won!"){
			// insertCreditBot(userID,channelID, 9);
		}
		return "<@!" + userID + ">" + "'s Blokus Board:\n\n   " + "`"+printBoardB(bGame, userID)+"\n"+winnerString+"`";
	}

	//bot move
	let randomSpaceIndex  = Math.floor(Math.random() * bGame.availableCells.length);
	let randomPieceAtRandomSpaceIndex = Math.floor(Math.random() * bGame.availablePiecesAtCell[randomSpaceIndex].length);
	let piece2 = bGame.availablePiecesAtCell[randomSpaceIndex][randomPieceAtRandomSpaceIndex];
	markPiece(bGame, piece2,
		bGame.availableCells[randomSpaceIndex][0], 
		bGame.availableCells[randomSpaceIndex][1],"o");
	let indexOfPiece2 = findPiece(bGame.availablePiecesOS, piece2);
	
	bGame.availableCells = [];
	bGame.availablePiecesAtCell = [];
	bGame.availablePiecesOS.splice(indexOfPiece2, 1);
	bGame.availablePiecesO[randomPieceAtRandomSpaceIndex] = "N/A";	
	winnerString = checkIfWinnerB(bGame, "o");
	let arrayStr = displayArray(bGame);
	bGame.availableCells = [];
	bGame.availablePiecesAtCell = [];
	if(winnerString == "You just won!" || winnerString == "You just lost!"){
		if(winnerString == "You just won!"){
			// insertCreditBot(userID,channelID, 9);
		}
		removeInstance(bGame);
	}
	return "<@!" + userID + ">" + "'s Blokus Board:\n\n   " + "`"+printBoardB(bGame, userID)+"\n"+arrayStr+winnerString+"`";
}

// Check if each component in the piece can fit on the board 
// without being out of bound, overlapping, or having an adjacent
// component given a specified row and column
function isValidMove(bGame, piece, row, col, player){
	if(piece == "N/A") return true;
	let i;
	for(i = 1; i < piece.length; i++){
		try{
			if(bGame.board[row+piece[i][0]][col+piece[i][1]] != "" || hasAdjacent(bGame, row+piece[i][0], col+piece[i][1], player))
				return false;                                          
		}
		catch(err){
			return false; // out of bounds
		}
	}
	return true;
}

// Check for at least one diagonal occupied block at the specified component
function hasAtLeastOneDiagonal(bGame, component, player){
	try {
		if(bGame.board[component[0]-1][component[1]-1] == player)return true; //top left
	}
	catch(err) {/*Ignore out of bounds*/}
	try {
		if(bGame.board[component[0]-1][component[1]+1] == player)return true; // top right
		}
	catch(err) {/*Ignore out of bounds*/}
	try {
		if(bGame.board[component[0]+1][component[1]-1] == player)return true; // bottom left
	}
	catch(err) {/*Ignore out of bounds*/}
	try {
		if(bGame.board[component[0]+1][component[1]+1] == player)return true; // bottom right
	}
	catch(err) {/*Ignore out of bounds*/}
	return false;
}

// Check for any adjacents occupied block at specifid row and column
function hasAdjacent(bGame, row, col, player){
	try {
		if(bGame.board[row][col-1] == player)return true; // left
	}
	catch(err) {/*Ignore out of bounds*/ }// console.log("out of bounds -left");}
	try {
		if(bGame.board[row][col+1] == player)return true; // right
	}
	catch(err) {/*Ignore out of bounds*/ }// console.log("out of bounds -right");}
	try {
		if(bGame.board[row-1][col] == player)return true; // up
	}
	catch(err) {/*Ignore out of bounds*/ }// console.log("out of bounds -up");}
	try {
		if(bGame.board[row+1][col] == player)return true; // down
	}
	catch(err) {/*Ignore out of bounds*/ }// console.log("out of bounds -down");}
	return false;
}

// mark all the components in the piece on the board at row/col with marker
function markPiece(bGame, piece, row, col, player){
	if(piece == "N/A"){return "N/A";}
	let i;
	for(i = 1; i < piece.length; i++){
		bGame.board[row+piece[i][0]][col+piece[i][1]] = player;
	}
}

// search for a piece in the shrink array and return the index
function findPiece(shrinkArray, p){
	let i, j;
	for(i = 0; i < shrinkArray.length; i++){
		for(j = 1; j < shrinkArray[i].length; j++){
			if(shrinkArray[i].length != p.length){
				break;
			}
			if(shrinkArray[i][j][0] != p[j][0] || shrinkArray[i][j][1] != p[j][1]){
				break;
			}
			if(j == shrinkArray[i].length - 1){
				return i;
			}
		}
	}
	//console.log("Can't find the piece.");
}

// check all available cells and which corresponding pieces can
// be pinned to those cells and store them in the 2 temp arrays
function fillArrays(bGame, availablePieces, player){
	let a, b, k;
	for(a = 0; a < bGame.board.length; a++){
		for(b = 0; b < bGame.board[a].length; b++){
			if(bGame.board[a][b] != ""){
				continue;
			}	
			let secondLayer = [];
			for(k = 0; k < availablePieces.length; k++){
				if(hasAtLeastOneDiagonal(bGame, [a, b], player) && isValidMove(bGame, availablePieces[k], a, b, player)){
					secondLayer.push(availablePieces[k]);
				}
			}

			if(secondLayer.length != 0){
				bGame.availableCells.push([a,b]);
				bGame.availablePiecesAtCell.push(secondLayer);	
			}

		}
	}
}

// displays all the elements in an array
function displayArray(bGame){
	let i;
	let arrayStr = "Cells available for move: {";
	for (i = 0; i < bGame.availableCells.length; i++){
		arrayStr += "(" + bGame.availableCells[i][0] + ", " + bGame.availableCells[i][1] + ")"; 
	}
	arrayStr += "}";
	return arrayStr;
}

// check for no more moves
function checkIfWinnerB(bGame, player){
	if(player == "x"){
		fillArrays(bGame, bGame.availablePiecesOS, "o");
		if(bGame.availablePiecesAtCell.length == 0){
			return "You just won!";
		}
		return "No winner yet. Keep playing!";
	}
	else if(player == "o"){
		fillArrays(bGame, bGame.availablePiecesXS, "x");
		if(bGame.availablePiecesAtCell.length == 0){
			return "You just lost!";
		}
		return "No winner yet. Keep playing!";	
	}
}

// check if the game instance exists. If yes, access it
// If no, create it and initalize members.
function evalInstanceB(idCheck, channelID){
	let i;
	for(i = 0; i < bGames.length; i++){
		if(bGames[i].id == idCheck){
			return bGames[i];
		}
	}
	let bGame = {
		id: idCheck,
		type: "blokus",
		board: [],
		availableCells: [], 			// 2d array of empty cells
		availablePiecesAtCell: [],		// 3d array analysis of ALL possible pieces that can fit into the cell
		availablePiecesX: arrayClone(pieces1),  // pieces marked with N/A
		availablePiecesO: arrayClone(pieces2),  // pieces marked with N/A
		availablePiecesXS: arrayClone(pieces1), // pieces that shrink for random search
		availablePiecesOS: arrayClone(pieces2)  // pieces that shrink for random search
	}
	initBoardB(bGame, idCheck, channelID);
	bGames.push(bGame);
	return bGame;
}

// initialize members in the game object
function initBoardB(bGame, userID, channelID){
	let i, j;
	for(i = 0; i < bBoardSide; i++){
		bGame.board[i] = [];
		for(j = 0; j < bBoardSide; j++){
			bGame.board[i][j] = "";
		}
	}
	bGame.board[9][0] = "x"; // start player move on bottom left
	bGame.board[0][9] = "o"; // start bot move on top right

	// insertCreditBot(userID,channelID,-3);
}

// display the current board of the game
function printBoardB(bGame, userID){
	let boardString = "0 1 2 3 4 5 6 7 8 9 \n";
	let i, j;
	for (i = 0; i < bBoardSide; i++) { 
		boardString += i + "|";
    	for (j = 0; j < bBoardSide; j++) { 
    		if(bGame.board[i][j] == "x" || bGame.board[i][j] == "o")
    			boardString += bGame.board[i][j] + "|";
    		else
    			boardString += " |";
    	}
    	boardString += i.toString(16)+"\n"
    }
    boardString += "  0 1 2 3 4 5 6 7 8 9 \n";
    boardString += printPieces(bGame.availablePiecesXS, "your");
    boardString += printPieces(bGame.availablePiecesOS, "cpu ");
	return boardString;
}

// displays each pieces individually
function printPieces(availablePiecesS, whose){
	let piecesString = whose + " availablePieces: "
	let i;
	for(i = 0; i < availablePiecesS.length; i++){
		if(i == availablePiecesS.length-1){
			piecesString += availablePiecesS[i][0];
			break;
		}
		piecesString += availablePiecesS[i][0] + ", ";
	}
	return piecesString + "\n";

}

// sample piece set for the player playing blokus
let pieces1 = [
	[0,[0,0]],								// 0
	[1,[0,0],[0,1]],						// 1
	[2,[0,0],[0,1],[1,1]],					// 2
	[3,[0,0],[0,1],[0,2]],					// 3
	[4,[0,0],[0,1],[-1,0],[-1,1]],			// 4
	[5,[0,0],[0,1],[0,2],[-1,1]],			// 5
	[6,[0,0],[0,1],[0,2],[0,3]],			// 6
	[7,[0,0],[0,1],[0,2],[-1,2]],			// 7
	[8,[0,0],[0,1],[-1,1],[-1,2]],			// 8
	[9,[0,0],[0,1],[0,2],[-1,1],[-2,1]],	// 9
	[10,[0,0],[0,1],[0,2],[-1,0],[-2,0]],	// 10
	[11,[0,0],[0,1],[-1,1],[-1,2],[-1,3]],	// 11
	[12,[0,0],[-1,0],[-1,1],[-1,2],[-2,2]],	// 12
	[13,[0,0],[-1,0],[-2,0],[-3,0],[-4,0]],	// 13
	[14,[0,0],[0,1],[-1,0],[-1,1],[-2,0]],	// 14
	[15,[0,0],[-1,0],[0,1],[0,2],[0,3]]		// 15
];

// sample piece set for the cpu playing blokus
let pieces2 = [
	[0,[0,0]],									// 0
	[1,[0,0],[0,-1]],							// 1
	[2,[0,0],[0,-1],[1,0]],						// 2
	[3,[0,0],[0,-1],[0,-2]],					// 3
	[4,[0,0],[0,-1],[1,0],[1,-1]],				// 4
	[5,[0,0],[0,-1],[0,-2],[-1,-1]],			// 5
	[6,[0,0],[0,-1],[0,-2],[0,-3]],				// 6
	[7,[0,0],[1,0],[1,-1],[1,-2]],				// 7
	[8,[0,0],[0,-1],[1,-1],[1,-2]],				// 8
	[9,[0,0],[1,0],[2,0],[2,1],[2,-1]], 		// 9
	[10,[0,0],[0,-1],[0,-2],[-1,-2],[-2,-2]],	// 10
	[11,[0,0],[0,-1],[0,-2],[1,-2],[1,-3]],		// 11
	[12,[0,0],[1,0],[1,-1],[1,-2],[2,-2]],		// 12
	[13,[0,0],[1,0],[2,0],[3,0],[4,0]],			// 13
	[14,[0,0],[1,0],[2,0],[1,1],[2,1]],			// 14
	[15,[0,0],[0,-1],[0,-2],[0,-3],[-1,-3]]		// 15
];


// Phong's code end

//Export for Main file
module.exports = {
	games_data : games_data,
	pairs : pairs,
	hangman : hangman,
	pSlots : pSlots,
	p2048 : p2048,

	// Phong's code begin
	printCommandTable: printCommandTable,
	playTicTacToe: playTicTacToe,
	evalInstanceT: evalInstanceT,
	printBoardT: printBoardT,
	playConnect4: playConnect4,
	evalInstanceC: evalInstanceC,
	printBoardC: printBoardC,
	playBlokus: playBlokus,
	evalInstanceB: evalInstanceB,
	printBoardB: printBoardB,
	// Phong's code end
};
