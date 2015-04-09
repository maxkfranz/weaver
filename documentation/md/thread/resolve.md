## Details

This function allows the developer to pass a single value outside of the thread.


## Examples

```js
var t = weaver.thread();

t.promise(function(){
  resolve( 3 );
}).then(function( val ){
  console.log( 'thread resolved with `%s`', val );

  t.stop();
});
```