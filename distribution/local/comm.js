// @ts-check
/**
 * @typedef {import("../types.js").Callback} Callback
 * @typedef {import("../types.js").Node} Node
 */

const http = require('node:http');
// const { hostname } = require("node:os");

/**
 * @typedef {Object} Target
 * @property {string} service
 * @property {string} method
 * @property {Node} node
 * @property {string} [gid]
 */

/**
 * @param {Array<any>} message
 * @param {Target} remote
 * @param {(error: Error, value?: any) => void} callback
 * @returns {void}
 */
function send(message, remote, callback) {
  const service = remote.service;
  const method = remote.method;
  const node = remote.node;
  if (!service || !method || !node) {
    return callback(new Error('service/method/node is empty'), null);
  }
  if (!node.ip) {
    return callback(new Error('ip missing from node', null));
  }
  if (!node.port) {
    return callback(new Error('port missing from node', null));
  }
  let path;
  if (remote.gid) {
    path = `/${remote.gid}/${service}/${method}`
  }
  else{
    path = `/local/${service}/${method}`;
  }
  const serializedmessage = globalThis.distribution.util.serialize(message);
  const options = {
    hostname: node.ip,
    port: node.port,
    method: 'PUT',
    path: path,
  };

  const req = http.request(options, (res) =>{
    const body = [];
    res.on('data', (chunk) => {
      body.push(chunk);
    });
    res.on('end', ()=> {
      const msg = body.join('');
      const [e, v] = globalThis.distribution.util.deserialize(msg);
      return callback(e, v);
    });
  });

  req.on('error', (e) => {
    callback(e);
  });
  req.write(serializedmessage);
  req.end();
}

module.exports = {send};
