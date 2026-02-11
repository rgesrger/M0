/*
    In this file, add your own test cases that correspond to functionality introduced for each milestone.
    You should fill out each test case so it adequately tests the functionality you implemented.
    You are left to decide what the complexity of each test case should be, but trivial test cases that abuse this flexibility might be subject to deductions.

    Imporant: Do not modify any of the test headers (i.e., the test('header', ...) part). Doing so will result in grading penalties.
*/

require('../../distribution.js')({ip: '127.0.0.1', port: 1246});
const {performance} = require('node:perf_hooks');

require('.././helpers/sync-guard');
const distribution = globalThis.distribution;
const local = distribution.local;
const id = distribution.util.id;
const node = distribution.node.config;

test('(1 pts) student test', (done) => {
  // testing status (checking whether the number of messages is getting counted)
  // sends a message (invalid but still technically a message)
  let remote = {node: node, service: 'status', method: 'get'};
  let message = ['nid']; // Arguments to the method

  local.comm.send(message, remote, (e, v) => {
    try {
      expect(e).toBeFalsy();
      expect(v).toEqual(id.getNID(node));

      let remote2 = {node: node, service: 'status', method: 'get'};
      let message2 = ['counts'];
      
      local.comm.send(message2, remote2, (e, v)=> {
        try {
          expect(e).toBeFalsy();
          expect(v).toBe(2);
          done();
        } catch (error) {
          done(error);
        }
      });

    } catch (error) {
      done(error);
    }
  });
});


test('(1 pts) student test', (done) => {
  // test for a lot of connections (also measure latency and throughput along the way)
  const remote = {node: node, service: 'status', method: 'get'};
  const message = ['nid']; // Arguments to the method
  const start = performance.now();
  const n = 1000;
  let finished = 0;
  for (let i = 0; i < n; i++) {
    local.comm.send(message, remote, (e, v) => {
      if (e) {
        done(e);
        return;
      }
      finished ++;
      if (finished === n) {
        const end = performance.now();
        const duration = end-start;
        console.log(`Total Time: ${duration.toFixed(3)} ms`);
        done();
      }
    });
  }

}, 100000);

// test that I ran here for convenience but commented out when submitting
test('additional latency test (I wrote it here for convenience)', (done) =>{
  console.log("custom test run");
  let n_count = 0;
  const addOne = () => ++n_count;
  const node = {ip: '127.0.0.1', port: 9009};
  distribution.node.start(() => {
    function cleanup(cb) {
      if (globalThis.distribution.node.server) globalThis.distribution.node.server.close();
      distribution.local.comm.send([], {node: node, service: 'status', method: 'stop'}, cb);
    }

    const rpcService = { 
      addOne: distribution.util.wire.createRPC(distribution.util.wire.toAsync(addOne)) 
    };

    distribution.local.status.spawn(node, (e, v) => {
      distribution.local.comm.send([rpcService, 'addOneService'],
          {node: node, service: 'routes', method: 'put'}, (e, v) => {
            
            const iterations = 1000;
            let finished = 0;
            const start = performance.now();
            
            for (let i = 0; i < iterations; i++) {
              distribution.local.comm.send([], 
                  {node: node, service: 'addOneService', method: 'addOne'}, (e, v) => {
                
                if (e) { cleanup(() => done(e)); return; }
                finished++;

                if (finished === iterations) {
                  const end = performance.now();
                  console.log(`Latency for ${iterations} RPC calls: ${(end - start).toFixed(3)} ms`);
                  cleanup(done);
                }
              });
            }

          });
    });
  });
});

test('(1 pts) student test', (done) => {
  // put remove and then get. Make sure that get returns error.
  const echoService = {};

  echoService.echo = () => {
    return 'echo!';
  };

  local.routes.put(echoService, 'echo', (e, v) => {
    local.routes.rem('echo', (e, v) => {
      local.routes.get('echo', (e, v) =>{
        expect(e).toBeInstanceOf(Error);
        done();
      });
    });
  });
});

test('(1 pts) student test', (done) => {
  local.routes.get(2, (e, v) => {
    try {
      expect(e).toBeDefined();
      expect(e).toBeInstanceOf(Error);
      expect(v).toBeFalsy();
      done();
    } catch (error) {
      done(error);
    }
  });
  
});

test('(1 pts) student test', (done) => {
  local.status.get(null, (e, v) => {
    try {
      expect(e).toBeDefined();
      expect(e).toBeInstanceOf(Error);
      expect(v).toBeFalsy();
    } catch (error) {
      done(error);
    }
  });
  local.status.get([1,2,3], (e, v) => {
    try {
      expect(e).toBeDefined();
      expect(e).toBeInstanceOf(Error);
      expect(v).toBeFalsy();
      done();
    } catch (error) {
      done(error);
    }
  });
});

beforeAll((done) => {
  distribution.node.start((e) => {
    if (e) {
      done(e);
      return;
    }
    done();
  });
});

afterAll((done) => {
  if (globalThis.distribution.node.server) {
    globalThis.distribution.node.server.close();
  }
  done();
});
