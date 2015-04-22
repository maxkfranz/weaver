## Examples

```js
var t = weaver.thread();

t.on('run', function(){
  console.log('run');
});

t.pass([1, 2, 3]).run(function( arr ){
  return arr[0] + arr[arr.length - 1];
}).then(function( res ){
  console.log('got run response: ' + res);

  t.stop();
});
```
