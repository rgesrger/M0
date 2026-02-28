/*
    In this file, add your own test cases that correspond to functionality introduced for each milestone.
    You should fill out each test case so it adequately tests the functionality you implemented.
    You are left to decide what the complexity of each test case should be, but trivial test cases that abuse this flexibility might be subject to deductions.

    Imporant: Do not modify any of the test headers (i.e., the test('header', ...) part). Doing so will result in grading penalties.
*/

const distribution = require('../../distribution.js')();
const id = distribution.util.id;
require('../helpers/sync-guard');

test('(1 pts) student test', (done) => {
  const user = {first: 'a', last: 'b'};
  const key = 'jcarbmpg';

  distribution.local.mem.put(user, key, (e, v) => {
    distribution.local.mem.get("a", (e, v) => {
      try {
        expect(e).toBeInstanceOf(Error);
        done();
      } catch (error) {
        done(error);
      }
    });
  });
});


test('(1 pts) student test', (done) => {
  const key = 'a';
  const value = {b: 'c', d: 1};
  distribution.mygroup.store.put(value, key, (e, v) => {
    expect(e).toBeFalsy(); 
    
    distribution.mygroup.store.get(key, (e, returnedValue) => {
      expect(e).toBeFalsy();
      expect(returnedValue).toEqual(value); 
      done();
    });
  });
});


test('(1 pts) student test', (done) => {
  // delete twice
  const key = 'nonexistant';
  const value = 'delete';

  distribution.mygroup.store.put(value, key, (e, v) => {
    expect(e).toBeFalsy();
    distribution.mygroup.store.del(key, (e, v) => {
      expect(e).toBeFalsy();
      distribution.mygroup.store.get(key, (e, v) => {
        expect(e).toBeTruthy(); 
        done();
      });
    });
  });
});

test('(1 pts) student test', (done) => {
  const key = 'a';
  const value = { b: 1, c: 'd' };

  // use rendevouz hash for mem
  distribution.mygroupB.mem.put(value, key, (e, v) => {
    expect(e).toBeFalsy(); 

    distribution.mygroupB.mem.get(key, (e, v) => {
      expect(e).toBeFalsy();
      expect(v).toEqual(value);
      done();
    });
  });
});

test('(1 pts) student test', (done) => {
  const key = 'a';
  const value = { b: 1, c: 'd' };
  // use consistent hash for mem
  distribution.mygroupC.mem.put(value, key, (e, v) => {
    expect(e).toBeFalsy(); 
    distribution.mygroupC.mem.get(key, (e, v) => {
      expect(e).toBeFalsy();
      expect(v).toEqual(value);
      done();
    });
  });
});


// use the setup in store.all.test
/*
    Following is the setup for the tests.
*/

const mygroupGroup = {};
const mygroupBGroup = {};
const mygroupCGroup = {};

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

beforeAll((done) => {
  // First, stop the nodes if they are running
  const remote = {service: 'status', method: 'stop'};

  const fs = require('fs');
  const path = require('path');

  fs.rmSync(path.join(__dirname, '../store'), {recursive: true, force: true});
  fs.mkdirSync(path.join(__dirname, '../store'));

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

    mygroupBGroup[id.getSID(n1)] = n1;
    mygroupBGroup[id.getSID(n2)] = n2;
    mygroupBGroup[id.getSID(n3)] = n3;
    mygroupBGroup[id.getSID(n4)] = n4;
    mygroupBGroup[id.getSID(n5)] = n5;

    mygroupCGroup[id.getSID(n1)] = n1;
    mygroupCGroup[id.getSID(n2)] = n2;
    mygroupCGroup[id.getSID(n3)] = n3;

    // Now, start the nodes listening node
    distribution.node.start((e) => {
      if (e) {
        done(e);
        return;
      }
      const groupInstantiation = () => {
        const mygroupConfig = {gid: 'mygroup'};
        const mygroupBConfig = {gid: 'mygroupB', hash: id.rendezvousHash};
        const mygroupCConfig = {gid: 'mygroupC', hash: id.consistentHash};

        // Create the groups
        distribution.local.groups.put(mygroupBConfig, mygroupBGroup, (e, v) => {
          distribution.local.groups.put(mygroupConfig, mygroupGroup, (e, v) => {
            distribution.mygroup.groups.put(mygroupConfig, mygroupGroup, (e, v) => {
              distribution.local.groups.put(mygroupCConfig, mygroupCGroup, (e, v) => {

              done();
              })
            });
          });
        });
      };

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
    });
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
