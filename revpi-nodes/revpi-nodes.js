/* node-red-contrib-revpi-nodes
 *
 * Copyright (C) 2019 erminas GmbH
 *
 * This file is subject to the terms and conditions defined in
 * file 'LICENSE.txt', which is part of this source code package.
 */
 
var websockets = {};
var socketClass = require("./libs/socket.js");
var fs = require('fs');

var log = function (msg) {
	if (console) {
		console.log.apply(console, [].slice.call(arguments));
	}
};

function createWebsocket(config, callback) {
    var url = "wss://" + config.host + ":" + config.port;
	
	//Remove potential old websocket on same url
    //removeWebsocket(config);
	
	var socket = new socketClass(url, config);
	socket.connect(callback);
    websockets[url] = {
		config: config,
		socket: socket
		};
    return socket;
}

function createTmpWebsocket(config, callback) {
    var url = "wss://" + config.host + ":" + config.port;
	var socket = new socketClass(url, config);
    socket.connect(callback);
    return socket;
}

function removeWebsocket(config) {
	var url = "wss://" + config.host + ":" + config.port;
    if (websockets[url]) {
		websockets[url].socket.kill();
		delete websockets[url];
    }
}

function removeTmpWebsocket(socket) {
    if (socket) {
		socket.kill();
    }
}

