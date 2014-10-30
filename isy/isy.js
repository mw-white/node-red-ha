/*
 * node-red module to communicate with ISY series controllers
 * from Universal Devices (ISY-99i, ISY-994i) using the REST
 * API.
 *
 * Matt White
 * m.w.white@gmail.com
 */

module.exports = function(RED) {
  "use strict";
  var http = require('http'); // need http to talk to the ISY
  var xml2js = require('xml2js');

  /*
   * Common ISY controller configuration - need host/port and 
   * username/password to connect.
   *
   * TODO: Add SSL
   */
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

  function ISYREST(controller, path, callback) {
    var options = {
      hostname: controller.host,
      port: controller.port,
      method: 'GET',
      auth: controller.credentials.uname + ":" +
            controller.credentials.passwd,
      path: path
    }
    var req = http.request(options, function(res) {
      var result = "";
      var done = false;

      res.setEncoding('utf8');

      res.on('end', function() {
        if (done) {
          return;
        }
        done = true;

        xml2js.parseString(result, function(err, json) {
          callback(err, json);
        });
      });

      res.on('error', function(err) {
        if (done) {
          return;
        }
        done = true;

        callback(err);
      });

      res.on('data', function(frag) {
        result += frag;
      });
    });
    req.end();
  }

  /*
   * ISYSend - given a node id (either a deviceid like "00 11 22 1"
   * or a integer scene id), a controller config, and a command
   * (such as DON, DOF, etc), send the command to the ISY
   *
   * TODO: add some checks to validate command
   */
  function ISYSend(config) {
    RED.nodes.createNode(this,config);

    var node = this;

    this.controller = RED.nodes.getNode(config.controller);
    this.nodeid = config.node;
    this.command = config.command;
    if (this.controller) {
      this.on("input",function(msg) {
        var nid = this.nodeid;
        var cmd = this.command;
        if (msg.node) {
          nid = msg.node;
        }
        if (msg.command) {
          cmd = msg.command;
        }
        if (nid && cmd) {
          var path="/rest/nodes/" + encodeURIComponent(nid) + "/cmd/" + cmd;

          ISYREST(this.controller,path,function(err,json) {
            if (!err) { 
              msg.ret = json;
            } else {
              msg.payload = err;
            }
            node.send(msg);
          });
        }
      });
    }
  }

  RED.nodes.registerType("isysend",ISYSend);
}
