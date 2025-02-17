const express = require("express");
const app = express();
const configfile = require("config");
const jwt = require('jsonwebtoken');
const cors = require('cors');
const fs = require('fs');

const apiport = configfile.config.apiport;
const sysport = configfile.config.sysport;
const syshost = configfile.config.syshost;
const logpath = configfile.config.logpath;
const pubkeypath  = configfile.config.pubkeypath;
const email_from = "citauth-noreply@citauth.chosuichi.com";

const pattern = new RegExp(configfile.config.pattern);

const SysConnection = require('./modules/SysConnection.js');
const Logger = require('./modules/Logger.js')
const Utils = require('./modules/Utils.js');
const Mailer = require("./modules/Mailer.js");
const pubkey = fs.readFileSync(configfile.config.pubkeypath);
let status = false;
let syscon = null;
let logger = null;
let mailer = null;

app.use(express.json());
app.use(cors({ origin: 'http://192.168.1.5:8080' }));

app.get('/', (req, res) => {

    res.status(200).send("CITAUTH API SERVER");

});

//authenticate user
app.post('/api/auth', (req, res) => {

    const method = 'auth';

    if(!status) {
        return res.status(503).send();
    }

    if(req.headers['authorization'] == undefined) {
        console.log(req.headers['authorization']);
        res.setHeader('WWW-Authenticate','Bearer error="token_required"');
        return res.status(401).json(utils.error_json('token_required'));;
    }

    if(req.headers['authorization'].indexOf('Bearer') == -1) {
        res.setHeader('WWW-Authenticate', 'Bearer error="invalid_access_token"');
        return res.status(401).json(utils.error_json('invalid_access_token'));
    }

    const token = req.headers['authorization'].slice(7);

    let decoded = undefined;

    try {
        decoded = jwt.verify(token, pubkey);
    } catch (err) {
        if(err.message=="jwt expired") {
            logger.log("got_expired_token: "+token);
            res.setHeader('WWW-Authenticate', 'Bearer realm="expired_access_token"');
            return res.status(401).send('expired_access_token');
        }
        else {
            logger.warn("got_invalid_token:" +token);
            res.setHeader('WWW-Authenticate', 'Bearer error="invalid_access_token"');
            return res.status(401).send('invalid_access_token');
        }
    }
    /*
    if(!checkScope(method, decoded.scp)) {
        res.setHeader('WWW-Authenticate', 'Bearer error=""');
        return res.status(403).send();
    }
    */

    if(req.body.uuid == undefined) {
        console.log("no uuid");
        return res.status(400).send("uuid_required");
    }

    console.log(req.body.uuid);

    const uuid = req.body.uuid;

    if(uuid.length != 32) {
        return res.status(400).send("wrong_length_of_uuid");
    }

    syscon.authenticate(req.body.uuid)
    .then((result) => {
        if(result.status == 1) {
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
app.post('/api/register', (req, res) => {

    const method = 'register';

    if(!status) {
        return res.status(503).send();
    }

    console.log(req.headers);
    console.log(req.body);

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
        if(err.message=="jwt expired") {
            logger.log("got_expired_token: "+token);
            res.setHeader('WWW-Authenticate', 'Bearer realm="expired_access_token"');
            return res.status(401).send('expired_access_token');
        }
        else {
            logger.warn("got_invalid_token:" +token);
            res.setHeader('WWW-Authenticate', 'Bearer error="invalid_access_token"');
            return res.status(401).send('invalid_access_token');
        }
    }

    if(req.body.preregid == undefined) {
        return res.status(400).send('preregid_required');
    }

    const preregid = req.body.preregid;

    syscon.register(preregid)
    .then((result) => {
        if(result.status == 1) {
            logger.log("REGISTER_SUCCEEDED, "+result.email+", "+result.uuid+", "+preregid);
            console.log(result.email, result.uuid, preregid, "succeeded");
            res.status(200).send();
        }
        else {
            logger.log("REGISTER_FAILED, "+result.email+", "+result.uuid+", "+result.preregid);
            res.status(400).send();
        }
    })
    .catch((err) => {
        console.log(err);
        res.status(500).send(err);
    });

});

app.delete('/api/predelete', (req, res) => {
    
    const method = 'predelete';

    if(!status) {
        return res.status(503).send();
    }

    console.log(req.headers);

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
        if(err.message == "jwt expired") {
            logger.log("got_expired_token: "+token);
            res.setHeader('WWW-Authenticate', 'Bearer realm="expired_access_token"');
            return res.status(401).send('expired_access_token');
        }
        else {
            logger.warn("got_invalid_token:" +token);
            res.setHeader('WWW-Authenticate', 'Bearer error="invalid_access_token"');
            return res.status(401).send('invalid_access_token');
        }
    }

    if(req.body.email == undefined) {
        return res.status(400).send('email_required');
    }

    const email = req.body.email;

    syscon.predelete(email)
    .then((result) => {
        console.log(result.status);
        if(result.status != 1 || result.status == undefined) {
            logger.log("PREDELETE_FAILED, "+email);
            switch(result.status) {
                case -1:
                    //失敗。ユーザが存在しない。セキュリティ上の理由により200を返す。
                    const mail = mailer.mail_predelete_failed(email_from, email);
                    mailer.send(mail);
                    res.status(200).send("succeeded");
                    break;
                case -100:
                    //例外エラー
                    res.status(500).send("unexpected");
                    break;
                default:
                    res.status(400).send("failed");
                    break;
            }
            return;
        }
        else {
            logger.log("PREDELETE_SUCCEEDED, "+email+", "+result.predelid);
            const mail = mailer.mail_predelete_succeeded(email_from, email, result.predelid);
            mailer.send(mail);
            return res.status(200).send("succeeded");
        }
    })
    .catch((err) => {
        logger.error(err);
        return res.status(500).send(err);
    })




})

//delete user
app.delete('/api/delete', (req, res) => {

    const method = 'delete';

    if(!status) {
        res.status(503).send();
        return;
    }

    console.log(req.headers);

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
        if(err.message=="jwt expired") {
            logger.log("got_expired_token: "+token);
            res.setHeader('WWW-Authenticate', 'Bearer realm="expired_access_token"');
            return res.status(401).send('expired_access_token');
        }
        else {
            logger.warn("got_invalid_token:" +token);
            res.setHeader('WWW-Authenticate', 'Bearer error="invalid_access_token"');
            return res.status(401).send('invalid_access_token');
        }
    }

    if(req.body.predelid == undefined) {
        res.status(400).send('predelid_required');
        return;
    }

    const predelid = req.body.predelid;

    syscon.delete(predelid)
    .then((result) => {
        if(result.status != 1 || result.status == undefined) {
            logger.log("DELETE_FAILED, "+ predelid);
            switch(result.status) {
                case -1:
                    //失敗
                    return res.status(400).send("failed");
                case -2:
                    //データが存在しない
                    return res.status(400).send("notfound");
                    break;
                case -3:
                    //期限切れ
                    return res.status(400).send("expired");
                default:
                    //例外
                    return res.status(500).send("unexpected");
            }
        }
        else {
            logger.log("DELETE_SUCCEEDED, "+predelid);
            return res.status(200).send("succeeded");
        }
    })
    .catch((err) => {
        return res.status(500).send(err);
    })
});

//email authentication
app.post('/api/pre', (req, res) => {

    const method = 'preregister';

    if(!status) {
        res.status(503).send();
        return;
    }

    console.log(req.headers);

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
        if(err.message=="jwt expired") {
            logger.log("got_expired_token: "+token);
            res.setHeader('WWW-Authenticate', 'Bearer realm="expired_access_token"');
            return res.status(401).send('expired_access_token');
        }
        else {
            logger.warn("got_invalid_token:" +token);
            res.setHeader('WWW-Authenticate', 'Bearer error="invalid_access_token"');
            return res.status(401).send('invalid_access_token');
        }
    }

    res.setHeader('WWW-Authenticate', 'Bearer realm="citauth_preregister_user"');

    if(req.body.email == undefined) {
        res.status(400).send('email_required');
        return;
    }

    if(req.body.uuid == undefined) {
        res.status(400).send('uuid_required');
        return;
    }

    const email = req.body.email;
    const uuid = req.body.uuid;

    if(uuid.length != 32) {
        res.status(400).send('invalid_uuid_length');
        return;
    }

    syscon.preregister(email, uuid)
    .then((result) => {
        if(result.status != 1 || result.status == undefined) {
            logger.log("PREREGISTER_FAILED, "+email+", "+uuid);
            switch(result.status) {
                case -2:
                    //失敗。仮登録に失敗した。
                    return res.status(400).send("failed");
                case -3:
                    //失敗。すでに仮登録されている。セキュリティ上の理由により200を返す。
                    const mail = mailer.mail_register_failed(email_from, email);
                    mailer.send(mail);
                    return res.status(200).send("succeeded");
                case -100:
                    //失敗。サーバ側例外エラー。
                    return res.status(500).send("unexpected");
            }
        }
        else {
            logger.log("PREREGISTER_SUCCEEDED, "+email+", "+uuid+', '+ result.preregid);
            const mail = mailer.mail_register_succeeded(email_from, email, result.preregid);
            mailer.send(mail);
            return res.status(200).send("succeeded");
        }
    })
    .catch((err) => {
        logger.error(err);
    })



});

//check status of api
app.get('/api/status', (req, res) => {

    status ? res.status(200).send() : res.status(503).send();

});

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
    console.log("Copyright (c) 2024-2025 mam1zu. All rights reserved.");
    console.log("Developed by mam1zu(mam1zu.piyo@gmail.com)");
    console.log("This system is under construction, please report if you encountered any problem.");
    logger = new Logger(logpath);
    if(logger == null) {
        console.error("Failed to start logging, startup aborted!");
        process.exit(-10);
    }
    utils = new Utils();
    mailer = new Mailer(logger, configfile.config.mail.host, configfile.config.mail.port, configfile.config.mail.user, configfile.config.mail.pass);

    if(configfile.config.debug) {
        logger.warn("Debug-mode.");
        logger.log("Mailer information is as follows:");
        logger.log(mailer);
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