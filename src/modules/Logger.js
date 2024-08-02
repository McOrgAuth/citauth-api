const fs = require('node:fs');
class Logger {
    path;
    stream;
    constructor(path) {
        try {
            fs.mkdirSync(path);
            console.log("Directory", path, "not found. Created.");
        } catch (err) {
            console.log("Dicectory", path, "already exists.");
        }
        this.path = path + '/' + Date.parse(new Date()) +".log";
        this.stream = fs.createWriteStream(this.path, {encoding:'utf-8'});
        if(this.stream == null) {
            return null;
        }
        else {
            this.log("Logging started");
        }
        
    }

    error(message) {
        const formatted_message = format(message, "ERR");
        this.stream.write(formatted_message+'\n');
        console.error(formatted_message);
    }

    log(message) {
        const formatted_message = format(message, "LOG");
        this.stream.write(formatted_message+'\n');
        console.log(formatted_message);
    }


}

function format(message, type) {
    const now = new Date();
    let formatted_message = "[" + now.toISOString() + "]" + "["+type+"]"+message;
    return formatted_message;
}

module.exports = Logger;