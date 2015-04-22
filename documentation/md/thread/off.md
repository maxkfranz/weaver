## Examples

```js
var t = weaver.thread();

t.on('run', function(){
  console.log('run');
});

t.run(function(){
  return 'the first response';
}).then(function( res ){
  console.log('got run response: ' + res);

  t.off('run'); // so the 2nd one isn't triggered...
}).then(function(){
  return t.run(function(){
    return 'the second response';
  });
}).then(function(){
  t.stop();
});
```