module.exports = function (RED) {
    function RevpiServer(config) {
        RED.nodes.createNode(this, config, undefined);
        this.host = config.host;
        this.port = config.port;
		
		this.socketConfig={
			host: config.host,
			port: config.port,
			user: config.user ? config.user : "",
			password: config.password ? config.password : "",
			rejectUnauthorized: config.rejectUnauthorized ? config.rejectUnauthorized : false,
			ca: config.ca || "" 
		}
		
        this.socket = createWebsocket(this.socketConfig,function () {});
		
        var node = this;

		if(config.ca && !fs.existsSync(config.ca)){
			node.error("CA certificate with path "+config.ca+" not found!");
		}
		
        this.on("close", function (removed, done) {
            removeWebsocket(node.socketConfig);
			this.socket.kill(done);
        });

    }

    RED.nodes.registerType("revpi-server", RevpiServer);

    function RevpiSingleInput(config) {
        RED.nodes.createNode(this, config, undefined);
        this.server = RED.nodes.getNode(config.server);
        this.inputpin = config.inputpin;

        if (this.server) {
			this.server.socket.registerInput(this);
            var node = this;
			
			if(this.server.loggedIn === true){
				
				this.server.socket.sendCommand("getpin", function (msg) {
					data = JSON.parse(msg);
			
					if (data !== false)
					{
						var pin = data.name, value = data.value, error = data.error;
							
						if (error === "ERROR_AUTH"){
							node.status(node.getStatusObject("error", "NOT AUTHORIZED"));
						}else if (error === "ERROR_UNKNOWN"){
							node.status(node.getStatusObject("error", "UNKNOWN ERROR"));
						}else if (error === "ERROR_PIN") {
							node.status(node.getStatusObject("error", "UNKNOWN PIN: " + pin + "!"));
						}else{
							node.send({payload: value, topic: "revpi/single/"+pin});
						}
							
						
					}
				}, [this.inputpin]);
			}
        }
    }

    RED.nodes.registerType("revpi-single-input", RevpiSingleInput);

    function RevpiMultipleInput(config) {
        RED.nodes.createNode(this, config, undefined);
        this.server = RED.nodes.getNode(config.server);
        this.inputpin = config.inputpin;
        if (this.server) {
            this.server.socket.registerMultiInput(this);

            var node = this, promises = [];
			
			
			if(this.server.loggedIn === true){
				var pinNames = this.inputpin.split(" ").forEach(pinName => {
					promises.push(new Promise((resolve, reject) => {
						this.server.socket.sendCommand("getpin", function (msg) {
							data = JSON.parse(msg);
					
							if (data !== false)
							{
								var pin = data.name, value = data.value, error = data.error;
									
								if (error === "ERROR_AUTH"){
									reject("NOT AUTHORIZED");
								}else if (error === "ERROR_UNKNOWN") {
									reject("UNKNOWN ERROR");
								}else if(error === "ERROR_PIN"){
									reject("UNKNOWN PIN: " + pin + "!");
								}else{
									resolve(data);
								}
							}
								
						}, [pinName]);
					}));
				});
				
				Promise.all(promises).then(values => {
					var payloadJSONObj = {};
					values.forEach(valPair => {
						payloadJSONObj[valPair.name] = valPair.value;
					});
					node.send({payload: payloadJSONObj, topic: "revpi/multi"});
				}).catch(msg => {
					node.status(node.getStatusObject("error", msg));
				});
			}
        }
    }

    RED.nodes.registerType("revpi-multiple-input", RevpiMultipleInput);

    function RevpiGetpin(config) {
        RED.nodes.createNode(this, config, undefined);
        this.server = RED.nodes.getNode(config.server);
        this.inputpin = config.inputpin;
        this.getoverwritevalue = config.getoverwritevalue;

        if (this.server) {
            this.server.socket.registerGetpin(this);
			
			this.loggedIn = this.server.loggedIn;
        }

        this.on("input", function (msg) {
            var pinName = this.getoverwritevalue ? msg.payload : this.inputpin, node = this;
			
            if (this.server && pinName != null) {
				this.server.socket.sendCommand("getpin", function (msg) {
					data = JSON.parse(msg);
			
					if (data !== false)
					{
						var pin = data.name, value = data.value, error = data.error;
							
						if (error === "ERROR_AUTH"){
							node.status(node.getStatusObject("error", "ERROR: NO CONNECTION"));
						}else if (error === "ERROR_UNKNOWN") {
							node.status(node.getStatusObject("error", "UNKNOWN ERROR"));
						}else if (error === "ERROR_PIN") {
							node.status(node.getStatusObject("error", "UNKNOWN PIN: " + pin + "!"));
						} else {
							node.status(node.getStatusObject("info", "Connected - " + pin + " is " + value));
							node.send({payload: value, topic: "revpi/single/"+pin});
							
						}
						
					}
				}, [pinName]);
			}
        })
    }

    RED.nodes.registerType("revpi-getpin", RevpiGetpin);

    function RevpiOutput(config) {
        RED.nodes.createNode(this, config, undefined);
        this.server = RED.nodes.getNode(config.server);
        this.outputpin = config.outputpin;
        this.outputvalue = config.outputvalue;
        this.overwritevalue = config.overwritevalue;

        if (this.server) {
            this.server.socket.registerOutput(this);
        }

        this.on("input", function (msg) {
            var val = this.overwritevalue ? this.outputvalue : msg.payload;
            var node = this;
			
			
            if (this.server && val !== null && typeof (val) !== "object") {
                this.server.socket.sendCommand("output", function (msgAdditional) {
					data = JSON.parse(msgAdditional);
			
					if (data !== false)
					{
						var pin = data.name;
						if (data.error === "ERROR_AUTH" || data.error === "ERROR_UNKNOWN") {
							node.status(node.getStatusObject("error", "ERROR: NO CONNECTION"));
						}else if (data.error === "ERROR_PIN") {
							node.status(node.getStatusObject("error", "UNKNOWN PIN: " + pin + "!"));
						} else {
							node.status(node.getStatusObject("info", "Change - " + node.outputpin + " is " + val));
						}
					}
					
                }, [this.outputpin, val]);
            }
        });
    }

    RED.nodes.registerType("revpi-output", RevpiOutput);


    RED.httpAdmin.post("/revpi-server-list-pins/", RED.auth.needsPermission("revpi-server.read"), function (req, res) {
        var result = res;
		
		if (req.body.host && req.body.port && (req.body.host + "").length > 1) {
			
			var socketConfig={
				host: req.body.host,
				port: req.body.port,
				user: req.body.user,
				password: req.body.password,
				rejectUnauthorized: JSON.parse(req.body.rejectUnauthorized)
			}
			
			if(req.body.ca){
				socketConfig.ca = req.body.ca;
			}

			var tmp_socket = createTmpWebsocket(socketConfig,function () {

				if(tmp_socket.isAuthorized()){
					tmp_socket.sendCommand("list", function (res) {	
						result.json(res);
						removeTmpWebsocket(tmp_socket);
					}, [req.body.force_update]);
				}else{
					result.json(false);
					removeTmpWebsocket(tmp_socket);
				}
				
			});

			

        } else {
            result.json(false);
        }
    });
}
