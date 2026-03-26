// @ts-check
/**
 * @typedef {import("../types.js").Node} Node
 * @typedef {import("../types.js").Callback} Callback
 */
const http = require('node:http');
const url = require('node:url');
// const log = require('../util/log.js');
let distribution = require("@brown-ds/distribution");
const yargs = require('yargs/yargs');
// const { noDeprecation } = require("node:process");

/**
 * @returns {Node}
 */
function setNodeConfig() {
  const args = yargs(process.argv)
      .help(false)
      .version(false)
      .parse();

  let maybeIp; let maybePort; let maybeOnStart;
  if (typeof args.ip === 'string') {
    maybeIp = args.ip;
  }
  if (typeof args.port === 'string' || typeof args.port === 'number') {
    maybePort = parseInt(String(args.port), 10);
  }

  if (args.help === true || args.h === true) {
    console.log('Node usage:');
    console.log('  --ip <ip address>      The ip address to bind the node to');
    console.log('  --port <port>          The port to bind the node to');
    console.log('  --config <config>      The serialized config string');
    process.exit(0);
  }

  if (typeof args.config === 'string') {
    let config = undefined;
    try {
      config = globalThis.distribution.util.deserialize(args.config);
    } catch (error) {
      try {
        config = JSON.parse(args.config);
      } catch {
        console.error('Cannot deserialize config string: ' + args.config);
        process.exit(1);
      }
    }

    if (typeof config?.ip === 'string') {
      maybeIp = config?.ip;
    }
    if (typeof config?.port === 'number') {
      maybePort = config?.port;
    }
    if (typeof config?.onStart === 'function') {
      maybeOnStart = config?.onStart;
    }
  }

  // Default values for config
  maybeIp = maybeIp ?? '127.0.0.1';
  maybePort = maybePort ?? 1234;

  return {
    ip: maybeIp,
    port: maybePort,
    onStart: maybeOnStart,
  };
}
/*
    The start function will be called to start your node.
    It will take a callback as an argument.
    After your node has booted, you should call the callback.
*/


/**
 * @param {(err?: Error | null) => void} callback
 * @returns {void}
 */
function start(callback) {
  const server = http.createServer((req, res) => {
    /* Your server will be listening for PUT requests. */
    // Write some code...
    if (globalThis.distribution.node.msgcount===undefined) {
      globalThis.distribution.node.msgcount = 1;
    } else {
      globalThis.distribution.node.msgcount ++;
    }
    if (req.method !== 'PUT') {
      const errmsg = globalThis.distribution.util.serialize(new Error('error: Not a put request'));
      res.end(errmsg);
      return;
    }
    /*
      The path of the http request will determine the service to be used.
      The url will have the form: http://node_ip:node_port/service/method
    */
    const distribution = globalThis.distribution;
    const parsed = url.parse(req.url);
    const parts = parsed.pathname.split('/').filter((x) => x !== '');
    const gid = parts[0];
    const servicename = parts[1];
    const method = parts[2];
    // Write some code...
    if (!servicename || !method) {
      const errmsg = globalThis.distribution.util.serialize([new Error(), null]);
      res.end(errmsg);
      return;
    }
    const service= {service:servicename, gid:gid}
    /*
      A common pattern in handling HTTP requests in Node.js is to have a
      subroutine that collects all the data chunks belonging to the same
      request. These chunks are aggregated into a body variable.

      When the req.on('end') event is emitted, it signifies that all data from
      the request has been received. Typically, this data is in the form of a
      string. To work with this data in a structured format, it is often parsed
      into a JSON object using JSON.parse(body), provided the data is in JSON
      format.

      Our nodes expect data in JSON format.
    */

    /** @type {any[]} */
    const body = [];
    req.on('data', (chunk) => {
      body.push(chunk);
    });

    req.on('end', () => {
      /*
       Handle  service requests.
      */
      const serializedmsg = body.join('');
      const args = distribution.util.deserialize(serializedmsg);
      distribution.local.routes.get(service, (e, v) => {
        if (e) {
          const errmsg = globalThis.distribution.util.serialize([e, null]);
          res.end(errmsg);
          return;
        }
        if (!v || typeof v[method] !== 'function') {
          const err = new Error('service/method is not available');
          res.end(globalThis.distribution.util.serialize([err, null]));
          return;
        }
        v[method](...args, (e, v) => {
          const msg = globalThis.distribution.util.serialize([e, v]);
          res.end(msg);
        });
      });
    });
  });

  /*
    Your server will be listening on the port and ip specified in the config
    You'll be calling the `callback` callback when your server has successfully
    started.

    At some point, we'll be adding the ability to stop a node
    remotely through the service interface.
  */

  // Important: allow tests to access server
  globalThis.distribution.node.server = server;
  const config = globalThis.distribution.node.config;

  server.once('listening', () => {
    callback(null);
  });

  server.once('error', (error) => {
    callback(error);
  });

  server.listen(config.port, config.ip);
}

module.exports = {start, config: setNodeConfig()};
