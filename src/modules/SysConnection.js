const net = require('net');
const textEncoder = new TextEncoder("utf-8");

class SysConnection {
    port;
    host;
    hello_flag = false;
    constructor() {

    }

    init(port, host) {
        return new Promise((resolve, reject) => {
            this.port = port;
            this.host = host;
            this.sock = net.createConnection({port: port, host: host, keepAlive: true, });
            this.sock.setEncoding("utf-8");
            resolve();
        })
    };

    hello() {
        return new Promise((resolve, reject) => {
            this.sock.write("HELLO_CITAUTH_SYS\n");
            this.sock.once('data', (data) => {
                if(data.toString() == "HELLO_CITAUTH_API\n") {
                    resolve(true);
                }
                else {
                    resolve(false);
                }
            })
        })
    }

    bye() {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                reject(false);
            }, 3000);
            this.sock.write("BYE_CITAUTH_SYS\n");
            this.sock.once('data', (data) => {
                if(data.toString() == "BYE_CITAUTH_API\n") {
                    resolve(true);
                }
                else {
                    resolve(false);
                }
            })
        })
    }

    authenticate(uuid) {
        return new Promise((resolve, reject) => {
            this.sock.write("AUTh:",uuid,'\n');
            this.sock.once('data', (data) => {
                if(data.toString() == "AUTH_SUCCESS:",uuid,'\n') {
                    resolve(true);
                }
                else {
                    resolve(false);
                }
            })
        })
    }

    
}

module.exports = SysConnection;