const Discord = require('discord.io');
let auth = require('./auth.json');
let answer = [];
let input = [];
const testChID = '366786162238554114';
const serverID = '366786162238554112';
const db_botID = '408773791284723713';
let bot = new Discord.Client({
	token: auth.token,
	autorun: true
});

bot.on('ready',(evt) => {
	console.log('Logged in as %s - %s\n', bot.username, bot.id);
});

runTests();

bot.on('message', (user,userID,channelID,message,evt) => {
	// listen for database bot response
	if(userID == db_botID){
		answer.push(message);		
	}
});

/**
 * Run the test
 */
function runTests(){
	await testMix();
	await testGood();
	await testNotRegistered();
	await testTwoSlots();
	await testAdmin();
}

/**
 * Delay the send message function
 */
function delay(channelID,message){
	return new Promise((resolve,reject) => {
		setTimeout(() => {
			bot.sendMessage({
				to: channelID,
				message: message,
			});
			return resolve(message);
		}, 5000);		
	});	
}
/**
 * This test case tests for mix of good and failure command
 */
let testMix = () => {
	return new Promise((resolve,reject) => {
		reSet();
		// pushing inputs
		input.push('daily');
		input.push('daily'); // expect to fail
		input.push('gcredit' + bot.username + 1000); // expect to fail
		input.push('mark' + bot.username); // expect to fail...not admin
		input.push('slots'); // this makes bet for slot 1
		input.push('credit'); // expect either 199 or 202
		input.push('mystrike');	// expect 0
		getOutput();
		resolve(input);
	});
}

/**
 * This test only test the good path, i.e no error
 */
let testGood = () => {
	return new Promise((resolve,reject) => {
		reSet();
		input.push('daily');
		input.push('credit'); // expect 200
		input.push('mystrike'); // expect 0
		input.push('slots 100');
		input.push('credit'); // expect 100 or 400
		getOutput();
		resolve(input);
	});
}

/**
 * This test expect to receive nothing but error telling it
 * to register until the end when it registers
 */
let testNotRegistered = () => {
	return new Promise((resolve,reject) = > {
		reSet();
		input.push('credit'); 
		input.push('mystrike');
		input.push('slots 100');
		input.push('daily'); // ok, got credit
		input.push('credit');	// ok from here
		getOutput();
		resolve(input);
	});
}

/**
 * This test mix valid and invalid input but does 2 slots
 */
let testTwoSlots = () => {
	return new Promise((resolve,reject) => {
		reSet();
		input.push('credit'); // invalid, not registered
		input.push('daily'); // ok
		input.push('credit');
		input.push('strike');
		input.push('slots');
		input.push('credit'); // expect 199 or 202
		input.push('slots 100');
		input.push('credit'); // expect either 402 or 399
		getOutput();
		resolve(input);
	});
}

/**
 * This test runs as if the bot has an admin role, so it 
 * can do more modification to the data 
 */
let testAdmin = () => {
	return new Promise((resolve, reject) => {
		reSet();
		input.push('daily');
		input.push('credit');  // expect 200
		input.push('mystrike'); // expect 0
		input.push('gcredit ' + bot.id + ' 1000');
		input.push('credit'); // expect 1200
		input.push('mark ' + bot.username);
		input.push('mystrike'); // expect 1
		input.push('gcredit ' + bot.id + ' -1200');
		input.push('credit'); // expect 0
		getOutput();
		resolve(input);		
	});
}
/**
 * Run to get output from database bot
 */
function getOutput(){
	// loop through and issue command, make sure there is a
	// delay in between (5 seconds) plenty for bot to response
	for(let i = 0; i < input.length; i++){
		await delay(testChID,'!' + input[i]);	
	}
	// print out the output
	console.log("Test output for testMix");
	for(let i = 0; i < answer.length; i++){
		console.log(answer[i]);
	}
}

/**
 * Refresh the input and output array
 */
function reSet(){
	// reset input array
	input = [];
	// reset answer array
	answer = [];	
}
	