Official Revolution Pi Nodes
------

This module provides a set of nodes in [Node-RED](https://nodered.org/) to read and write to I/O Pins of your [Revolution Pi](https://revolution.kunbus.de/).

### Example flow

![Missing image: please import example flow directly][flow]

[flow]: https://raw.githubusercontent.com/erminas/node-red-contrib-revpi-nodes/master/revpi-nodes/examples/example_flow.png "RevPi Nodes Example Flow"

[Import](https://nodered.org/docs/user-guide/editor/workspace/import-export) the following example flow:
```
[{"id":"4c8a2727.626f18","type":"revpi-single-input","z":"cd6ce79d.34e74","server":"e9d3f71d.b78cb8","inputpin":"Core_Temperature","x":540,"y":140,"wires":[["4cb73975.9ab188"]]},{"id":"4cb73975.9ab188","type":"debug","z":"cd6ce79d.34e74","name":"","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"false","x":870,"y":200,"wires":[]},{"id":"6eed10e3.2870c8","type":"revpi-multiple-input","z":"cd6ce79d.34e74","server":"e9d3f71d.b78cb8","inputPinList":["Core_Frequency","RevPiIOCycle"],"inputpin":"Core_Frequency,RevPiIOCycle","x":500,"y":220,"wires":[["4cb73975.9ab188"]]},{"id":"6c86be5c.baad28","type":"revpi-output","z":"cd6ce79d.34e74","server":"e9d3f71d.b78cb8","outputpin":"O_1","overwritevalue":false,"outputvalue":"","x":820,"y":480,"wires":[]},{"id":"6d5715d5.52d894","type":"inject","z":"cd6ce79d.34e74","name":"","topic":"","payload":"1","payloadType":"num","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":590,"y":440,"wires":[["6c86be5c.baad28"]]},{"id":"aa26279c.abde88","type":"inject","z":"cd6ce79d.34e74","name":"","topic":"","payload":"0","payloadType":"num","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":590,"y":540,"wires":[["6c86be5c.baad28"]]},{"id":"364abe72.67b222","type":"inject","z":"cd6ce79d.34e74","name":"Get I_1","topic":"","payload":"I_1","payloadType":"str","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":310,"y":320,"wires":[["ff6f697.6eb9c18"]]},{"id":"ff6f697.6eb9c18","type":"revpi-getpin","z":"cd6ce79d.34e74","server":"e9d3f71d.b78cb8","inputpin":"I_2","getoverwritevalue":true,"x":570,"y":320,"wires":[["4cb73975.9ab188"]]},{"id":"e9d3f71d.b78cb8","type":"revpi-server","z":0,"host":"127.0.0.1","port":"8000"}]
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