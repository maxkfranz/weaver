function _ref_(o){ return eval(o); };
function broadcast(m){ return message(m); }; // alias
function message(m){ postMessage(m); };
function listen(fn){
  addEventListener("message", function(m){
    if( typeof m === "object" && (m.data.$$eval || m.data === "$$start") ){
    } else {
      fn( m.data );
    }
  });
};
addEventListener("message", function(m){  if( m.data.$$eval ){ eval( m.data.$$eval ); }  });
function resolve(v){ console.log('resolve', v); postMessage({ $$resolve: v }); console.log('postme') };
function reject(v){ postMessage({ $$reject: v }); };
