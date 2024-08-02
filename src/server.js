const express = require("express");
const app = express();
const configfile = require("config");

const apiport = configfile.config.apiport;
const sysport = configfile.config.sysport;
const syshost = configfile.config.syshost;
const logpath = configfile.config.logpath;

const pattern = new RegExp(configfile.config.pattern);

const SysConnection = require('./modules/SysConnection.js');
const Logger = require('./modules/Logger.js')
let status = false;
let syscon = null;
let logger = null;

app.use(express.json());

app.get('/', (req, res) => {
    res.status(200).send("CITAUTH API SERVER");
});

//authenticate user
app.get('/api/user', (req, res) => {

    if(!status) {
        res.status(503).send();
        return;
    }

    if(req.body.uuid == undefined) {
        res.status(400).send("uuid required");
        return;
    }

    syscon.authenticate(req.body.uuid)
    .then((result) => {
        if(result) {
            logger.log("AUTHENTICATE_SUCCEEDED, NOEMAIL, "+uuid);
            res.status(200).send();
        }
        else {
            logger.log("AUTHENTICATE_FAILED, NOEMAIL, "+uuid);
            res.status(404).send();
        }
    })
    .catch((err) => {
        res.status(500).send(err);
        
    });

});

//register user
app.post('/api/user', (req, res) => {
    if(!status) {
        res.status(503).send();
        return;
    }
    if(req.body.email == undefined) {
        logger.log("Failed to register:");
        res.status(400).send('email required');
        return;
    }

    if(req.body.uuid == undefined) {
        res.status(400).send('uuid required');
        return;
    }
    const uuid = req.body.uuid;
    const email = req.body.email;
    if(uuid.length != 32) {
        res.status(400).send('wrong length of uuid');
        return;
    }
    else if(email.match(pattern) == null) {
        res.status(403).send('this address are not allowed to register');
        return;
    }

    syscon.register(email, uuid)
    .then((result) => {
        if(result) {
            logger.log("REGISTER_SUCCEEDED, "+email+", "+uuid);
            console.log(email, uuid, "succeeded")
            res.status(200).send();
        }
        else {
            logger.log("REGISTER_FAILED, "+email+", "+uuid);
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
    if(!status) {
        res.status(503).send();
        return;
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
    if(!status) {
        res.status(503).send();
        return;
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
                logger.log("CITAUTH-API-SERVER is now listening at: ", apiport);
            }
            else {
                logger.error("CITAUTH-SYS didn't return anything, connection failed.");
            }
        })
        .catch((err) => {
            logger.error("Couldn't establish connection to CITAUTH-SYS, startup aborted!");
            logger.error(err);
            process.exit(-20);
        })
        
    })

});

process.on('SIGINT', () => {
    logger.log("\nCtrl+C Detected. CITAUTH-API is saying goodbye to CITAUTH-SYS...");
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