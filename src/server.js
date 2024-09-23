const express = require("express");
const app = express();
const configfile = require("config");
const jwt = require('jsonwebtoken');
const fs = require('fs');

const apiport = configfile.config.apiport;
const sysport = configfile.config.sysport;
const syshost = configfile.config.syshost;
const logpath = configfile.config.logpath;
const pubkeypath  = configfile.config.pubkeypath;

const pattern = new RegExp(configfile.config.pattern);

const SysConnection = require('./modules/SysConnection.js');
const Logger = require('./modules/Logger.js')
const pubkey = fs.readFileSync(configfile.config.pubkeypath);
let status = false;
let syscon = null;
let logger = null;

app.use(express.json());

app.get('/', (req, res) => {

    res.status(200).send("CITAUTH API SERVER");

});

//authenticate user
app.get('/api/user', (req, res) => {

    const method = 'authenticate';

    if(!status) {
        return res.status(503).send();
    }

    if(req.headers['authorization'] == undefined) {
        console.log(req.headers['authorization']);
        res.setHeader('WWW-Authenticate','Bearer error="token_required"');
        return res.status(401).send("token_required");
    }

    if(req.headers['authorization'].indexOf('Bearer') == -1) {
        res.setHeader('WWW-Authenticate', 'Bearer error="invalid_access_token"');
        return res.status(401).send('invalid_access_token');
    }

    const token = req.headers['authorization'].slice(7);

    let decoded = undefined;

    try {
        decoded = jwt.verify(token, pubkey);
    } catch (err) {
        //invalid
        res.setHeader('WWW-Authenticate', 'Bearer error="invalid_access_token"');
        return res.status(401).send('invalid_access_token');
    }

    const expire = decoded.exp;
    const now = Date.now();

    if(expire > now) {
        //valid
        res.setHeader('WWW-Authenticate', 'Bearer realm="citauth_authenticate_user"');
    }
    else {
        //expired
        res.setHeader('WWW-Authenticate', 'Bearer realm="expired_access_token"');
        return res.status(401).send('expired_access_token');
    }

    if(!checkScope(method, decoded.scp)) {
        res.setHeader('WWW-Authenticate', 'Bearer error=""');
        return res.status(403).send();
    }

    if(req.body.uuid == undefined) {
        console.log("no uuid");
        return res.status(400).send("uuid_required");
    }

    const uuid = req.body.uuid;

    if(uuid.length != 32) {
        return res.status(400).send("wrong_length_of_uuid");
    }

    syscon.authenticate(req.body.uuid)
    .then((result) => {
        if(result) {
            logger.log("AUTHENTICATE_SUCCEEDED, NOEMAIL, "+uuid+', token:'+token);
            return res.status(200).send();
        }
        else {
            logger.log("AUTHENTICATE_FAILED, NOEMAIL, "+uuid+', token:'+token);
            return res.status(404).send();
        }
    })
    .catch((err) => {
        logger.error("CONNECTION_FAILED_TO_CITAUTH_SYS, NOEMAIL, "+uuid+", token:"+token);
        if(!res.closed)
            return res.status(500).send(err);
    });

});

