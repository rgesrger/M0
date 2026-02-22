const { isExportDeclaration } = require('typescript');

/*
    In this file, add your own test cases that correspond to functionality introduced for each milestone.
    You should fill out each test case so it adequately tests the functionality you implemented.
    You are left to decide what the complexity of each test case should be, but trivial test cases that abuse this flexibility might be subject to deductions.

    Imporant: Do not modify any of the test headers (i.e., the test('header', ...) part). Doing so will result in grading penalties.
*/
require('../../distribution.js')();
require('../helpers/sync-guard');
const distribution = globalThis.distribution;
const id = distribution.util.id;

const mygroupConfig = {gid: 'mygroup'};
const mygroupGroup = {};

/*
   This is necessary since we can not
   gracefully stop the local listening node.
   This is because the process that node is
   running in is the actual jest process
*/

const n1 = {ip: '127.0.0.1', port: 9001};
const n2 = {ip: '127.0.0.1', port: 9002};
const n3 = {ip: '127.0.0.1', port: 9003};
const n4 = {ip: '127.0.0.1', port: 9004};
const n5 = {ip: '127.0.0.1', port: 9005};
const n6 = {ip: '127.0.0.1', port: 9006};
require('../helpers/sync-guard');

test('(1 pts) student test', (done) => {
  // check what happens if service does not exist
  const remote = { service: 'someservicethatdoesnotexist', method: 'get' };
  distribution.mygroup.comm.send(['asd'], remote, (e,v) =>{
    try {
      const sids = Object.keys(v);
      for (sid of sids) {
        expect(e[sid]).toBeDefined();
        expect(e[sid]).toBeInstanceOf(Error);
      }
      done();
    } catch(e) {
      done(error);
    }
  })
});


test('(1 pts) student test', (done) => {
  // Check if concurrent requests interfere with each other
  const remote = { service: 'status', method: 'get' };
  let completed = 0;
  distribution.mygroup.comm.send(["nid"], remote, (e,v) => {
    try{
      expect(Object.keys(v).length).toEqual(5);
      completed ++;
      if (completed === 2) {
        done();
      }
    } catch (e){
      done(e);
    }
  })
  distribution.mygroup.comm.send(["nid"], remote, (e,v) => {
    try{
      expect(Object.keys(v).length).toEqual(5);
      completed ++;
      if (completed === 2) {
        done();
      }
    } catch (e){
      done(e);
    }
  })

});


test('(1 pts) student test', (done) => {
  distribution.local.groups.get('nonexistant group', (e, v) =>{
    try {
      expect(e).toBeDefined()
      expect(e).toBeInstanceOf(Error);
      expect(v).toBeFalsy();
      done();
    } catch (e) {
      done(e);
    }
  });
});

test('(1 pts) student test', (done) => {
  // adding to group that does not exist
  const newnode = {ip: '127.0.0.1', port: 9999};
  distribution.local.groups.add('nonexistant node', newnode, (e, v) => {
    try {
      expect(e).toBeDefined();
      expect(e).toBeInstanceOf(Error);
      done();
    } catch (error) {
      done(error);
    }
  });
});


test('(1 pts) student test', (done) => {
  // Fill out this test case...
  const newGroupCfg = {gid : "newgroup"}
  const id = distribution.util.id;
  const sid1 = id.getSID(n1);
  const sid2 = id.getSID(n2);
  const initialGroup = {sid1: n1, sid2: n2};
  const expectedGroup = {...initialGroup, [id.getSID(n6)]: n6};

  distribution.mygroup.groups.put(newGroupCfg, initialGroup, (e,v) => {
    distribution.mygroup.groups.add("newgroup", n6, (e,v) => {
      try {
        expect(e).toEqual({});
        for (const sid of Object.keys(mygroupGroup)) {
          expect(v[sid]).toBeDefined();
          for (const nodeSid of Object.keys(expectedGroup)) {
            expect(v[sid][nodeSid]).toBeDefined();
            expect(v[sid][nodeSid].ip).toEqual(expectedGroup[nodeSid].ip);
            expect(v[sid][nodeSid].port).toEqual(expectedGroup[nodeSid].port);
          }
        }
        done();
      } catch (e) {
        done(e);
      }
    });
  });
});
test('benchmarking spawn', (done) => {
  let completed = 0;
  let totalLatency = 0;

  for (let i = 0; i < 100; i++) {
    const t0 = performance.now();
    const node = {ip: '127.0.0.1', port: 10000 + i};

    distribution.local.status.spawn(node, (e, v) => {
      const latency = performance.now() - t0;
      totalLatency += latency;
      completed++;

      if (completed === 100) {
        console.log(`Average spawn latency: ${totalLatency / 100} ms`);
        done();
      }
    });
  }
}, 500000);

beforeAll((done) => {
  // First, stop the nodes if they are running
  const remote = {service: 'status', method: 'stop'};

  remote.node = n1;
  distribution.local.comm.send([], remote, (e, v) => {
    remote.node = n2;
    distribution.local.comm.send([], remote, (e, v) => {
      remote.node = n3;
      distribution.local.comm.send([], remote, (e, v) => {
        remote.node = n4;
        distribution.local.comm.send([], remote, (e, v) => {
          remote.node = n5;
          distribution.local.comm.send([], remote, (e, v) => {
            remote.node = n6;
            distribution.local.comm.send([], remote, (e, v) => {
              startNodes();
            });
          });
        });
      });
    });
  });

  const startNodes = () => {
    mygroupGroup[id.getSID(n1)] = n1;
    mygroupGroup[id.getSID(n2)] = n2;
    mygroupGroup[id.getSID(n3)] = n3;
    mygroupGroup[id.getSID(n4)] = n4;
    mygroupGroup[id.getSID(n5)] = n5;


    const groupInstantiation = () => {
      // Create the groups
      distribution.local.groups
          .put(mygroupConfig, mygroupGroup, (e, v) => {
            if (e) {
              done(e);
              return;
            }
            done();
          });
    };

    
    // Now, start the nodes listening node
    distribution.node.start((e) => {
      if (e) {
        done(e);
        return;
      }
      // Start the nodes
      distribution.local.status.spawn(n1, (e, v) => {
        if (e) {
          done(e);
          return;
        }
        distribution.local.status.spawn(n2, (e, v) => {
          if (e) {
            done(e);
            return;
          }
          distribution.local.status.spawn(n3, (e, v) => {
            if (e) {
              done(e);
              return;
            }
            distribution.local.status.spawn(n4, (e, v) => {
              if (e) {
                done(e);
                return;
              }
              distribution.local.status.spawn(n5, (e, v) => {
                if (e) {
                  done(e);
                  return;
                }
                distribution.local.status.spawn(n6, (e, v) => {
                  if (e) {
                    done(e);
                    return;
                  }
                  groupInstantiation();
                });
              });
            });
          });
        });
      });
    }); ;
  };
});

afterAll((done) => {
  const remote = {service: 'status', method: 'stop'};
  remote.node = n1;
  distribution.local.comm.send([], remote, (e, v) => {
    remote.node = n2;
    distribution.local.comm.send([], remote, (e, v) => {
      remote.node = n3;
      distribution.local.comm.send([], remote, (e, v) => {
        remote.node = n4;
        distribution.local.comm.send([], remote, (e, v) => {
          remote.node = n5;
          distribution.local.comm.send([], remote, (e, v) => {
            remote.node = n6;
            distribution.local.comm.send([], remote, (e, v) => {
              if (globalThis.distribution.node.server) {
                globalThis.distribution.node.server.close();
              }
              done();
            });
          });
        });
      });
    });
  });
});
