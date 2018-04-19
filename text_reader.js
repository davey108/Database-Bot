let fs = require('fs');
let date = new Date();
let path = './' + date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + '.txt';
// if the file does not exist
if(!fs.existsSync(path)){
	console.log(path);
	// create file
	fs.closeSync(fs.openSync(path, 'w'));
}
let logStream = fs.createWriteStream(path, {'flags': 'a'});






function writeContent(eventype, message){
	
	
}



