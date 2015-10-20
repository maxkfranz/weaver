## Description

The purpose of this function is to reference a variable in the thread explicitly.  This avoids [minification from mangling references](#thread/minification) to things you have required via `thread.require()` or to thread globals like `resolve()` or `broadcast()`.


## Examples

```js
function foo(){
  return 'bar';
}

var t = weaver.thread();

t.require( foo, 'foo' ); // explicitly specify name to avoid minification issues

t.run(function(){
   // explicitly get by reference to avoid minification issues:
  var foo = _ref_('foo');
  var resolve = _ref_('resolve');

  resolve( foo() );
}).then(function( val ){
  console.log( val ); // bar
});
```
