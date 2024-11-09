const net = require('net');
const Logger = require('./Logger');

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
            let req_json = {
                "hello": "ping"
            };
            let res_json = undefined;
            console.log(JSON.stringify(req_json));
            this.sock.write(JSON.stringify(req_json));
            this.sock.once('data', (data) => {
                res_json = JSON.parse(data);
                if(res_json.hello == "pong") {
                    resolve(true);
                }
                else {
                    resolve(false);
                }
            });
            this.sock.once('error', (error) => {
                reject(error);
            })
            /*
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
            */
        })
    }

    bye() {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                reject(false);
            }, 3000);

            let req_json = {
                "bye": "ping"
            };
            let res_json = undefined;
            this.sock.write(JSON.stringify(req_json));
            this.sock.once('data', (data) => {
                res_json = JSON.parse(data);
                if(res_json.bye == "pong") {
                    resolve(true);
                }
                else {
                    resolve(false);
                }
            });
            this.sock.once('error', (error) => {
                reject(error);
            })
            /*
            this.sock.write("BYE_CITAUTH_SYS\n");
            this.sock.once('data', (data) => {
                if(data.toString() == "BYE_CITAUTH_API\n") {
                    resolve(true);
                }
                else {
                    resolve(false);
                }
            })
            */
        })
    }

    authenticate(uuid) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                reject('timeout');
            }, 3000);

            let req_json = {
                "method": "AUTH",
                "uuid": uuid,
            };

            let res_json = undefined;

            this.sock.write(JSON.stringify(req_json));
            this.sock.once('data', (data) => {
                res_json = JSON.parse(data);
                if(res_json == undefined) {
                    reject();
                }
                else {
                    console.log(res_json);
                    if(res_json.method=="AUTH" && res_json.uuid==uuid) {
                        resolve(res_json);
                    }
                    else {
                        reject();
                    }
                }
            });
        })
    }

    register(preregid) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                reject('timeout');
            }, 3000);

            let req_json = {
                "method": "RGST",
                "preregid": preregid
            }

            let res_json = undefined;

            this.sock.write(JSON.stringify(req_json));
            this.sock.once('data', (data) => {
                res_json = JSON.parse(data);
                if(res_json == undefined) {
                    reject();
                }
                else {
                    console.log(res_json);
                    if(res_json.method == "RGST" && res_json.preregid == preregid) {
                        resolve(res_json);
                    }
                    else {
                        reject();
                    }
                }
            });
        })
    }

    preregister(email, uuid) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                reject('timeout');
            }, 3000);

            let req_json = {
                "method": "PRRG",
                "email": email,
                "uuid": uuid,
            };

            let res_json = undefined;

            this.sock.write(JSON.stringify(req_json));
            this.sock.once('data', (data) => {
                res_json = JSON.parse(data);
                if(res_json == undefined) {
                    reject();
                }
                else {
                    console.log(res_json);
                    if(res_json.method=="PRRG" && res_json.email==email && res_json.uuid==uuid) {
                        resolve(res_json);
                    }
                    else {
                        reject();
                    }
                }
            });

        })
    }

    delete(email, uuid) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                reject('timeout')
            }, 3000);

            let req_json = {
                "method": "DELT",
                "email": email,
                "uuid": uuid,
            };

            let res_json = undefined;

            this.sock.write(JSON.stringify(req_json));
            this.sock.once('data', (data) => {
                res_json = JSON.parse(data);
                if(res_json == undefined) {
                    reject();
                }
                else {
                    console.log(res_json);
                    if(res_json.method=="DELT" && res_json.email==email && res_json.uuid==uuid) {
                        resolve(res_json);
                    }
                    else {
                        reject();
                    }
                }
            });
        })
    }

    
}

module.exports = SysConnection;