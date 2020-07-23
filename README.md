Official Revolution Pi Nodes
------

This module provides a set of nodes in [Node-RED](https://nodered.org/) to read and write to I/O Pins of your [Revolution Pi](https://revolution.kunbus.de/).

### Example flow

![Missing image: please import example flow directly][flow]

[flow]: https://raw.githubusercontent.com/erminas/node-red-contrib-revpi-nodes/master/revpi-nodes/examples/example_flow.png "RevPi Nodes Example Flow"

[Import](https://nodered.org/docs/user-guide/editor/workspace/import-export) the following example flow:
```
[{"id":"fdfb436c.9a8bc","type":"revpi-single-input","z":"480ecacd.2591f4","server":"3877d616.d189ea","inputpin":"Core_Temperature","x":600,"y":200,"wires":[["69d3f6d0.f5cef8"]]},{"id":"69d3f6d0.f5cef8","type":"debug","z":"480ecacd.2591f4","name":"","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"false","x":910,"y":280,"wires":[]},{"id":"7e6bf28.949a60c","type":"revpi-multiple-input","z":"480ecacd.2591f4","server":"3877d616.d189ea","inputPinList":"Core_Frequency RevPiIOCycle","inputpin":"Core_Frequency RevPiIOCycle","x":560,"y":280,"wires":[["69d3f6d0.f5cef8"]]},{"id":"8d75c3c6.f4049","type":"revpi-output","z":"480ecacd.2591f4","server":"3877d616.d189ea","outputpin":"O_1","overwritevalue":false,"outputvalue":"","x":880,"y":540,"wires":[]},{"id":"d736debb.74978","type":"inject","z":"480ecacd.2591f4","name":"","topic":"","payload":"1","payloadType":"num","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":650,"y":500,"wires":[["8d75c3c6.f4049"]]},{"id":"bb976bc3.ed1fe8","type":"inject","z":"480ecacd.2591f4","name":"","topic":"","payload":"0","payloadType":"num","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":650,"y":600,"wires":[["8d75c3c6.f4049"]]},{"id":"c64c9356.13d41","type":"inject","z":"480ecacd.2591f4","name":"Get I_1","topic":"","payload":"I_1","payloadType":"str","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":370,"y":380,"wires":[["d1408d59.65559"]]},{"id":"d1408d59.65559","type":"revpi-getpin","z":"480ecacd.2591f4","server":"3877d616.d189ea","inputpin":"I_2","getoverwritevalue":true,"x":630,"y":380,"wires":[["69d3f6d0.f5cef8"]]},{"id":"3877d616.d189ea","type":"revpi-server","z":0,"host":"127.0.0.1","port":"8000"}]
```

### Requirements

Install the required backend server: [noderedrevpinodes-server](https://github.com/erminas/noderedrevpinodes-server) .

The server requires  [Raspbian Stretch ](https://revolution.kunbus.de/shop/de/stretch) for correct function.

```
sudo apt-get install noderedrevpinodes-server
```

### Installation (on the RevPi)
Install the nodes via the [node-red-contrib-revpi-nodes package](https://flows.nodered.org/node/node-red-contrib-revpi-nodes) in the Node-RED Library.

### Manual Installation (on the RevPi)
1. Put the "nodes" folder on your RevPi (in the home/pi folder for example).
2. Navigate to your ".node_red" folder (on a Pi, this should be at /home/pi/.node-red/)
3. Use the following command to install the RevPi nodes:
```
npm install [path to the "nodes" folder]/node-red-revpi
```
4. Restart your node-red service

> You can also install the nodes on any other Node-RED.
> Take a look at https://nodered.org/docs/creating-nodes/first-node#testing-your-node-in-node-red for more informations.

## How to use
1. Make sure the required server is running on any RevPi.
2. Open Node-RED in your browser.
3. Now drag one of the new RevPi nodes into your flow.
4. Double click the node to edit it.
5. Click on the pencil icon next to "Server" and set your host and the port 8000.
> If you're using the server on the same RevPi as Node-RED, you can use "localhost" for the host. Otherwise type in the IP Address of the RevPi.
