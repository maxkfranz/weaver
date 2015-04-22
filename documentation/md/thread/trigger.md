## Examples

```js
var t = weaver.thread();

t.on('foo', function(){
  console.log('foo!');
});

t.trigger('foo');
```