//register user
app.post('/api/user', (req, res) => {

    const method = 'register';

    if(!status) {
        return res.status(503).send();
    }

    if(req.headers['authorization'] == undefined) {
        console.log(req.headers['authorization']);
        res.setHeader('WWW-Authenticate','Bearer error="token_required"');
        return res.status(401).send("token_required");
    }

    if(req.headers['authorization'].indexOf('Bearer') == -1) {
        res.setHeader('WWW-Authenticate', 'Bearer error="invalid_access_token"');
        return res.status(401).send('invalid_access_token');
    }

    const token = req.headers['authorization'].slice(7);

    let decoded = undefined;

    try {
        decoded = jwt.verify(token, pubkey);
    } catch (err) {
        //invalid
        res.setHeader('WWW-Authenticate', 'Bearer error="invalid_access_token"');
        return res.status(401).send('invalid_access_token');
    }

    const expire = decoded.exp;
    const now = Date.now();

    if(expire > now) {
        //valid
        res.setHeader('WWW-Authenticate', 'Bearer realm="citauth_register_user"');
    }
    else {
        //expired
        res.setHeader('WWW-Authenticate', 'Bearer realm="expired_access_token"');
        return res.status(401).send('expired_access_token');
    }

    if(req.body.email == undefined) {
        logger.log("Failed to register:");
        return res.status(400).send('email_required');
    }

    if(req.body.uuid == undefined) {
        return res.status(400).send('uuid_required');
    }

    if(res.body.preregid == undefined) {
        return res.status(400).send('preregister_required');
    }

    const uuid = req.body.uuid;
    const email = req.body.email;
    const preregid = req.body.preregid;

    if(uuid.length != 32) {
        res.status(400).send('wrong_length_of_uuid');
        return;
    }
    else if(email.match(pattern) == null) {
        res.status(403).send('address_not_allowed_to_register');
        return;
    }
    else if(preregid.length != 32) {
        res.status(400).send('wrong_length_of_preregid');
    }

    syscon.register(email, uuid, preregid)
    .then((result) => {
        if(result) {
            logger.log("REGISTER_SUCCEEDED, "+email+", "+uuid+", "+preregid);
            console.log(email, uuid, preregid, "succeeded")
            res.status(200).send();
        }
        else {
            logger.log("REGISTER_FAILED, "+email+", "+uuid+", "+preregid);
            res.status(400).send();
        }
    })
    .catch((err) => {
        console.log(err);
        res.status(500).send(err);
    });

});

//delete user
app.delete('/api/user', (req, res) => {

    const method = 'delete';

    if(!status) {
        res.status(503).send();
        return;
    }

    if(req.headers['authorization'] == undefined) {
        console.log(req.headers['authorization']);
        res.setHeader('WWW-Authenticate','Bearer error="token_required"');
        return res.status(401).send("token_required");
    }

    if(req.headers['authorization'].indexOf('Bearer') == -1) {
        res.setHeader('WWW-Authenticate', 'Bearer error="invalid_access_token"');
        return res.status(401).send('invalid_access_token');
    }

    const token = req.headers['authorization'].slice(7);

    let decoded = undefined;

    try {
        decoded = jwt.verify(token, pubkey);
    } catch (err) {
        //invalid
        res.setHeader('WWW-Authenticate', 'Bearer error="invalid_access_token"');
        return res.status(401).send('invalid_access_token');
    }

    const expire = decoded.exp;
    const now = Date.now();

    if(expire > now) {
        //valid
        res.setHeader('WWW-Authenticate', 'Bearer realm="citauth_delete_user"');
    }
    else {
        //expired
        res.setHeader('WWW-Authenticate', 'Bearer realm="expired_access_token"');
        return res.status(401).send('expired_access_token');
    }

    if(req.body.email == undefined) {
        res.status(400).send('email required');
        return;
    }

    if(req.body.uuid == undefined) {
        res.status(400).send('uuid required');
        return;
    }

    const email = req.body.email;
    const uuid = req.body.uuid;

    if(uuid.length != 32) {
        res.status(400).send('wrong length of uuid');
        return;
    }

    syscon.delete(email, uuid)
    .then((result) => {
        if(result) {
            logger.log("DELETE_SUCCEEDED, "+email+", "+uuid);
            res.status(200).send();
        }
        else {
            logger.log("DELETE_FAILED, "+email+", "+uuid);
            res.status(400).send();
        }
    })
    .catch((err) => {
        res.status(500).send(err);
    })
});

