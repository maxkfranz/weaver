## Examples

```js
var t = weaver.thread();

t.one('run', function(){
  console.log('run (once)');
});

t.run(function(){
  return 'some response';
}).then(function( res ){
  console.log('got run x1 response: ' + res);

  return t.run(function(){
    return 'some other message';
  });
}).then(function( res ){
  console.log('got run x2 response: ' + res);

  t.stop();
});
```
