A thread is a reusable object for purposes of concurrency.  It gives a simple and concise API that is consistent across JS environments (using WebWorkers on browsers and forked child processes on Node.js).

A thread can be created as follows:

```js
var thread = weaver.thread();
```

The `new` keyword and class-style uppercase naming are optional, so you may alternatively do as follows:

```js
var thread = new weaver.Thread();
```
