RevPi Nodes
------

This module provides a set of nodes in Node-RED to read and write to I/O Pins of your Revolution Pi.

### Installation (on the RevPi)
Install the nodes via the node-red-contrib-revpi-nodes package in the Node-RED Library.

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
1. Make sure the provided server is running on any RevPi.
2. Open NodeRed in your browser.
3. Now drag one of the new RevPi nodes into your flow.
4. Double click the node to edit it.
5. Click on the pencil icon next to "Server" and set your host and the port 8000.
> If your using the server on the same RevPi as NodeRed, you can use "localhost" for the host. Otherwise type in the IP Address of the RevPi.