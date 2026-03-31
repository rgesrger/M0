require('../distribution.js')();
const { performance } = require('perf_hooks');

const distribution = globalThis.distribution;
const id = distribution.util.id;

// Basic settings for the run
const TOTAL_DOCS = 1;
const GID = 'awsMrGroup';

// AWS Ips
const NODEIP1 = '172.31.45.36'; 
const NODEIP2 = '172.31.35.75';
const NODEIP3 = '172.31.43.115';

const nodes = {
  n1: {ip: NODEIP1, port: 8001},
  n2: {ip: NODEIP2, port: 8001},
  n3: {ip: NODEIP3, port: 8001}
};

// Generate some random text data to process
const dataset = [];
const words = ["cloud", "distributed", "systems", "aws", "mapreduce", "node"];

for (let i = 0; i < TOTAL_DOCS; i++) {
  let sentence = Array.from({length: 10 }, () => words[Math.floor(Math.random() * words.length)]).join(' ');
  dataset.push({ key: `doc-${i}`, value: sentence });
}

// Logic for the map and reduce phases
const mapper = (key, value) => {
  return value.split(/\s+/).map(w => ({ [w]: 1 }));
};

const reducer = (key, values) => {
  return { [key]: values.reduce((a, b) => a + parseInt(b, 10), 0) };
};

let putTime = 0;
let mrTime = 0;

// This seeds the data across the cluster before the MR starts
function sendData() {
  console.log("Distributing data in parallel batches...");
  const start = performance.now();
  let completed = 0;
  let started = 0;
  const CONCURRENCY = 1; // Number of simultaneous requests

  function launch() {
    // Fill the "window" up to our concurrency limit
    while (started < dataset.length && (started - completed) < CONCURRENCY) {
      const item = dataset[started];
      const index = started;
      started++;

      distribution[GID].store.put(item.value, item.key, (e) => {
        if (e) console.error(`Error on item ${index}:`, e);
        
        completed++;
        if (completed === TOTAL_DOCS) {
          putTime = performance.now() - start;
          console.log(`Finished: ${TOTAL_DOCS} docs in ${(putTime/1000).toFixed(2)}s`);
          runMapReduce();
        } else {
          launch(); // Launch the next one as soon as one finishes
        }
      });
    }
  }
  launch();
}
// Triggers the actual MapReduce execution
function runMapReduce() {
  
  const start = performance.now();

  const config = {
    keys: dataset.map(d => d.key),
    map: mapper,
    reduce: reducer
  };
  console.log("Running MapReduce...");
  distribution[GID].mr.exec(config, (e, results) => {
    console.log("error in map reduce", e, "results", results);
    if (e && Object.keys(e).length > 0) return console.error(e);
    mrTime = performance.now() - start;
    showResults(results);
  });
}

function showResults(results) {
  console.log("\n--- Results ---");
  console.log(`Put Throughput: ${(TOTAL_DOCS / (putTime / 1000)).toFixed(2)} docs/sec`);
  console.log(`MR Total Time: ${mrTime.toFixed(2)} ms`);
  console.log("Sample output:", results.slice(0, 3));
  process.exit(0);
}

console.log("start");
// Start the client and connect to the already-running remote nodes
distribution.node.start((e) => {
    if (e) {
        console.error('Error starting client node:', e);
        process.exit(1);
    }

    const groupDict = {};

    // IMPORTANT: The key in groupDict MUST be the SID the remote node 
    // generated for itself. If you started the node with --ip 0.0.0.0, 
    // you must calculate the SID using 0.0.0.0.
    
    const n1_sid = id.getSID({ip: '0.0.0.0', port: 8001});
    const n2_sid = id.getSID({ip: '0.0.0.0', port: 8001});
    const n3_sid = id.getSID({ip: '0.0.0.0', port: 8001});

    // The value is where the data is actually sent (Public IPs)
    groupDict[n1_sid] = {ip: '3.23.126.152', port: 8001};
    groupDict[n2_sid] = {ip: '18.217.226.121', port: 8001};
    groupDict[n3_sid] = {ip: '18.222.153.26', port: 8001};

    const config = { gid: GID, hash: id.consistentHash };

    // 1. Map the group locally so your client knows where the nodes are
    distribution.local.groups.put(config, groupDict, (e) => {
        if (e) return console.error("Local group error:", e);

        // 2. Push the group config to the remote nodes so they recognize the GID
        distribution[GID].groups.put(config, groupDict, (e) => {
            if (e && Object.keys(e).length > 0) return console.error("Remote group error:", e);
            
            console.log(`Group '${GID}' synchronized across AWS cluster.`);
            sendData(); // Start the data distribution
        });
    });
});