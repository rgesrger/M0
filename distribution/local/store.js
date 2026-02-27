// @ts-check
/**
 * @typedef {import("../types.js").Callback} Callback
 *
 * @typedef {Object} StoreConfig
 * @property {?string} key
 * @property {?string} gid
 *
 * @typedef {StoreConfig | string | null} SimpleConfig
 */

/* Notes/Tips:

- Use absolute paths to make sure they are agnostic to where your code is running from!
  Use the `path` module for that.
*/
const fs = require('fs');
const path = require('path');
const { store } = require("./local.js");
const { string } = require("yargs");

const storedir = path.join(__dirname, '..', '..', 'store');
const id = globalThis.distribution.util.id;
const node = globalThis.distribution.node.config;
const util = globalThis.distribution.util;
/**
 * @param {any} state
 * @param {SimpleConfig} configuration
 * @param {Callback} callback
 */
function put(state, configuration, callback) {
  let key;
  let gid=null
  if (!configuration) {
    key = id.getID(state);
  } else{
    if (typeof configuration == "string") {
      key = configuration;
    } else{
      key = configuration.key;
      gid = configuration.gid;
    }
  }
  if (gid !== null && gid !== undefined) {
    key = `${gid}${key}`
  }
  const strkey = String(key).replace(/[^a-zA-Z0-9]/g, '');
  const nid = id.getNID(node);
  const dir = path.join(storedir, nid);
  const serializedstate = util.serialize(state);
  fs.mkdir(dir,{recursive: true}, (e)=>{
    if (e) {
      return callback(new Error());
    }
    const filepath = path.join(dir, strkey);
    fs.writeFile(filepath, serializedstate, (e) =>{
      if (e) {
        return callback(new Error());
      } 
      return callback(null, util.deserialize(serializedstate));
    })
  })
}

/**
 * @param {SimpleConfig} configuration
 * @param {Callback} callback
 */
function get(configuration, callback) {
  let key;
  let gid = null;
  if (typeof configuration == "string") {
    key = configuration;
  } else{
    key = configuration.key;
    gid = configuration.gid;
  }
  if (gid !== null && gid !== undefined) {
    key = `${gid}${key}`
  }
  const strcfg= String(key).replace(/[^a-zA-Z0-9]/g, '');
  const dir = path.join(storedir, id.getNID(node), strcfg);
  fs.readFile(dir, 'utf-8', (e,v) => {
    if (e) {
      return callback(new Error());
    }
    return callback(null, util.deserialize(v));
  })
}

/**
 * @param {SimpleConfig} configuration
 * @param {Callback} callback
 */
function del(configuration, callback) {
  let key;
  let gid = null;
  if (typeof configuration == "string") {
    key = configuration;
  } else{
    key = configuration.key;
    gid = configuration.gid;
  }
  if (gid !== null && gid !== undefined) {
    key = `${gid}${key}`
  }
  const strcfg= String(key).replace(/[^a-zA-Z0-9]/g, '');
  const dir = path.join(storedir, id.getNID(node), strcfg);
  let todelete;
  fs.readFile(dir, 'utf-8', (e,v) => {
    if (e) {
      return callback(new Error());
    }
    todelete = util.deserialize(v);
    fs.unlink(dir, (e)=> {
      if (e) {
        return callback(new Error())
      } 
      return callback(null, todelete);
    })
  })
}

/**
 * @param {any} state
 * @param {SimpleConfig} configuration
 * @param {Callback} callback
 */
function append(state, configuration, callback) {
  return callback(new Error('store.append not implemented')); // You'll need to implement this method for the distributed processing milestone.
}

module.exports = {put, get, del, append};
