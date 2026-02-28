const {start} = require('repl');

require('../distribution.js')();
require('perf_hooks')
// const performance = require('node:perf_hooks');
const distribution = globalThis.distribution;
const node = distribution.node;
const id = distribution.util.id;
const TOTAL_OBJECTS= 1000;
const GID = 'awsGroup';
const NODEIP1 = '127.0.0.1';
const NODEIP2 = '127.0.0.1';
const NODEIP3 = '127.0.0.1';
const nodes = {
  n1: {ip: NODEIP1, port: 8001},
  n2: {ip: NODEIP2, port: 8002},
  n3: {ip: NODEIP3, port: 8003}
};

console.log(`generating objects`)
const dataset = [];
for (let i = 0; i < TOTAL_OBJECTS; i++) {
  dataset.push({
    key: `key-${i}-${Math.random().toString(36).substring(7)}`,
    value: { data: `val-${Math.random().toString(36).repeat(10)}` }
  });
}

let puttime;

function put() {
    console.log("put");
    let completed = 0;
    const starttime = performance.now();
    dataset.forEach((item) =>{
        distribution[GID].store.put(item.value, item.key, (e,v) =>{
            if (e) {
                console.error("put error", e)
            }
            else{
                console.log("put successful", v)
            }
            completed ++;
            if (completed === TOTAL_OBJECTS) {
                const endtime = performance.now();
                puttime = endtime-starttime;
                get();
            }
        })
    })
}

let gettime;
function get() {
    console.log("get");
    let completed = 0;
    const starttime = performance.now();
    dataset.forEach((item) =>{
        distribution[GID].store.get(item.key, (e,v) =>{
            if (e) {
                console.error("get error")
            }
            completed ++;
            if (completed === TOTAL_OBJECTS) {
                const endtime = performance.now();
                gettime= endtime- starttime;
                printResults();
            }
        })
    })
}

function printResults() {
  // Convert milliseconds to seconds for throughput
  const putThroughput = TOTAL_OBJECTS / (puttime / 1000);
  const putLatency = puttime / TOTAL_OBJECTS;
  const getThroughput = TOTAL_OBJECTS / (gettime / 1000);
  const getLatency = gettime / TOTAL_OBJECTS;

  console.log("\n--- BENCHMARK RESULTS ---");
  console.log(`PUT (Insertion):`);
  console.log(`Throughput: ${putThroughput.toFixed(2)} ops/sec`);
  console.log(`Latency:${putLatency.toFixed(2)} ms/op`);
  console.log(`GET (Retrieval):`);
  console.log(`Throughput: ${getThroughput.toFixed(2)} ops/sec`);
  console.log(`Latency:${getLatency.toFixed(2)} ms/op`);
}

// distribution.node.start((e) => {
//     if (e) {
//     console.error('Error starting client node:', e);
//     process.exit(1);
//     }
//     const groupDict = {};
//     groupDict[id.getSID(nodes.n1)] = nodes.n1;
//     groupDict[id.getSID(nodes.n2)] = nodes.n2;
//     groupDict[id.getSID(nodes.n3)] = nodes.n3;
//     const config = { gid: GID, hash: id.consistentHash };

//     distribution.local.groups.put(config, groupDict, (e, v) => {
//         if (e) {
//         console.error("Error creating group locally:", e);
//         process.exit(1);
//         }
//         console.log(`Group '${GID}' mapped successfully.`);
//         put(); 
//     });
// })


distribution.node.start((e) => {
    if (e) {
        console.error('Error starting client node:', e);
        process.exit(1);
    }
    distribution.local.status.spawn(nodes.n1, (e, v) => {
        if (e) console.error(e);
        distribution.local.status.spawn(nodes.n2, (e, v) => {
            if (e) console.error(e);
            distribution.local.status.spawn(nodes.n3, (e, v) => {
                if (e) console.error(e);
                const groupDict = {};
                groupDict[id.getSID(nodes.n1)] = nodes.n1;
                groupDict[id.getSID(nodes.n2)] = nodes.n2;
                groupDict[id.getSID(nodes.n3)] = nodes.n3;
                
                const config = { gid: GID, hash: id.consistentHash };
                distribution.local.groups.put(config, groupDict, (e, v) => {
                    if (e) {
                        console.error("Error creating group locally:", e);
                        process.exit(1);
                    }
                    put(); 
                });
            });
        });
    });
});