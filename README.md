# distribution

This is the distribution library. 

## Environment Setup

We recommend using the prepared [container image](https://github.com/brown-cs1380/container).

## Installation

After you have setup your environment, you can start using the distribution library.
When loaded, distribution introduces functionality supporting the distributed execution of programs. To download it:

```sh
$ npm i '@brown-ds/distribution'
```

This command downloads and installs the distribution library.

## Testing

There are several categories of tests:
  *	Regular Tests (`*.test.js`)
  *	Scenario Tests (`*.scenario.js`)
  *	Extra Credit Tests (`*.extra.test.js`)
  * Student Tests (`*.student.test.js`) - inside `test/test-student`

### Running Tests

By default, all regular tests are run. Use the options below to run different sets of tests:

1. Run all regular tests (default): `$ npm test` or `$ npm test -- -t`
2. Run scenario tests: `$ npm test -- -c` 
3. Run extra credit tests: `$ npm test -- -ec`
4. Run the `non-distribution` tests: `$ npm test -- -nd`
5. Combine options: `$ npm test -- -c -ec -nd -t`

## Usage

To try out the distribution library inside an interactive Node.js session, run:

```sh
$ node
```

Then, load the distribution library:

```js
> let distribution = require("@brown-ds/distribution")();
> distribution.node.start(console.log);
```

Now you have access to the full distribution library. You can start off by serializing some values. 

```js
> s = distribution.util.serialize(1); // '{"type":"number","value":"1"}'
> n = distribution.util.deserialize(s); // 1
```

You can inspect information about the current node (for example its `sid`) by running:

```js
> distribution.local.status.get('sid', console.log); // null 8cf1b (null here is the error value; meaning there is no error)
```

You can also store and retrieve values from the local memory:

```js
> distribution.local.mem.put({name: 'nikos'}, 'key', console.log); // null {name: 'nikos'} (again, null is the error value) 
> distribution.local.mem.get('key', console.log); // null {name: 'nikos'}

> distribution.local.mem.get('wrong-key', console.log); // Error('Key not found') undefined
```

You can also spawn a new node:

```js
> node = { ip: '127.0.0.1', port: 8080 };
> distribution.local.status.spawn(node, console.log);
```

Using the `distribution.all` set of services will allow you to act 
on the full set of nodes created as if they were a single one.

```js
> distribution.all.status.get('sid', console.log); // {} { '8cf1b': '8cf1b', '8cf1c': '8cf1c' } (now, errors are per-node and form an object)
```

You can also send messages to other nodes:

```js
> distribution.local.comm.send(['sid'], {node: node, service: 'status', method: 'get'}, console.log); // null 8cf1c
```

Most methods in the distribution library are asynchronous and take a callback as their last argument.
This callback is invoked when the method completes, with the first argument being an error (if any) and the second argument being the result.
The following runs the sequence of commands described above inside a script (note the nested callbacks):

```js
let distribution = require("@brown-ds/distribution")();
// Now we're only doing a few of the things we did above
const out = (cb) => {
  distribution.local.status.stop(cb); // Shut down the local node
};
distribution.node.start(() => {
  // This will run only after the node has started
  const node = {ip: '127.0.0.1', port: 8765};
  distribution.local.status.spawn(node, (e, v) => {
    if (e) {
      return out(console.log);
    }
    // This will run only after the new node has been spawned
    distribution.all.status.get('sid', (e, v) => {
      // This will run only after we communicated with all nodes and got their sids
      console.log(v); // { '8cf1b': '8cf1b', '8cf1c': '8cf1c' }
      // Shut down the remote node
      distribution.local.comm.send([], {service: 'status', method: 'stop', node: node}, () => {
        // Finally, stop the local node
        out(console.log); // null, {ip: '127.0.0.1', port: 1380}
      });
    });
  });
});
```

# Results and Reflections
# M1: Serialization / Deserialization


## Summary
The implementation of serialization involves first providing serialization of primitive types through using toString and Stringify. More complex types of objects were handled by recursively calling serialize on each of the values in the object, which eventually reaches the base case of primitive types. Deserialization follows a very similar approach.

My implementation comprises 2 software components, totaling around 90 lines of code. Key challenges included figuring out how to serialize/deserialize more complex objects. This problem was solved by recursively calling serialize/deserialize on each of the values in the object. Another challenge was figuring out what information I could extract from the constructor of a lot of the objects such as functions, array, and errors. I solved this problem by searching online and on the documentation of related objects. In one scenario I found eval() to be easier to use than the Function constructor.


## Correctness & Performance Characterization


> Describe how you characterized the correctness and performance of your implementation


*Correctness*: I wrote 6 tests; these tests take 0.71 ms to execute (only for the ones where I tested the time on so actually 3 of them). This includes strings with quotations marks inside of them, basic objects, objects with empty arrays, basic primitives, and infinity.


*Performance*: The latency of various subsystems is described in the `"latency"` portion of package.json. The characteristics of my development machines are summarized in the `"dev"` portion of package.json.

# M2: Actors and Remote Procedure Calls (RPC)


## Summary

My implementation comprises 3 software components, totaling 150 (300 including testing code) lines of code. One of the components
is status, which uses the built in id function and process memory functions to provide information about the node. The counts
status was recorded by adding a msgcount global variable for node. Every time the node receives a message it will
increase the message counter by 1. 

The biggest challenges involved
getting the connection to work. At first, a lot of connections were closing instantly because I forgot to delete the callback(error)
that was initially written as the default. Later I realized that since the comm.send were async, I would need to wrap all the actions I
want to be done right after to be part of the callback.


## Correctness & Performance Characterization

> Describe how you characterized the correctness and performance of your implementation

*Correctness*: I wrote 5 tests; these tests take 1.237s to execute. They test for unexpected input types for status and route.
One test also tested whether counts was counting the messages correctly (based on how many messages the node processed
whether the message was successful or not).


*Performance*: I characterized the performance of comm and RPC by sending 1000 service requests in a tight loop. Average throughput and latency is recorded in `package.json`.


## Key Feature

> How would you explain the implementation of `createRPC` to someone who has no background in computer science — i.e., with the minimum jargon possible?

Suppose we have something we want to do (a function). We want to run the function on a computer 
somewhere else. When we call createRPC(f), it returns a new function g called a stub.
When someone runs g, it packages the arguments that we put into g to the function f
on the remote node. Since the remote node now has all the information necessary to execute f,
it may now execute it. After receiving the result, it has to package and send it back.
In summary, createRPC allows us to do some functionality on someone else's node.


# M3: Node Groups & Gossip Protocols


## Summary

The implementation consists of 5 software components: local.groups, all.groups, all.routes,all.status, all.comm, all.groups. 
Local.groups uses a map to keep track of the nodes that belong to each gid. When a group is put, local.groups also
instantiates the distribution.gid object and gives the distributed version of the service to it. During
this instantiation process, the config is also passed to each of the distributed services,
which allows us to use services in the form: distribution.gid.mygroup.comm.

all.comm involved getting each node within the gid (using context.gid) and sending a message to each node in the group.
Every other distributed service essentially involved using all.comm to perform operations on every node 
in the group.


## Correctness & Performance Characterization

> Describe how you characterized the correctness and performance of your implementation


*Correctness* -- number of tests and time they take.



## Key Feature

> What is the point of having a gossip protocol? Why doesn't a node just send the message to _all_ other nodes in its group?

An individual node sending the message to all other nodes would be much slower, especially if there are 
a lot of nodes. It would have a time complexity of O(n), where n is the number of nodes, whereas 
for gossip it would be O(log(n)).

There is also a single point of failure, since if the one broadcasting node fails in the middle, then many 
of the nodes would not receive the message.

# M4: Distributed Storage

## Summary

The mem service is implemented by keeping a local map. The put and get functionality puts and get keys based 
on their gid, so that even with the same key, if the gid is different different values will be accessed. This
was implemented by attaching the gid as the beginning of the string. Store works the same way as mem,
except it will save all of the information in the store folder. The value is additionally serialized to allow for
putting more complex objects such as arrays, and deserialized when getting.

The distributed versions of mem and store utilize the hash function to first decide which node to put the kv pair 
in, and use local.comm.send to call the local mem/store on the corresponding nodes.


