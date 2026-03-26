// @ts-check
/**
 * @typedef {import("../types.js").Callback} Callback
 * @typedef {import("../types.js").Config} Config
 * @typedef {import("../util/id.js").NID} NID
 */

const { group } = require("console");

/**
 * Map functions used for mapreduce
 * @callback Mapper
 * @param {string} key
 * @param {any} value
 * @returns {object[]}
 */

/**
 * Reduce functions used for mapreduce
 * @callback Reducer
 * @param {string} key
 * @param {any[]} value
 * @returns {object}
 */

/**
 * @typedef {Object} MRConfig
 * @property {Mapper} map
 * @property {Reducer} reduce
 * @property {string[]} keys
 *
 * @typedef {Object} Mr
 * @property {(configuration: MRConfig, callback: Callback) => void} exec
 */

/*
  Note: The only method explicitly exposed in the `mr` service is `exec`.
  Other methods, such as `map`, `shuffle`, and `reduce`, should be dynamically
  installed on the remote nodes and not necessarily exposed to the user.
*/
const distribution = globalThis.distribution;
const id = distribution.util.id;
const fs = require('fs');
/**
 * @param {Config} config
 * @returns {Mr}
 */
function mr(config) {
  const context = {
    gid: config.gid || 'all',
  };

  /**
   * @param {MRConfig} configuration
   * @param {Callback} callback
   * @returns {void}
   */
  function exec(configuration, callback) {
    // fs.writeFileSync("/usr/src/app/logs/beforemap", "context.gid"+context.gid);

    const workerGroup = context.gid;
    const mrID = id.getID(`${configuration}${Date.now()}`);
    const mrGid = `mr${mrID}`;
    /*
      MapReduce steps:
      1) Setup: register a service `mr-<id>` on all nodes in the group. The service implements the map, shuffle, and reduce methods.
      2) Map: make each node run map on its local data and store them locally, under a different gid, to be used in the shuffle step.
      3) Shuffle: group values by key using store.append.
      4) Reduce: make each node run reduce on its local grouped values.
      5) Cleanup: remove the `mr-<id>` service and return the final output.

      Note: Comments inside the stencil describe a possible implementation---you should feel free to make low- and mid-level adjustments as needed.
    */
    
    let completedNodes = 0;
    
    const totalNodes = Object.keys(distribution[workerGroup].nodes).length;
    let currentPhase = "map";
    let results = []
    // service that other nodes will call to talk to main orchestrator
    const orchestratorService = {
      notify: function(payload, callback) {
        
        completedNodes++;
        if (currentPhase === "reduce") {
          results.push(payload);
        }
        if (completedNodes === totalNodes) {
          // Reset counter 
          completedNodes = 0; 
          this.advanceToNextPhase(); 
        }
        // acknowledge to worker
        callback(null, 'OK');
      },

      advanceToNextPhase: function() {
        if (currentPhase === "map") {
          currentPhase = "shuffle"
          const mapcfg = {service: mrID, method: "shuffle"}
          console.log("start shuffle");
          distribution[mrGid].comm.send([mrGid, mrID], mapcfg, (e,v) =>{
             if (e && (e instanceof Error || Object.keys(e).length > 0)) {
              console.log("error in shuffle", e)
              return callback(e);
            }
          })
        }
        else if (currentPhase === "shuffle") {
          currentPhase = "reduce";
          const mapcfg = {service: mrID, method: "reduce"}
          console.log("start reduce");
          distribution[mrGid].comm.send([mrGid, mrID], mapcfg, (e,v) =>{
            if (e && (e instanceof Error || Object.keys(e).length > 0)){
              console.log("errors starting reduce", e);
              return callback(e);
            }
          })
        }
        else if (currentPhase === "reduce") {
          distribution.local.routes.remove(mrID, (e, v) => {
            callback(null, results);
          });
        }
      }
    };

    const mrService = {
      mapper: configuration.map,
      reducer: configuration.reduce,
      keys: configuration.keys,
      coordinator: distribution.node.config,
      map: function(
          /** @type {string} */ mrGid,
          /** @type {string} */ mrID,
          /** @type {Callback} */ callback,
      ) {
        const distribution = globalThis.distribution;
        distribution.local.routes.get(mrID, (e,v) => {
          const mapper = v.mapper;
          const coord = v.coordinator;
          const keystomap = v.keys;
          
          let processed = 0;
          if (!keystomap || keystomap.length === 0) {
            return notify();
          }
          // store the keys that we need to map
          keystomap.forEach((key) => {
            distribution.local.store.get({key: key, gid: mrGid}, (e,v) => {
              if (e) {
                processed++;
                return checkDone();
              }
              
              // mapper returns an array of kv pairs
              const mappedarray = mapper(key, v);
              // console.log("array from map", mappedarray);
              let savedEntries = 0; 
              if (mappedarray.length === 0) {
                processed++;
                return checkDone();
              }
              // store the mapper outputs as kv pairs
              mappedarray.forEach((item) => {
                const k = Object.keys(item)[0];
                const v = item[k];
                distribution.local.store.put(v, {key: k, gid: mrID + '-map'}, (e) => {
                  savedEntries++;
                  if (savedEntries === mappedarray.length) {
                    processed++;
                    checkDone();
                  }
                });
              });
            });
          });
          function checkDone() {
            if (processed === keystomap.length) {
              notify();
            }
          }
          function notify() {
            const remote = {node: coord, service: 'orchestrator' + mrID, method: 'notify'};
            distribution.local.comm.send(['map-done'], remote, () => callback(null, 'Done'));
          }
        });
        // Map should read the node's local keys under the mrGid gid and write to store under gid `${mrID}_map`.
        // Expected output: array of objects with a single key per object.
      },
      shuffle: function(
          /** @type {string} */ gid,
          /** @type {string} */ mrID,
          /** @type {Callback} */ callback,
      ) {
        const fs = require('fs');
        const path = require('path');
        const node = distribution.node.config;
        const nid = distribution.util.id.getNID(node);
        const storedir = path.join(__dirname, '..', '..', 'store');
        const dir = path.join(storedir, nid);
        distribution.local.routes.get(mrID, (e,v) => {
        const coord = v.coordinator;
          // scan directory for files for our map reduce

          fs.readdir(dir, (e, files) => {
            if (e) {
              if (e.code === 'ENOENT') {
                return notify();
              }
              return callback(e);
            }

            const prefix = String(mrID+'-map').replace(/[^a-zA-Z0-9]/g, '');
            const relevantFiles = files.filter(f => f.startsWith(prefix));
            if (relevantFiles.length === 0) {
              notify();
              return callback(null, {});
            }
            let completed = 0;
            
            //
            relevantFiles.forEach((filename) => {
              const actualKey = filename.substring(prefix.length);
              distribution.local.store.get({key: actualKey, gid: mrID + '-map'}, (e,v) => {
                if (e) return callback(e);
                // remove gid prefix to get actual key

                const groupNodes = distribution[gid].nodes;
                const remotesid = distribution.util.id.consistentHash(actualKey, Object.keys(groupNodes));
                const remoteNode = groupNodes[remotesid];

                // append to node that the key belongs to
                const remote = {service: "store", method: "append", node: remoteNode}
                console.log("shuffle sent key", actualKey, "gid", mrID+"-shuffle")
                distribution.local.comm.send([v ,{key: actualKey, gid: mrID + "-shuffle"}], remote, (e,v) => {
                  completed ++;
                  if (e) console.error("Shuffle push failed:", e);
                  if (completed === relevantFiles.length) {
                    notify()
                  }
                })
              })
            })
          })
          function notify() {
              const remote = {node: coord, service: 'orchestrator' + mrID, method: 'notify'};
              distribution.local.comm.send(['shuffle-done'], remote, () => callback(null, 'Done'));
            }
          })
        // Fetch the mapped values from the local store
        // Shuffle groups values by key (via store.append).
      },
      reduce: function(
          /** @type {string} */ gid,
          /** @type {string} */ mrID,
          /** @type {Callback} */ callback,
      ) {
        const distribution = globalThis.distribution;
        const fs = require('fs');
        const path = require('path');

        // Get the Orchestrator config and the Reducer function
        distribution.local.routes.get(mrID, (e, routeConfig) => {
          if (e) return callback(e);
          const coord = routeConfig.coordinator;
          const reducer = routeConfig.reducer; 

          const node = distribution.node.config;
          const nid = distribution.util.id.getNID(node);
          const storedir = path.join(__dirname, '..', '..', 'store');
          const dir = path.join(storedir, nid);
          fs.readdir(dir, (e, files) => {
            if (e) {
              if (e.code === 'ENOENT') return notify([]); // notify with empty array
              return callback(e);
            }
            
            // Filter files by the Shuffle phase GID: mrID + '-shuffle'
            const shuffleGid = mrID + '-shuffle';
            const prefix = String(shuffleGid).replace(/[^a-zA-Z0-9]/g, '');
            const relevantFiles = files.filter(f => f.startsWith(prefix));
            if (relevantFiles.length === 0) return notify([]); 

            let completed = 0;
            const localResults = []; // Array to hold reduced objects

            // Process each grouped file
            relevantFiles.forEach((filename) => {
              // Extract the actual key 
              const actualKey = filename.substring(prefix.length);
              // Get the array of values from the store
              console.log("key", actualKey, "gid", shuffleGid);
              distribution.local.store.get({key: actualKey, gid: shuffleGid}, (e, valuesArray) => {
                if (e) {
                  console.log("error in reduce", e)
                  return callback(e);
                }
                console.log("PEEN 4")
                //  Apply the given reducer function
                const reducedObject = reducer(actualKey, valuesArray); 
                localResults.push(reducedObject);
                completed++;
                if (completed === relevantFiles.length) {
                  
                  notify(localResults); 
                }
              });
            });
          });

          function notify(payload) {
            const remote = {node: coord, service: 'orchestrator' + mrID, method: 'notify'};
            distribution.local.comm.send([payload], remote, () => callback(null, 'Done'));
          }
        });
      },
    };

    // put the orchestrator service
    distribution.local.routes.put(orchestratorService, "orchestrator"+mrID, (e,v)=>{
      if (e) return callback(e);
      distribution.local.groups.get(workerGroup, (e, nodes) => {

      if (e) return callback(e);
      // give everybody in the workerGroup knowledge of these nodes. This is necessary for distributing
      // work in shuffle
        distribution.local.groups.put({gid: mrGid}, nodes, (e, v) => {
        if (e) return callback(e);

          distribution[workerGroup].groups.put({gid: mrGid}, nodes, (e, v) => {
            if (e && (e instanceof Error || Object.keys(e).length > 0)) {
              return callback(e);
            }
            const sendcfg = {service:"routes", method:"put"};

            distribution[mrGid].comm.send([mrService,  mrID], sendcfg, (e, v) => {
              if (e && (e instanceof Error || Object.keys(e).length > 0)) return callback(e);
              // start map step
              const mapcfg = {service: mrID, method: "map"}
              distribution[mrGid].comm.send([workerGroup, mrID], mapcfg, (e,v) =>{
                if (e && (e instanceof Error || Object.keys(e).length > 0)) {
                  return callback(e);
                }
              })
            });
          });
        });
      });
    })
    
  }

  return {exec};
}

module.exports = mr;
