// this is put as a global var in the browser
// or it's just a global to this module if commonjs

var weaver;

(function(window){ 'use strict';

  // the object iteself is a function that init's an instance of weaver

  var $$ = weaver = function(){ // jshint ignore:line
    return;
  };

  $$.fn = {};

  $$.version = '{{VERSION}}';

  if( typeof module !== 'undefined' && module.exports ){ // expose as a commonjs module
    module.exports = weaver;
  }

  if( typeof define !== 'undefined' && define.amd ){ // expose as an amd/requirejs module
    define('weaver', function(){
      return weaver;
    });
  }

  // make sure we always register in the window just in case (e.g. w/ derbyjs)
  if( window ){
    window.weaver = weaver;
  }
  
})( typeof window === 'undefined' ? null : window );
