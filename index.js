const args = process.argv.slice(2);
const config = require('./config.json')
if ( !isNaN(parseInt(config["http-port"].toString())) && parseInt(config["http-port"].toString()) > 0 && !isNaN(parseInt(config["tls-port"].toString())) && parseInt(config["tls-port"].toString()) > 0 ) {
    const fs = require('fs');
    const storageHandler = require('node-persist');
    const express = require("express");
    const request = require('request').defaults({ encoding: null });
    const app = express()
    const http = require('http').createServer(app).listen(parseInt(config["http-port"].toString()));
    const https = require('https').createServer({
        key: fs.readFileSync(config["tls-key"].toString()), cert: fs.readFileSync(config["tls-cert"].toString())
    }, app).listen(parseInt(config["tls-port"].toString()));

    const storage = storageHandler.create({
        dir: config["data-dir"].toString(),
        stringify: JSON.stringify,
        parse: JSON.parse,
        encoding: 'utf8',
        logging: false,
        ttl: false,
        expiredInterval: 2 * 60 * 1000, // every 2 minutes the process will clean-up the expired cache
        forgiveParseErrors: true
    });
    storage.init().then(function (res) {
        console.log("Initialized successfully the Local parameters storage @ " + res.dir)
        storage.keys()
            .then(function (keys) {
                console.log("Values in storage:")
                keys.forEach(function (key) {
                    storage.get(key)
                        .then(function (value) {
                            console.log(`"${key}" = "${value}"`)
                        })
                        .catch(function (err) {
                            console.error(`Could not read ${key}'s value!`)
                        })
                })
            })
    });

    app.use(express.json({limit: '5mb'}));
    app.use(express.urlencoded({extended : true, limit: '5mb'}));
    app.use(function(req, res, next) {
        res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, X-WSS-Key, X-API-Key, X-User-Agent, User-Agent");
        next();
    });
    app.get('/', function (req, res) {
        res.status(200).send('<b>Lizumi Storage API v1.2</b>')
    });
    app.get("/get", function(req, res) {
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
    app.get("/all", function(req, res) {
        storage.keys()
            .then(function (keys) {
                if (keys.length === 0) {
                    res.status(404).send('EMPTY')
                    console.error(`Request Error: There are no items in storage`)
                } else {
                    let results = []
                    keys.forEach(function (key, index) {
                        storage.get(key)
                            .then(function (value) {
                                results.push({key: key, value: value})
                                if (index === keys.length - 1) {
                                    res.status(200).send(results)
                                    console.log(results)
                                }
                            })
                            .catch(function (err) {
                                console.error(`Could not read ${key}'s value!`)
                            })
                    })
                }
            })
            .catch(function (err) {
                res.status(500).send()
                console.error(`Request Error:`)
                console.error(err)
            })

    });
    app.get("/set", function (req, res) {
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
    app.get("/del", function (req, res) {
        if (req.query.item !== undefined && req.query.item !== "") {
            storage.removeItem(req.query.item)
                .then(function (results) {
                    if (results && results.removed) {
                        res.status(200).send('OK')
                        console.log(results)
                    } else if (results && results.existed === false) {
                        res.status(200).send('OK')
                        console.log(results)
                    } else {
                        res.status(500).send('DELETE_FAILED')
                        console.error(`Delete Error: "${req.query.item}" was not removed`)
                    }
                })
                .catch(function (err) {
                    res.status(500).send()
                    console.error(`Delete Error: "${req.query.item}" = "${req.query.value}"`)
                    console.error(err)
                })
        } else {
            res.status(500).send('INVALID_REQUEST')
            console.error(`Delete Error missing query!`)
        }
    })
    app.get("/cet", function (req, res) {
        if (req.query.item !== undefined && req.query.value !== undefined && req.query.item !== "" && req.query.value !== "" ) {
            storage.setItem(req.query.item, req.query.value)
                .then(function (results) {
                    if (results && results.content.value === req.query.value ) {
                        res.status(200).send('OK')
                        console.log(`Save: "${results.content.key}" = "${results.content.value}"`)
                        if (req.query.opt !== undefined && req.query.opt !== "" && config["call-urls"][parseInt(req.query.opt.toString())] !== undefined && config["call-urls"][parseInt(req.query.opt.toString())] !== "" ) {
                            request({
                                url: config["call-urls"][parseInt(req.query.opt.toString())].toString(),
                                method: 'GET',
                                timeout: 5000
                            }, function (error, response, body) {
                                if (!error && response.statusCode === 200) {
                                    console.log(`Call: "${config["call-urls"][parseInt(req.query.opt.toString())].toString()}" = "${body}"`)
                                } else {
                                    console.error(`Failed Call: "${config["call-urls"][parseInt(req.query.opt.toString())].toString()}" = "${body}"`)
                                }
                            })
                        } else {
                            console.error(`Failed Call: Unable to process the requested option`)
                        }
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

    console.log("Lizumi Storage API is ready baby!")
} else {
    console.error("CAN NOT START INVALID LISTEN PORT")
}

