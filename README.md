RevPi Nodes
------

This module provides a set of nodes in Node-RED to read and write to I/O Pins of your Revolution Pi.

### Example flow

![Missing image: please import example flow directly][flow]

[flow]: https://github.com/erminas/node-red-contrib-revpi-nodes/master/revpi-nodes/examples/example_flow.png "RevPi Nodes Example Flow"

[Import](https://nodered.org/docs/user-guide/editor/workspace/import-export) the following example flow:
```
[{"id":"80ebf274.f55a48","type":"revpi-single-input","z":"8394fd0c.3c2238","server":"e9d3f71d.b78cb8","inputpin":"Core_Temperature","x":560,"y":160,"wires":[["9e1832f.ac4df5"]]},{"id":"9e1832f.ac4df5","type":"debug","z":"8394fd0c.3c2238","name":"","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"false","x":890,"y":220,"wires":[]},{"id":"bb13c4a0.b3b18","type":"revpi-multiple-input","z":"8394fd0c.3c2238","server":"e9d3f71d.b78cb8","inputPinList":["Core_Frequency","RevPiIOCycle"],"inputpin":"Core_Frequency,RevPiIOCycle","x":520,"y":240,"wires":[["9e1832f.ac4df5"]]},{"id":"1d10b638.133c02","type":"revpi-output","z":"8394fd0c.3c2238","server":"e9d3f71d.b78cb8","outputpin":"O_1","overwritevalue":false,"outputvalue":"","x":840,"y":500,"wires":[]},{"id":"1269fe5a.e25fca","type":"inject","z":"8394fd0c.3c2238","name":"","topic":"","payload":"1","payloadType":"num","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":610,"y":460,"wires":[["1d10b638.133c02"]]},{"id":"1a689d4f.2e1f43","type":"inject","z":"8394fd0c.3c2238","name":"","topic":"","payload":"0","payloadType":"num","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":610,"y":560,"wires":[["1d10b638.133c02"]]},{"id":"ae66ae95.d5b6e","type":"inject","z":"8394fd0c.3c2238","name":"Get I_1","topic":"","payload":"I_1","payloadType":"str","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":330,"y":340,"wires":[["76c200fb.16d46"]]},{"id":"76c200fb.16d46","type":"revpi-getpin","z":"8394fd0c.3c2238","server":"e9d3f71d.b78cb8","inputpin":"I_2","getoverwritevalue":false,"x":580,"y":340,"wires":[["9e1832f.ac4df5"]]},{"id":"e9d3f71d.b78cb8","type":"revpi-server","z":0,"host":"127.0.0.1","port":"8000"}]
```

### Requirements

Install [noderedrevpinodes-server](https://github.com/erminas/noderedrevpinodes-server) as required backend server.
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

> You can also install the nodes on any other NodeRed.
> Take a look at https://nodered.org/docs/creating-nodes/first-node#testing-your-node-in-node-red for more informations.

## How to use
1. Make sure the required server is running on any RevPi.
2. Open Node-RED in your browser.
3. Now drag one of the new RevPi nodes into your flow.
4. Double click the node to edit it.
5. Click on the pencil icon next to "Server" and set your host and the port 8000.
> If your using the server on the same RevPi as NodeRed, you can use "localhost" for the host. Otherwise type in the IP Address of the RevPi.