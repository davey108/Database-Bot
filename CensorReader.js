var fs = require('fs')
var es = require('event-stream');
var array = [];
var lineNr = 0;

var s = fs.createReadStream(process.argv[2])
    .pipe(es.split())
    .pipe(es.mapSync(function(line){

            // pause the readstream
            s.pause();

            lineNr += 1;
            array.push(line.trim());
            // process line here and call s.resume() when rdy
            // function below was for logging memory usage
            //logMemoryUsage(lineNr);

            // resume the readstream, possibly from a callback
            s.resume();
        })
            .on('error', function(err){
                console.log('Error while reading file.', err);
            })
            .on('end', function(){
                console.log('Read entire file.');
                array.forEach(function(element){
                    console.log(element);
                });
            })
    );
