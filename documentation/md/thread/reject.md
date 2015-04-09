## Details

This function allows the developer to pass a single error value outside of the thread.


## Examples

```js
var t = weaver.thread();

t.promise(function(){
  reject( 'some reason' );
}).then(function( val ){
  // does not resolve

}, function( err ){
  console.log( 'thread rejected with `%s`', err );

  t.stop();
});
```