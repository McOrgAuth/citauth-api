const express = require("express");
const SysConnection = require('./modules/SysConnection.js');
const app = express();
const configfile = require("config");

const apiport = configfile.config.apiport;
const sysport = configfile.config.sysport;
const syshost = configfile.config.syshost;

const pattern = configfile.config.pattern;

let status = false;
let syscon = null;

app.use(express.urlencoded({extended: true}));

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
        res.status(400).send();
        return;
    }

    syscon.authenticate(req.body.uuid)
    .then((result) => {
        if(result) {
            res.status(200).send();
        }
        else {
            res.status(404).send();
        }
    })
    .catch((err) => {
        res.status(500).send(err);
    });
    
});

//register user
app.post('/api/user', (req, res) => {

});

//delete user
app.delete('/api/user', (req, res) => {

});

//email authentication
app.post('/api/pre', (req, res) => {

});

//check status of api
app.get(('/api/status', (req, res) => {
    
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

    syscon = new SysConnection();

    syscon.init(sysport, syshost)
    .then(() => {
        console.log("Saying hello to CITAUTH-SYS...");
        syscon.hello()
        .then((result) => {
            if(result) {
                console.log("CITAUTH-SYS returned hello to api.")
                syscon.hello_flag = true;
                status = true;
            }
            else {
                console.log("CITAUTH-SYS didn't return anything, connection failed.");
                syscon.hello_flag = false;
                status = false;
            }
        })

        console.log("CITAUTH-API-SERVER is now listening at: ", apiport);
        
    })

})