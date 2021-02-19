/* node-red-contrib-revpi-nodes
 *
 * Copyright (C) 2019 erminas GmbH
 *
 * This file is subject to the terms and conditions defined in
 * file 'LICENSE.txt', which is part of this source code package.
 */

var WebSocket = require("ws");
var pjson = require('./../../package.json');
var fs = require('fs');

module.exports = function (url, config) {
    var log = function (msg) {
        if (console) {
            console.log.apply(console, [].slice.call(arguments));
        }
    };
	
    var options = {
        url: url || "wss://localhost:8000",
		user: config.user,
		password: config.password,
        rejectUnauthorized: config.rejectUnauthorized,
        canReconnect: true
    };
	
	if(config.rejectUnauthorized && config.ca){
		try {
			options.ca = fs.readFileSync(config.ca);
		} catch (err) {
			log("ERROR", "Error reading CA certificate with path "+config.ca+"!");
			options.ca = null;
		}
	}

	var protocols = {rejectUnauthorized: options.rejectUnauthorized};
	
	if(options.ca){
		protocols.ca=options.ca;
	}

    var connection = new WebSocket(options.url,protocols, undefined);
    var connected = false;
	
	const loginStates = {"ERROR_AUTH":0,"SUCCESS_AUTH":1, "ERROR_UNSUPPORTED_VERSION":2};
	Object.freeze(loginStates);
	var loginStatus = loginStates.ERROR_AUTH;
	
    var reconnectAttempts = 0;
    var sendCommandPool = []; // Commands are stored as long as the connection is not established.
    var commandList = ["login","commands", "list", "output", "getpin"];
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
			data = JSON.parse(msg);
            
			if (data !== false)
			{
				if (data.error !== "ERROR_AUTH" && data.error !== "ERROR_UNKNOWN" ) {
					var pin = data.name, value = data.value, id;
					for (id in inputNodes) {
						if (!inputNodes.hasOwnProperty(id)) continue;

						if (inputNodes[id].inputpin === pin){ 
							var setTopic = (inputNodes[id].topic == null || inputNodes[id].topic == "") ? "revpi/single/"+pin : inputNodes[id].topic;
						
							inputNodes[id].send({payload: value, topic: setTopic});
							inputNodes[id].status(getStatusObject("info", "Change - " + pin + " is " + value))
						}
					}
					for (id in multiInputNodes) {
						if (!multiInputNodes.hasOwnProperty(id)) continue;

						var pins = multiInputNodes[id].inputpin.split(" "), promises = [];
						if (pins.indexOf(pin) !== -1) {
							promises.push(Promise.resolve(multiInputNodes[id]));
							promises.push(Promise.resolve(data));

							pins = pins.filter(a => a !== pin).forEach(otherPin => {
								promises.push(new Promise((resolve, reject) => {
									sendCommandMethod("getpin", function (msgAdditional) {
										dataAdditional = JSON.parse(msgAdditional);
											
										if (dataAdditional !== false)
										{
											var pinAdditional = dataAdditional.name, valueAdditional = dataAdditional.value, error = dataAdditional.error;
											
											if (error === "ERROR_AUTH"){
												reject([otherPin, "NOT AUTHORIZED"]);
											}else if (error === "ERROR_UNKNOWN"){
												reject([otherPin, "UNKNOWN ERROR"]);
											}else if (error === "ERROR_PIN") {
												reject([otherPin, "UNKNOWN PIN: " + pinAdditional + "!"]);
											}else{
												resolve(dataAdditional);
											}
										}
									}, [otherPin]);
								}));
							});

							Promise.all(promises).then(values => {
								var node = values.shift();
								var payloadJSONObj = {};
								values.forEach(valPair => {
									payloadJSONObj[valPair.name] = valPair.value;
								});
								
								var setTopic = (node.topic == null || node.topic == "") ? "revpi/multi" : node.topic;
								
								node.send({payload: payloadJSONObj, topic: setTopic});
								node.status(getStatusObject("info", "Received value(s)"))
							}).catch((msg) => {
								for (id in inputNodes) {
									if (!inputNodes.hasOwnProperty(id)) continue;

									if (inputNodes[id].inputpin === msg[0]){ 
										inputNodes[id].status(getStatusObject("error", msg[1]));
									}
								}
							});
						}
					}
				}
			}
        }]
    };
    var ioList = null;

    function reconnect() {
		if(options["canReconnect"]){
			isReconnect = true;
			if (connected === false) {
				if (reconnectAttempts < 10) {
					reconnectAttempts++;
					log("Try to reconnect - Attempt: " + reconnectAttempts);
					
					var protocols = {rejectUnauthorized: options.rejectUnauthorized};
					
					if(options.ca){
						protocols.ca=options.ca;
					}
					
					connection = new WebSocket(options.url, protocols, undefined);
					connectToServer.call(this);
					isReconnect = false;
				} else {
					log("Stopped reconnecting. Max Reconnections reached!");
				}
			} else {
				reconnectAttempts = 0;
			}
		}
    }

    var connectToServer = function (cb) {
        log("Connecting to WS Server " + url);
        var that = this;
		
        connection.addEventListener("error", function (ErrorEvent) {
            var me = that;
            log("ERROR", "Connection to server error: " +ErrorEvent.message);
			
			if(cb){
				cb();
			}
        });
		
        connection.addEventListener("open", function () {
            connected = true;
            log("Connection to WS Server established!");
            reconnectAttempts = 0;
            isReconnect = false;

            var list = sendCommandPool;
            sendCommandPool = {};
            for (var command in list) {
				
                for (var i = 0, l = list[command].length; i < l; ++i) {
                    sendCommandStorage[command].push(list[command][i]);
                }
                connection.send(command, undefined, undefined);
            }
			
			sendCommandMethod("login", function (msg) {
				data = JSON.parse(msg);
            
				if (data !== false)
				{
					if (data.error === "ERROR_AUTH") {
						log("error", "Error not authorized by server!");
						loginStatus=loginStates.ERROR_AUTH;
					    setAllNodesStatusMethod("error", "NOT AUTHORIZED");
					}else if(data.error === "ERROR_UNSUPPORTED_VERSION") {
						log("info", "Unsupported server version!");
						loginStatus=loginStates.ERROR_UNSUPPORTED_VERSION;
						setAllNodesStatusMethod("error", "UNSUPPORTED SERVER");
					}else{
						log("info", "Authorized by server!");
						loginStatus=loginStates.SUCCESS_AUTH;
                        setAllNodesStatusMethod("success", "Connected");
					}
				}
				
				if(cb){
					cb();
				}
			}, [pjson.version,options.user,options.password,options.ca]);
			
        });

        connection.addEventListener("message", function (data) {
            var msg = data.data;
            var msgSplit = msg.split(";");
            var fullCommand = msgSplit.shift();
			
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
            connected = false;
            log("Lost connection to WS Server!");

			setAllNodesStatusMethod("error", "Disconnected");
			
			var me = that;
            if (isReconnect === false && options["canReconnect"]) {
                setTimeout(function () {
                    reconnect.call(me);
                }, 5000);
            }
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

    this.connect = function (cb) {
        if (connected === false) {
            connectToServer.call(this,cb);
        }
        return this;
    };

    this.isConnected = function () {
        return connected;
    };
	
	this.isAuthorized = function () {
        return loginStatus === loginStates.SUCCESS_AUTH;
    };
	
	this.isUnsupportedServer = function () {
        return loginStatus === loginStates.ERROR_UNSUPPORTED_VERSION;
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
	
	this.setAllNodesStatus = setAllNodesStatusMethod = function (status, text) {
		[].concat(
			Object.values(multiInputNodes),
			Object.values(inputNodes),
			Object.values(getpinNodes),
			Object.values(outputNodes)
		).forEach((node) => {
			node.status(getStatusObject(status, text));
		});
	};

    this.kill = killMethod = function (done) {
		options["canReconnect"] = false;
        connection.onclose = function () {}; // disable onclose handler first
        connection.close(undefined, undefined);
        if (done) {
            setTimeout(done, 1);
        }
    };

};
