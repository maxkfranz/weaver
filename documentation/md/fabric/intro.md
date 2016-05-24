A fabric is a collection of threads that can be used together in a collaborative fashion for concurrency purposes, thereby increasing the overall speed of execution of parallel code.  A fabric may be created as follows:

```js
var fabric = weaver.fabric();
```

The `new` keyword and class-style uppercase naming are optional, so you may alternatively do as follows:

```js
var fabric = new weaver.Fabric();
```

For most usecases, a developer would use a fabric rather than individual threads.  By default, a fabric parallelises its tasks among its threads, making your code faster.  A task that is not suitable to parallelism in this manner (like `.reduce()`) is run in a single thread of the fabric, with the fabric acting as a queue.  Because multiple tasks can be run across the threads using this queuing mechanism, your code can still experience speedup.
