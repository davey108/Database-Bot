let fs = require('fs');
let date = new Date();
let path = './' + date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + '.txt';
// if the file does not exist
if(!fs.existsSync(path)){
	// maybe we want to end previous file log too?
	let prevD = new Date(date);
	prevD.setDate(date.getDate()-1);
	let prevP = './' + prevD.getFullYear() + "-" + (prevD.getMonth() + 1) + "-" + prevD.getDate() + '.txt';
	console.log(prevP);
	if(fs.existsSync(prevP)){
		let prevStream = fs.createWriteStream(prevP, {'flags' : 'a'});
		prevStream.end('This is the end of today log');
	}	
	// create file
	fs.closeSync(fs.openSync(path, 'w'));
}
let logStream = fs.createWriteStream(path, {'flags': 'a'});


function writeContent(eventype, message){
	let date = new Date();
	logStream.write(date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds() + " " + eventype + "-" + message);	
}



