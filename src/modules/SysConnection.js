const net = require('net');
const Logger = require('./Logger');
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
            resolve(true);
        })
    };

    hello() {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                reject('timeout');
            }, 3000)
            this.sock.write("HELLO_CITAUTH_SYS\n");
            this.sock.once('data', (data) => {
                if(data.toString() == "HELLO_CITAUTH_API\n") {
                    resolve(true);
                }
                else {
                    resolve(false);
                }
            })
            this.sock.once('error', (error) => {
                reject(error);
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
            setTimeout(() => {
                reject('timeout');
            }, 3000);
            const success_message = "AUTH_SUCCESS:"+uuid+'\n';
            this.sock.write("AUTH:"+uuid+'\n');
            this.sock.once('data', (data) => {
                if(data.toString() == success_message) {
                    resolve(true);
                }
                else {
                    resolve(false);
                }
            })
        })
    }

    register(email, uuid, preregid) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                reject('timeout');
            }, 3000);
            const success_message = "RGST_SUCCESS:"+uuid+'|'+email+'#'+preregid+'\n';
            this.sock.write("RGST:"+uuid+'|'+email+'#'+preregid+'\n');
            this.sock.once('data', (data) => {
                if(data.toString() == success_message) {
                    resolve(true);
                }
                else {
                    resolve(false);
                }
            })
        })
    }

    preregister(email, uuid) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                reject('timeout');
            }, 3000);
            const success_message = "PRRG_SUCCESS:"+uuid+'|'+email;
            this.sock.write("PRRG:"+uuid+'|'+email+'\n');
            this.sock.once('data', (data) => {
                if(data.toString().indexOf(success_message) != -1) {
                    let preregid = data.toString().substring(data.toString().indexOf('#')+1);
                    resolve(preregid);
                }
                else {
                    resolve(false);
                }
            });
        })
    }

    delete(email, uuid) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                reject('timeout')
            }, 3000);
            const success_message = "DELT_SUCCESS:"+uuid+'|'+email+'\n';
            this.sock.write("DELT:"+uuid+'|'+email+'\n');
            this.sock.once('data', (data) => {
                console.log(data);
                if(data.toString() == success_message) {
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