//email authentication
app.post('/api/pre', (req, res) => {

    const method = 'preregister';

    if(!status) {
        res.status(503).send();
        return;
    }

    if(req.headers['authorization'] == undefined) {
        console.log(req.headers['authorization']);
        res.setHeader('WWW-Authenticate','Bearer error="token_required"');
        return res.status(401).send("token_required");
    }

    if(req.headers['authorization'].indexOf('Bearer') == -1) {
        res.setHeader('WWW-Authenticate', 'Bearer error="invalid_access_token"');
        return res.status(401).send('invalid_access_token');
    }

    const token = req.headers['authorization'].slice(7);

    let decoded = undefined;

    try {
        decoded = jwt.verify(token, pubkey);
    } catch (err) {
        //invalid
        res.setHeader('WWW-Authenticate', 'Bearer error="invalid_access_token"');
        return res.status(401).send('invalid_access_token');
    }

    const expire = decoded.exp;
    const now = Date.now();

    if(expire > now) {
        //valid
        res.setHeader('WWW-Authenticate', 'Bearer realm="citauth_preregister_user"');
    }
    else {
        //expired
        res.setHeader('WWW-Authenticate', 'Bearer realm="expired_access_token"');
        return res.status(401).send('expired_access_token');
    }

    if(req.body.email == undefined) {
        res.status(400).send('email required');
        return;
    }

    if(req.body.uuid == undefined) {
        res.status(400).send('uuid required');
        return;
    }

    const email = req.body.email;
    const uuid = req.body.uuid;

    if(uuid.length != 32) {
        res.status(400).send('wrong length of uuid');
        return;
    }

    syscon.preresigter(email, uuid)
    .then((result) => {
        if(result) {
            logger.log("PREREGISTER_SUCCEEDED, "+email+", "+uuid);
            res.status(200).send();
        }
        else {
            logger.log("PREREGISTER_FAILED, "+email+", "+uuid);
            res.status(400).send();
        }
    })
    .catch((err) => {
        logger.error(err);
    })

});

//check status of api
app.get(('/api/status', (req, res) => {

    status ? res.status(200).send() : res.status(503).send();

}))

app.listen(apiport, () => {

    console.log('\n----------------------------------------------------------------------------------------------\n',
        " #####    ######  ######## ######   ##   ##  ######## ### ###           ######   ######    ######\n",
        "##   ##     ##    ## ## ##  ## ###   #   ##  ## ## ##  ## ##             ## ###   ##  ##     ##\n",
        "##   ##     ##       ##     ##  ##  ##   ##     ##     ## ##             ##  ##   ##  ##     ##\n",
        "##          ##       ##     ######  ##   ##     ##     #####    ######   ######   #####      ##\n",
        "##   ##     ##       ##     ##  ##  ##   ##     ##     #  ##             ##  ##   ##         ##\n",
        "##   ##     ##       ##     ##  ##  ### ###     ##     ## ##             ##  ##   ##         ##\n",
        " #####    ######    ####   ###  ##   #####     ####   ### ###           ###  ##  ####      ######\n",
        '---------------------------------------Under construction-------------------------------------\n'
    );

    console.log("Developed by mam1zu(mam1zu.piyo@gmail.com)");
    console.log("This API server is under construction");

    logger = new Logger(logpath);

    if(logger == null) {
        console.error("Failed to start logging, startup aborted!");
        process.exit(-10);
    }

    syscon = new SysConnection();

    syscon.init(sysport, syshost)
    .then(() => {
        logger.log("Saying hello to CITAUTH-SYS...");
        syscon.hello()
        .then((result) => {
            if(result) {
                logger.log("CITAUTH-SYS returned hello to api.")
                syscon.hello_flag = true;
                status = true;
                logger.log("CITAUTH-API-SERVER is now listening at: "+ apiport);
            }
            else {
                logger.error("CITAUTH-SYS didn't return anything, connection failed.");
            }
        })
        .catch((err) => {
            logger.error("Connection establishment failed, startup aborted");
            logger.error(err);
            process.exit(-20);
        })
    })
    .catch((error) => {
        logger.error(error);
        process.exit(-21);
    })

});

process.on('SIGINT', () => {
    logger.log("Ctrl+C Detected. CITAUTH-API is saying goodbye to CITAUTH-SYS...");
    syscon.bye()
    .then((result) => {
        if(result) {
            logger.log("CITAUTH-API has received bye from CITAUTH-SYS.");
            process.exit(0);
        }
        else {
            logger.log("CITAUTH-API didn't receive anything from CITAUTH-SYS.");
            process.exit(-1);
        }
    })
    .catch((err) => {
        logger.error("CITAUTH-API didn't receive anything from CITAUTH-SYS.");
        process.exit(-2);
    });
})

function checkScope(method, attribute) {
    let result = false;
    if(attribute == "admin") return true;
    switch(method) {
        case "authenticate":
            result = attribute == 'plugin';
            break;
        case "register":
            result = attribute == 'frontend';
            break;
        case "delete":
            result = attribute == 'frontend';
            break;
        case "preregister":
            result = attribute == 'frontend';
            break;
        default:
            result = false;
            break;
    }

    return result;
}