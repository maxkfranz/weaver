## Details

This function allows for pulling external code into the thread.  A thread can require

* a plain JSON-serialisable object,
* a function that does not reference externals (external functions or external objects),
* a function that references externals which have also been required,
* a simple object with a prototype, and
* external JS files.

To avoid [issues with minification](#thread/minification), it is necessary to explicitly specify the name of a required entity, e.g. `thread.require( foo, 'foo' )`.

## Examples

```js
var t = weaver.thread();

function foo(){
  return 'bar';
}

t.require( foo );

t.run(function(){
  var ret = foo();

  console.log( 't::foo() return value: ' + ret );

  broadcast( ret );
});

t.on('message', function( e ){
  var msg = e.message;
  var ret = msg;

  console.log( 'return value as heard by main JS thread/entity: ' + ret );

  t.stop();
});

```
