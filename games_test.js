'use strict';

var games = require('./game.js');
var uID = '1234';
var cID = '9876';

console.log(games.games_data);

function test_hangman(){
	//start new game
	console.log(games.hangman(uID,'',cID));
	
	//lose the game
	for(let i=0;i<5;i++){
		console.log(games.hangman(uID,i+"",cID));
	}console.log(games.hangman(uID,'6',cID));
	
	//start new game
	console.log(games.hangman(uID,'',cID));
	
	//win game
	//set user's word to 'test'
	//let games.games_data[uID]['word'] = 'test';
	
	console.log(games.hangman(uID,'t',cID));
	console.log(games.hangman(uID,'e',cID));
	console.log(games.hangman(uID,'s',cID));
	
	//start new game
	console.log(games.hangman(uID,"",cID));
	//let games.games_data[uID]['word'] = 'test'
	
	//Test invalid inputs
	console.log(games.hangman(uID,"AAA",cID));
	console.log(games.hangman(uID,"A",cID));
	console.log(games.hangman(uID,"a",cID)); 	
}

function test_2048(){
	
	let max = 4; let min = 1;
	
	//randomly make moves 100 times, manually verifiy board is correct
	for(let i=0;i<150;i++){
		let r = Math.floor(Math.random()*(max-min+1))+min;
		switch(r){
			case 1: console.log('up'); console.log(games.p2048(uID,'up',cID)); break;
			case 2: console.log('down'); console.log(games.p2048(uID,'down',cID)); break;
			case 3: console.log('left'); console.log(games.p2048(uID,'left',cID)); break;
			case 4: console.log('right'); console.log(games.p2048(uID,'right',cID)); break;
		}
	}
	
	//check invalid inputs
	console.log(games.p2048(uID,'qwerty',cID));
}

function test_slots(){
	
	let max = 100; let min = 1;
	//play slots 20 times, manually verify each output
	for(let i=0;i<20;i++){
		let r = Math.floor(Math.random()*(max-min+1))+min;
		console.log(games.pSlots(uID,cID,r));
	}
	
	//test invalid amounts
	console.log(games.pSlots(uID,cID,-1));
	console.log(games.pSlots(uID,cID,0));
	console.log(games.pSlots(uID,cID,9999999999999999));
}

function test_games(){
	test_hangman();
	test_2048();
	test_slots();
}

test_games();

