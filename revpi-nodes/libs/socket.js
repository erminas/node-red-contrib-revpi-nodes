/* node-red-contrib-revpi-nodes
 *
 * Copyright (C) 2019 erminas GmbH
 *
 * This file is subject to the terms and conditions defined in
 * file 'LICENSE.txt', which is part of this source code package.
 */

var WebSocket = require("ws");

module.exports = function (url) {
    var options = {
        url: url || "ws://localhost:8000",
        canReconnect: true
    };
    var log = function (msg) {
        if (console) {
            console.log.apply(console, [].slice.call(arguments));
        }
    };

    var connection = new WebSocket(options.url, undefined, undefined);
    var connected = false;
    var clientClose = false;
    var reconnectAttempts = 0;
    var sendCommandPool = []; // Commands are stored as long as the connection is not established.
    var commandList = ["commands", "list", "output", "getpin"];
    var isReconnect = false;
    var inputNodes = {};
	var multiInputNodes = {};
    var getpinNodes = {};
    var outputNodes = {};

    var sendCommandMethod = null;

    var getStatusObject = function (status, text) {
        var statusObject = null;
        switch (status) {
            case "success":
                statusObject = {fill: "green", shape: "ring", text: (text || "")};
                break;
            case "error":
                statusObject = {fill: "red", shape: "ring", text: (text || "")};
                break;
            case "info":
            default:
                statusObject = {fill: "blue", shape: "dot", text: (text || "")};
        }
        return statusObject;
    };

    // input command is allways there to communicate the input back to nodered
    var sendCommandStorage = {
        "input": [function (msg) {
            msg = msg.split(",");
            var pin = msg[0], value = msg[1], id;
            for (id in inputNodes) {
                if (!inputNodes.hasOwnProperty(id)) continue;

                if (inputNodes[id].inputpin.includes(pin)) {
                    inputNodes[id].send({payload: value});
                    inputNodes[id].status(getStatusObject("info", "Changed " + pin + " to " + value))
                }
            }
            for (id in multiInputNodes) {
                if (!multiInputNodes.hasOwnProperty(id)) continue;

                var pins = multiInputNodes[id].inputpin.split(","), promises = [];
                if (pins.indexOf(pin) !== -1) {
                    promises.push(Promise.resolve(multiInputNodes[id]));
                    promises.push(Promise.resolve([pin, value]));

                    pins = pins.filter(a => a !== pin).forEach(otherPin => {
                        promises.push(new Promise((resolve, reject) => {
                            sendCommandMethod("getpin", function (msgAdditional) {
                                msgAdditional = msgAdditional.split(",")
                                if (msgAdditional[1] !== "ERROR_UNKNOWN") {
                                    resolve(msgAdditional);
                                } else {
                                    reject(otherPin);
                                }
                            }, [otherPin]);
                        }));
                    });

                    Promise.all(promises).then(values => {
                        var node = values.shift();
                        var payloadJSONObj = {};
                        values.forEach(valPair => {
                            payloadJSONObj[valPair[0]] = valPair[1];
                        });
                        node.send({payload: payloadJSONObj});
                        node.status(getStatusObject("info", "Received value(s)"))
                    }).catch((pin) => {
                        node.status(getStatusObject("error", "UNKNOWN PIN: " + pin + "!"));
                    });
                }
            }
        }]
    };
    var ioList = null;

    function reconnect() {
        isReconnect = true;
        if (connected === false) {
            if (reconnectAttempts < 2) {
                reconnectAttempts++;
                log("Try to reconnect - Attempt: " + reconnectAttempts);
                connection = new WebSocket(options.url, undefined, undefined);
                connectToServer.call(this);
                isReconnect = false;
            } else {
                log("Stopped reconnecting. Max Reconnections reached!");
            }
        } else {
            reconnectAttempts = 0;
        }
    }

    var connectToServer = function () {
        log("Connecting to WS Server " + url);
        var that = this;
        connection.addEventListener("error", function (ErrorEvent) {
            var me = that;
            log("ERROR", ErrorEvent.message);
            if (isReconnect === false && options["canReconnect"]) {
                setTimeout(function () {
                    reconnect.call(me);
                }, 1000);
            }
        });
        connection.addEventListener("open", function () {
            connected = true;
            log("Connection to WS Server established!");
            reconnectAttempts = 0;
            isReconnect = false;

            [].concat(
                Object.values(multiInputNodes),
                Object.values(inputNodes),
                Object.values(getpinNodes),
                Object.values(outputNodes)
            ).forEach((node) => {
                node.status(getStatusObject("success", "Connected"));
            });

            /*var id;
            for (id in multiInputNodes) {
                if (!multiInputNodes.hasOwnProperty(id)) continue;
                multiInputNodes[id].status(getStatusObject("success", "connected"));
            }

            for (id in inputNodes) {
                if (!inputNodes.hasOwnProperty(id)) continue;
                inputNodes[id].status(getStatusObject("success", "connected"));
            }

            for (id in getpinNodes) {
                if (!getpinNodes.hasOwnProperty(id)) continue;
                getpinNodes[id].status(getStatusObject("success", "connected"));
            }

            for (id in outputNodes) {
                if (!outputNodes.hasOwnProperty(id)) continue;
                outputNodes[id].status(getStatusObject("success", "connected"));
            }*/

            var list = sendCommandPool;
            sendCommandPool = {};
            for (var command in list) {
                log("Get Command: " + command);
                for (var i = 0, l = list[command].length; i < l; ++i) {
                    sendCommandStorage[command].push(list[command][i]);
                }
                connection.send(command, undefined, undefined);
            }
        });

        connection.addEventListener("message", function (data) {
            var msg = data.data;
            var msgSplit = msg.split(";");
            var fullCommand = msgSplit.shift();
            //var command = fullCommand.split("#");
            // var args = command[1];
            //command = command[0];
            var newMsg = msgSplit.join(";");
            if (sendCommandStorage[fullCommand]) {
                sendCommandStorage[fullCommand].forEach((callBack) => {
                    callBack.apply({}, (newMsg + "#" + fullCommand).split("#"));
                })
                /*for (var i in sendCommandStorage[fullCommand]) {
                    sendCommandStorage[fullCommand][i](newMsg, command, args);
                }*/
                if (fullCommand !== "input") {
                    sendCommandStorage[fullCommand] = [];
                }
            }
        });

        connection.addEventListener("close", function () {
            isReconnect = false;
            connected = false;
            log("Closed connection to WS Server!");

            [].concat(
                Object.values(multiInputNodes),
                Object.values(inputNodes),
                Object.values(getpinNodes),
                Object.values(outputNodes)
            ).forEach((node) => {
                node.status(getStatusObject("error", "Disconnected"));
            });

            /*for (var id in multiInputNodes) {
                multiInputNodes[id].status(getStatusObject("error", "Disconnected"));
            }

            for (var id in inputNodes) {
                inputNodes[id].status(getStatusObject("error", "Disconnected"));
            }

            for (var id in getpinNodes) {
                getpinNodes[id].status(getStatusObject("error", "Disconnected"));
            }

            for (var id in outputNodes) {
                outputNodes[id].status(getStatusObject("error", "Disconnected"));
            }*/
        });
    };

    this.sendCommand = sendCommandMethod = function (command, cb, args) {
        if (commandList.indexOf(command) !== -1 || command === "") {
            if (command !== "") {
                command = command + "#" + JSON.stringify(args);
            }
            if (typeof (sendCommandStorage[command]) == "undefined") {
                sendCommandStorage[command] = [];
            }
            if (connected === false) {
                if (typeof (sendCommandPool[command]) === "undefined") {
                    sendCommandPool[command] = [];
                }
                sendCommandPool[command].push(cb);
            } else {
                sendCommandStorage[command].push(cb);
                connection.send(command);
            }
        }
    };

    this.connect = function () {
        if (connected === false) {
            connectToServer.call(this);
        }
        return this;
    };

    this.isConnected = function () {
        return connected;
    };

    this.isOption = function (key) {
        return (typeof (options[key]) != "undefined");
    };

    this.setOption = function (key, val) {
        if (this.isOption(key)) {
            options[key] = val;
            return this;
        }
        log('Unknown Option "' + key + '"');
        return this;
    };
    this.getOption = function (key) {
        if (this.isOption(key)) {
            return options[key];
        }
        log('Unknown Option "' + key + '"');
        return this;
    };

    this.getIOList = function () {
        return ioList;
    };

    this.registerInput = function (node) {
        node.ioList = this.getIOList();
        node.getStatusObject = getStatusObject;
        inputNodes[node.id] = node;
    };

    this.registerMultiInput = function (node) {
        node.ioList = this.getIOList();
        node.getStatusObject = getStatusObject;
        multiInputNodes[node.id] = node;
    };

    this.registerGetpin = function (node) {
        node.ioList = this.getIOList();
        node.getStatusObject = getStatusObject;
        getpinNodes[node.id] = node;
    };

    this.registerOutput = function (node) {
        node.getStatusObject = getStatusObject;
        outputNodes[node.id] = node;
    };

    this.kill = function (done) {
        clientClose = true;
        connection.close(undefined, undefined);
        if (done) {
            setTimeout(done, 1);
        }
    };

};
