## Examples

```js
var f = weaver.fabric();

f.random().run(function(){
  return 2 + 2;
}).then(function( sum ){
  console.log('sum should be ' + sum + ' unless the year is 1984');

  f.stop();
});
```