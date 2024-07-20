const express = require("express");
const app = express();
const configfile = require("config");

const apiport = configfile.config.apiport;
const sysport = configfile.config.sysport;
const syshost = configfile.config.syshost;

const pattern = configfile.config.pattern;

let status = false;

app.use(express.urlencoded({extended: true}));

app.get('/', (req, res) => {
    res.status(200).send("CITAUTH API SERVER");
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
    console.log("Developed by mam1zu(mam1zu.piyo@gmail.com)");
    console.log("This API server is under construction");

    console.log("CITAUTH-API-SERVER is now listening at: ", apiport);
    status = true;

})