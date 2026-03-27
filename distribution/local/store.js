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
  // puts in path store/[NID_of_the_node]/[sanitized_GID+KEY]
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

  const strkey = String(key).replace(/[^a-zA-Z0-9]/g, '');
  const nid = id.getNID(node);
  
  let dir = path.join(storedir, nid);
  if (gid) {
    const strGid = String(gid).replace(/[^a-zA-Z0-9]/g, '');
    dir = path.join(dir, strGid);
  }
  const serializedstate = util.serialize(state);

  // fs.mkdir(dir,{recursive: true}, (e)=>{
  //   if (e) {
  //     return callback(new Error());
  //   }
  //   const filepath = path.join(dir, strkey);
  //   fs.writeFile(filepath, serializedstate, (e) =>{
  //     if (e) {
  //       return callback(new Error());
  //     } 
  //     // console.log("stored", state, "configuration", configuration);
  //     console.log("put serialized:", serializedstate);
  //     return callback(null, util.deserialize(serializedstate));
  //   })
  // })
  try {
    fs.mkdirSync(dir, { recursive: true });
    const filepath = path.join(dir, strkey);
    fs.writeFileSync(filepath, serializedstate);
    
    return callback(null, util.deserialize(serializedstate));
  } catch (e) {
    return callback(new Error("put failed: " + e.message));
  }
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

  // file path
  const strcfg= String(key).replace(/[^a-zA-Z0-9]/g, '');
  let dir = path.join(storedir, id.getNID(node));
  if (gid) {
    const strGid = String(gid).replace(/[^a-zA-Z0-9]/g, '');
    dir = path.join(dir, strGid);
  }
  // get all keys if key is null. we must do this before we join with key
  if (key === null && gid) {
    fs.readdir(dir, (e, files) => {
      if (e) {
        if (e.code === 'ENOENT') return callback(null, []); // Return empty array safely
        return callback(e);
      }
      return callback(null, files);
    });
    return; 
  }

  // join path with key
  dir = path.join(dir, strcfg);
  fs.readFile(dir, 'utf-8', (e,v) => {
    if (e) {
      return callback(new Error("file not found"));
    }
    // console.log("value from get", v);
    // console.log("deserialized value", util.deserialize(v));
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

  const strcfg= String(key).replace(/[^a-zA-Z0-9]/g, '');
  let dir = path.join(storedir, id.getNID(node));
  if (gid) {
    const strGid = String(gid).replace(/[^a-zA-Z0-9]/g, '');
    dir = path.join(dir, strGid);
  }
  dir = path.join(dir, strcfg);
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

  let key;
  let gid = null;
  if (typeof configuration == "string") {
    key = configuration;
  } else{
    key = configuration.key;
    gid = configuration.gid;
  }
  
  const strkey = String(key).replace(/[^a-zA-Z0-9]/g, '');
  let dir = path.join(storedir, id.getNID(node));
  if (gid) {
    const strGid = String(gid).replace(/[^a-zA-Z0-9]/g, '');
    dir = path.join(dir, strGid);
  }
  const filepath = path.join(dir, strkey);
  // ensure directory exists
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  try {
    let list = [];
    if (fs.existsSync(filepath)) {
      const existingdata = fs.readFileSync(filepath, 'utf-8')
      list = util.deserialize(existingdata);
      if (!Array.isArray(list)) {
        list = [list]; 
      }
    }
    list.push(state);
    const serializedData = util.serialize(list);
    fs.writeFileSync(filepath, serializedData, 'utf-8');
    return callback(null, list);
  }
  catch (e) {
    return callback(new Error("append failed: " +e.message));
  }

}

module.exports = {put, get, del, append};
