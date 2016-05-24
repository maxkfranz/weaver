Expensive calculations can make your app painfully slow for your users. You can make parallelisable code much faster by using Weaver.js, making your app snappier and your users happier.



## Factsheet

 * Allows for both low level thread management and higher level thread management via fabrics
 * Permissive open source license (MIT)
 * Dependency free
 * Compatible with
  * All modern browsers
  * CommonJS/Node.js
  * AMD/Require.js
  * npm
  * Bower
  * spm
  * Meteor/Atmosphere
 * Has a full suite of unit tests that can be run in the browser or the terminal
 * Documentation includes live code examples, doubling as an interactive requirements specification
 * Threads and fabrics are reusable
 * Allows passing data to threads and fabrics
 * Allows requiring external functions
 * Uses promises to make managing your asynchronous workflows easier (and includes a small, internal polyfil for promiseless browsers)
 * Includes concurrent versions of popular array functions
 * Chainable for convenience
 * Falls back on no-threads implementation for environments that do not support concurrency
 * Well maintained, with only a sliver of active bug time (i.e. minimised time to bugfix)



## About

Weaver.js is an open-source concurrency library written in JavaScript.  You can use Weaver.js for speeding up your code where parallelisation applies.

Weaver.js is an open-source project, and anyone is free to contribute.  For more information, refer to the [GitHub README](https://github.com/maxkfranz/weaver).

Weaver.js was designed and developed by [Max Franz](http://maxfranz.org).

The .js.org domain for Weaver is provided gratis by [JS.ORG](http://js.org).



## Packages

* npm : `npm install weaverjs`
* Bower : `bower install weaverjs`
* spm : `spm install weaverjs`
* Meteor/Atmosphere : `meteor add maxkfranz:weaver`
