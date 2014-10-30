module.exports = function(RED) {
  "use strict";
  var http = require('http');

  function ISYControllerNode(n) {
    RED.nodes.createNode(this,n);
    this.host = n.host;
    this.port = n.port;
    if (this.credentials) {
      this.uname = n.uname;
      this.passwd = n.passwd;
    }
  }

  RED.nodes.registerType("isy-controller",ISYControllerNode,{
    credentials: {
      uname: {type:"text"},
      passwd: {type:"password"}
    }
  });

  function ISYSend(config) {
    RED.nodes.createNode(this,config);

    this.controller = RED.nodes.getNode(config.controller);
    this.nodeid = config.node;
    this.command = config.command;
    if (this.controller) {
      this.on("input",function(msg) {
        var url = "http://" + this.controller.credentials.uname + ":" + 
            this.controller.credentials.passwd + "@" + this.controller.host + 
            (this.controller.port==80?"":":" + this.controller.port) + 
            "/rest/";
        var nid = this.nodeid;
        var cmd = this.command;
        if (msg.node) {
          nid = msg.node;
        }
        if (msg.command) {
          cmd = msg.command;
        }
        if (nid && cmd) {
          var options = {
            hostname: this.controller.host,
            port: this.controller.port,
            method: 'GET',
            auth: this.controller.credentials.uname + ":" +
                  this.controller.credentials.passwd,
            path: "/rest/nodes/" + encodeURIComponent(nid) + "/cmd/" + cmd
          }
          var req = http.request(options, function(res) {
          });
          req.end();
        }
      });
    }
  }

  RED.nodes.registerType("isysend",ISYSend);
}
