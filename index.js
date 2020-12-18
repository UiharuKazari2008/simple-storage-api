const express = require("express");
const app = express()
const http = require('http').createServer(app).listen(8080);
const storageHandler = require('node-persist');


const storage = storageHandler.create({
    dir: 'data',
    stringify: JSON.stringify,
    parse: JSON.parse,
    encoding: 'utf8',
    logging: false,
    ttl: false,
    expiredInterval: 2 * 60 * 1000, // every 2 minutes the process will clean-up the expired cache
    forgiveParseErrors: false
});
storage.init(function (err) {
    if (err) {
        console.error("Failed to initialize the Local parameters storage")
    } else {
        console.log("Initialized successfully the Local parameters storage")
    }
});

app.use(express.json({limit: '5mb'}));
app.use(express.urlencoded({extended : true, limit: '5mb'}));
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, X-WSS-Key, X-API-Key, X-User-Agent, User-Agent");
    next();
});
app.get('/', function (req, res, next) {
    res.status(200).send('<b>Lizumi Storage API v1.2</b>')
});
app.get("/get", function(req, res, next) {
    if (req.query.item !== undefined && req.query.item !== "") {
        storage.getItem(req.query.item)
            .then(function (results) {
                if (results && results !== "undefined" && results !== "") {
                    res.status(200).send(results)
                    console.log(`Request: "${req.query.item}" = "${results}"`)
                } else {
                    res.status(404).send('NOT_FOUND')
                    console.error(`Request Error: "${req.query.item}" does not exist yet`)
                }
            })
            .catch(function (err) {
                res.status(500).send()
                console.error(`Request Error: "${req.query.item}"`)
                console.error(err)
            })
    } else {
        res.status(500).send('INVALID_REQUEST')
        console.error(`Request Error missing query!`)
    }
});
app.get("/set", function (req, res, next) {
    if (req.query.item !== undefined && req.query.value !== undefined && req.query.item !== "" && req.query.value !== "") {
        storage.setItem(req.query.item, req.query.value)
            .then(function (results) {
                if (results && results.content.value === req.query.value ) {
                    res.status(200).send('OK')
                    console.log(`Save: "${results.content.key}" = "${results.content.value}"`)
                } else {
                    res.status(500).send('SAVE_FAILED')
                    console.error(`Save Error: "${req.query.item}" did not save correctly`)
                }
            })
            .catch(function (err) {
                res.status(500).send()
                console.error(`Save Error: "${req.query.item}" = "${req.query.value}"`)
                console.error(err)
            })
    } else {
        res.status(500).send('INVALID_REQUEST')
        console.error(`Save Error missing query or value!`)
    }
})

process.on('uncaughtException', function(err) {
    console.error(err)
    process.exit(1)
});

console.log("Lizumi Storage API!")
