/*!
 * This file is part of Weaver.js 1.0.0-pre.
 * 
 * Weaver.js is free software: you can redistribute it and/or modify it
 * under the terms of the GNU Lesser General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or (at your option) any
 * later version.
 * 
 * Weaver.js is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE. See the GNU Lesser General Public License for more
 * details.
 * 
 * You should have received a copy of the GNU Lesser General Public License along with
 * Weaver.js. If not, see <http://www.gnu.org/licenses/>.
 */
 

// this is put as a global var in the browser
// or it's just a global to this module if commonjs

var weaver;

(function(window){ 'use strict';

  // the object iteself is a function that init's an instance of weaver

  var $$ = weaver = function(){ // jshint ignore:line
    return;
  };

  $$.fn = {};

  $$.version = '1.0.0-pre';

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

// internal, minimal Promise impl s.t. apis can return promises in old envs
// based on thenable (http://github.com/rse/thenable)

// NB: you must use `new $$.Promise`, because you may have native promises that don't autonew for you

;(function($$){ 'use strict';
  
  /*  promise states [Promises/A+ 2.1]  */
  var STATE_PENDING   = 0;                                         /*  [Promises/A+ 2.1.1]  */
  var STATE_FULFILLED = 1;                                         /*  [Promises/A+ 2.1.2]  */
  var STATE_REJECTED  = 2;                                         /*  [Promises/A+ 2.1.3]  */

  /*  promise object constructor  */
  var api = function (executor) {
    /*  optionally support non-constructor/plain-function call  */
    if (!(this instanceof api))
      return new api(executor);

    /*  initialize object  */
    this.id           = "Thenable/1.0.7";
    this.state        = STATE_PENDING; /*  initial state  */
    this.fulfillValue = undefined;     /*  initial value  */     /*  [Promises/A+ 1.3, 2.1.2.2]  */
    this.rejectReason = undefined;     /*  initial reason */     /*  [Promises/A+ 1.5, 2.1.3.2]  */
    this.onFulfilled  = [];            /*  initial handlers  */
    this.onRejected   = [];            /*  initial handlers  */

    /*  provide optional information-hiding proxy  */
    this.proxy = {
      then: this.then.bind(this)
    };

    /*  support optional executor function  */
    if (typeof executor === "function")
      executor.call(this, this.fulfill.bind(this), this.reject.bind(this));
  };

  /*  promise API methods  */
  api.prototype = {
    /*  promise resolving methods  */
    fulfill: function (value) { return deliver(this, STATE_FULFILLED, "fulfillValue", value); },
    reject:  function (value) { return deliver(this, STATE_REJECTED,  "rejectReason", value); },

    /*  "The then Method" [Promises/A+ 1.1, 1.2, 2.2]  */
    then: function (onFulfilled, onRejected) {
      var curr = this;
      var next = new api();                                    /*  [Promises/A+ 2.2.7]  */
      curr.onFulfilled.push(
        resolver(onFulfilled, next, "fulfill"));             /*  [Promises/A+ 2.2.2/2.2.6]  */
      curr.onRejected.push(
        resolver(onRejected,  next, "reject" ));             /*  [Promises/A+ 2.2.3/2.2.6]  */
      execute(curr);
      return next.proxy;                                       /*  [Promises/A+ 2.2.7, 3.3]  */
    }
  };

  /*  deliver an action  */
  var deliver = function (curr, state, name, value) {
    if (curr.state === STATE_PENDING) {
      curr.state = state;                                      /*  [Promises/A+ 2.1.2.1, 2.1.3.1]  */
      curr[name] = value;                                      /*  [Promises/A+ 2.1.2.2, 2.1.3.2]  */
      execute(curr);
    }
    return curr;
  };

  /*  execute all handlers  */
  var execute = function (curr) {
    if (curr.state === STATE_FULFILLED)
      execute_handlers(curr, "onFulfilled", curr.fulfillValue);
    else if (curr.state === STATE_REJECTED)
      execute_handlers(curr, "onRejected",  curr.rejectReason);
  };

  /*  execute particular set of handlers  */
  var execute_handlers = function (curr, name, value) {
    /* global process: true */
    /* global setImmediate: true */
    /* global setTimeout: true */

    /*  short-circuit processing  */
    if (curr[name].length === 0)
      return;

    /*  iterate over all handlers, exactly once  */
    var handlers = curr[name];
    curr[name] = [];                                             /*  [Promises/A+ 2.2.2.3, 2.2.3.3]  */
    var func = function () {
      for (var i = 0; i < handlers.length; i++)
        handlers[i](value);                                  /*  [Promises/A+ 2.2.5]  */
    };

    /*  execute procedure asynchronously  */                     /*  [Promises/A+ 2.2.4, 3.1]  */
    if (typeof process === "object" && typeof process.nextTick === "function")
      process.nextTick(func);
    else if (typeof setImmediate === "function")
      setImmediate(func);
    else
      setTimeout(func, 0);
  };

  /*  generate a resolver function  */
  var resolver = function (cb, next, method) {
    return function (value) {
      if (typeof cb !== "function")                            /*  [Promises/A+ 2.2.1, 2.2.7.3, 2.2.7.4]  */
        next[method].call(next, value);                      /*  [Promises/A+ 2.2.7.3, 2.2.7.4]  */
      else {
        var result;
        try { result = cb(value); }                          /*  [Promises/A+ 2.2.2.1, 2.2.3.1, 2.2.5, 3.2]  */
        catch (e) {
          next.reject(e);                                  /*  [Promises/A+ 2.2.7.2]  */
          return;
        }
        resolve(next, result);                               /*  [Promises/A+ 2.2.7.1]  */
      }
    };
  };

  /*  "Promise Resolution Procedure"  */                           /*  [Promises/A+ 2.3]  */
  var resolve = function (promise, x) {
    /*  sanity check arguments  */                               /*  [Promises/A+ 2.3.1]  */
    if (promise === x || promise.proxy === x) {
      promise.reject(new TypeError("cannot resolve promise with itself"));
      return;
    }

    /*  surgically check for a "then" method
      (mainly to just call the "getter" of "then" only once)  */
    var then;
    if ((typeof x === "object" && x !== null) || typeof x === "function") {
      try { then = x.then; }                                   /*  [Promises/A+ 2.3.3.1, 3.5]  */
      catch (e) {
        promise.reject(e);                                   /*  [Promises/A+ 2.3.3.2]  */
        return;
      }
    }

    /*  handle own Thenables    [Promises/A+ 2.3.2]
      and similar "thenables" [Promises/A+ 2.3.3]  */
    if (typeof then === "function") {
      var resolved = false;
      try {
        /*  call retrieved "then" method */                  /*  [Promises/A+ 2.3.3.3]  */
        then.call(x,
          /*  resolvePromise  */                           /*  [Promises/A+ 2.3.3.3.1]  */
          function (y) {
            if (resolved) return; resolved = true;       /*  [Promises/A+ 2.3.3.3.3]  */
            if (y === x)                                 /*  [Promises/A+ 3.6]  */
              promise.reject(new TypeError("circular thenable chain"));
            else
              resolve(promise, y);
          },

          /*  rejectPromise  */                            /*  [Promises/A+ 2.3.3.3.2]  */
          function (r) {
            if (resolved) return; resolved = true;       /*  [Promises/A+ 2.3.3.3.3]  */
            promise.reject(r);
          }
        );
      }
      catch (e) {
        if (!resolved)                                       /*  [Promises/A+ 2.3.3.3.3]  */
          promise.reject(e);                               /*  [Promises/A+ 2.3.3.3.4]  */
      }
      return;
    }

    /*  handle other values  */
    promise.fulfill(x);                                          /*  [Promises/A+ 2.3.4, 2.3.3.4]  */
  };

  // use native promises where possible
  $$.Promise = typeof Promise === 'undefined' ? api : Promise;

  // so we always have Promise.all()
  $$.Promise.all = $$.Promise.all || function( ps ){
    return new $$.Promise(function( resolveAll, rejectAll ){
      var vals = new Array( ps.length );
      var doneCount = 0;

      var fulfill = function( i, val ){
        vals[i] = val;
        doneCount++;

        if( doneCount === ps.length ){
          resolveAll( vals );
        }
      };

      for( var i = 0; i < ps.length; i++ ){
        (function( i ){
          var p = ps[i];
          var isPromise = p.then != null;

          if( isPromise ){
            p.then(function( val ){
              fulfill( i, val );
            }, function( err ){
              rejectAll( err );
            });
          } else {
            var val = p;
            fulfill( i, val );
          }
        })( i );
      }

    });
  };

})( weaver );
// type testing utility functions

;(function($$, window){ 'use strict';

  var typeofstr = typeof '';
  var typeofobj = typeof {};
  var typeoffn = typeof function(){};

  $$.is = {
    defined: function(obj){
      return obj != null; // not undefined or null
    },

    string: function(obj){
      return obj != null && typeof obj == typeofstr;
    },
    
    fn: function(obj){
      return obj != null && typeof obj === typeoffn;
    },
    
    array: function(obj){
      return Array.isArray ? Array.isArray(obj) : obj != null && obj instanceof Array;
    },
    
    plainObject: function(obj){
      return obj != null && typeof obj === typeofobj && !$$.is.array(obj) && obj.constructor === Object;
    },

    object: function(obj){
      return obj != null && typeof obj === typeofobj;
    },
    
    number: function(obj){
      return obj != null && typeof obj === typeof 1 && !isNaN(obj);
    },

    integer: function( obj ){
      return $$.is.number(obj) && Math.floor(obj) === obj;
    },
    
    bool: function(obj){
      return obj != null && typeof obj === typeof true;
    },

    event: function(obj){
      return obj instanceof $$.Event;
    },

    thread: function(obj){
      return obj instanceof $$.Thread;
    },

    fabric: function(obj){
      return obj instanceof $$.Fabric;
    },

    emptyString: function(obj){
      if( !obj ){ // null is empty
        return true; 
      } else if( $$.is.string(obj) ){
        if( obj === '' || obj.match(/^\s+$/) ){
          return true; // empty string is empty
        }
      }
      
      return false; // otherwise, we don't know what we've got
    },
    
    nonemptyString: function(obj){
      if( obj && $$.is.string(obj) && obj !== '' && !obj.match(/^\s+$/) ){
        return true;
      }

      return false;
    },

    domElement: function(obj){
      if( typeof HTMLElement === 'undefined' ){
        return false; // we're not in a browser so it doesn't matter
      } else {
        return obj instanceof HTMLElement;
      }
    },

    promise: function(obj){
      return $$.is.object(obj) && $$.is.fn(obj.then);
    },

    touch: function(){
      return window && ( ('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch );
    },

    gecko: function(){
      return typeof InstallTrigger !== 'undefined' || ('MozAppearance' in document.documentElement.style);
    },

    webkit: function(){
      return typeof webkitURL !== 'undefined' || ('WebkitAppearance' in document.documentElement.style);
    },

    chromium: function(){
      return typeof chrome !== 'undefined';
    },

    khtml: function(){
      return navigator.vendor.match(/kde/i); // TODO probably a better way to detect this...
    },

    khtmlEtc: function(){
      return $$.is.khtml() || $$.is.webkit() || $$.is.blink();
    },

    trident: function(){
       return typeof ActiveXObject !== 'undefined' || /*@cc_on!@*/false;
    },

    windows: function(){
      return typeof navigator !== 'undefined' && navigator.appVersion.match(/Win/i);
    },

    mac: function(){
      return typeof navigator !== 'undefined' && navigator.appVersion.match(/Mac/i);
    },

    linux: function(){
      return typeof navigator !== 'undefined' && navigator.appVersion.match(/Linux/i);
    },

    unix: function(){
      return typeof navigator !== 'undefined' && navigator.appVersion.match(/X11/i);
    }
  };  
  
})( weaver, typeof window === 'undefined' ? null : window );

;(function($$, window){ 'use strict';
  
  // utility functions only for internal use

  $$.util = {

    // the jquery extend() function
    // NB: modified to use $$.is etc since we can't use jquery functions
    extend: function() {
      var options, name, src, copy, copyIsArray, clone,
        target = arguments[0] || {},
        i = 1,
        length = arguments.length,
        deep = false;

      // Handle a deep copy situation
      if ( typeof target === 'boolean' ) {
        deep = target;
        target = arguments[1] || {};
        // skip the boolean and the target
        i = 2;
      }

      // Handle case when target is a string or something (possible in deep copy)
      if ( typeof target !== 'object' && !$$.is.fn(target) ) {
        target = {};
      }

      // extend jQuery itself if only one argument is passed
      if ( length === i ) {
        target = this;
        --i;
      }

      for ( ; i < length; i++ ) {
        // Only deal with non-null/undefined values
        if ( (options = arguments[ i ]) != null ) {
          // Extend the base object
          for ( name in options ) {
            src = target[ name ];
            copy = options[ name ];

            // Prevent never-ending loop
            if ( target === copy ) {
              continue;
            }

            // Recurse if we're merging plain objects or arrays
            if ( deep && copy && ( $$.is.plainObject(copy) || (copyIsArray = $$.is.array(copy)) ) ) {
              if ( copyIsArray ) {
                copyIsArray = false;
                clone = src && $$.is.array(src) ? src : [];

              } else {
                clone = src && $$.is.plainObject(src) ? src : {};
              }

              // Never move original objects, clone them
              target[ name ] = $$.util.extend( deep, clone, copy );

            // Don't bring in undefined values
            } else if ( copy !== undefined ) {
              target[ name ] = copy;
            }
          }
        }
      }

      // Return the modified object
      return target;
    },

    error: function( msg ){
      if( console ){
        if( console.error ){
          console.error.apply( console, arguments );
        } else if( console.log ){
          console.log.apply( console, arguments );
        } else {
          throw msg;
        }
      } else {
        throw msg;
      }
    }
  };

})( weaver, typeof window === 'undefined' ? null : window  );

;(function($$){ 'use strict';
  
  // shamelessly taken from jQuery
  // https://github.com/jquery/jquery/blob/master/src/event.js

  $$.Event = function( src, props ) {
    // Allow instantiation without the 'new' keyword
    if ( !(this instanceof $$.Event) ) {
      return new $$.Event( src, props );
    }

    // Event object
    if ( src && src.type ) {
      this.originalEvent = src;
      this.type = src.type;

      // Events bubbling up the document may have been marked as prevented
      // by a handler lower down the tree; reflect the correct value.
      this.isDefaultPrevented = ( src.defaultPrevented ) ? returnTrue : returnFalse;

    // Event type
    } else {
      this.type = src;
    }

    // Put explicitly provided properties onto the event object
    if ( props ) {
      // $$.util.extend( this, props );

      // more efficient to manually copy fields we use
      this.type = props.type !== undefined ? props.type : this.type;
      this.namespace = props.namespace;
      this.layout = props.layout;
      this.data = props.data;
      this.message = props.message;
    }

    // Create a timestamp if incoming event doesn't have one
    this.timeStamp = src && src.timeStamp || +new Date();
  };

  function returnFalse() {
    return false;
  }
  function returnTrue() {
    return true;
  }

  // jQuery.Event is based on DOM3 Events as specified by the ECMAScript Language Binding
  // http://www.w3.org/TR/2003/WD-DOM-Level-3-Events-20030331/ecma-script-binding.html
  $$.Event.prototype = {
    preventDefault: function() {
      this.isDefaultPrevented = returnTrue;

      var e = this.originalEvent;
      if ( !e ) {
        return;
      }

      // if preventDefault exists run it on the original event
      if ( e.preventDefault ) {
        e.preventDefault();
      }
    },
    stopPropagation: function() {
      this.isPropagationStopped = returnTrue;

      var e = this.originalEvent;
      if ( !e ) {
        return;
      }
      // if stopPropagation exists run it on the original event
      if ( e.stopPropagation ) {
        e.stopPropagation();
      }
    },
    stopImmediatePropagation: function() {
      this.isImmediatePropagationStopped = returnTrue;
      this.stopPropagation();
    },
    isDefaultPrevented: returnFalse,
    isPropagationStopped: returnFalse,
    isImmediatePropagationStopped: returnFalse
  };
  
  
})( weaver );

;(function($$){ 'use strict';

  // use this module to cherry pick functions into your prototype
  // (useful for functions shared between the core and collections, for example)

  // e.g.
  // $$.fn.collection({
  //   foo: $$.define.foo({ /* params... */ })
  // });

  $$.define = {

    // event function reusable stuff
    event: {
      regex: /(\w+)(\.\w+)?/, // regex for matching event strings (e.g. "click.namespace")
      optionalTypeRegex: /(\w+)?(\.\w+)?/,
      falseCallback: function(){ return false; }
    },

    // event binding
    on: function( params ){
      var defaults = {
        unbindSelfOnTrigger: false,
        unbindAllBindersOnTrigger: false
      };
      params = $$.util.extend({}, defaults, params);
      
      return function onImpl(events, data, callback){
        var self = this;
        var selfIsArrayLike = self.length !== undefined;
        var all = selfIsArrayLike ? self : [self]; // put in array if not array-like
        var eventsIsString = $$.is.string(events);
        var p = params;

        if( $$.is.fn(data) || data === false ){ // data is actually callback
          callback = data;
          data = undefined;
        }

        // if there isn't a callback, we can't really do anything
        // (can't speak for mapped events arg version)
        if( !($$.is.fn(callback) || callback === false) && eventsIsString ){
          return self; // maintain chaining
        }

        if( eventsIsString ){ // then convert to map
          var map = {};
          map[ events ] = callback;
          events = map;
        }

        for( var evts in events ){
          callback = events[evts];
          if( callback === false ){
            callback = $$.define.event.falseCallback;
          }

          if( !$$.is.fn(callback) ){ continue; }

          evts = evts.split(/\s+/);
          for( var i = 0; i < evts.length; i++ ){
            var evt = evts[i];
            if( $$.is.emptyString(evt) ){ continue; }

            var match = evt.match( $$.define.event.regex ); // type[.namespace]

            if( match ){
              var type = match[1];
              var namespace = match[2] ? match[2] : undefined;

              var listener = {
                callback: callback, // callback to run
                data: data, // extra data in eventObj.data
                type: type, // the event type (e.g. 'click')
                namespace: namespace, // the event namespace (e.g. ".foo")
                unbindSelfOnTrigger: p.unbindSelfOnTrigger,
                unbindAllBindersOnTrigger: p.unbindAllBindersOnTrigger,
                binders: all // who bound together
              };

              for( var j = 0; j < all.length; j++ ){
                var _p = all[j]._private;

                _p.listeners = _p.listeners || [];
                _p.listeners.push( listener );
              }
            }
          } // for events array
        } // for events map
        
        return self; // maintain chaining
      }; // function
    }, // on

    eventAliasesOn: function( proto ){
      var p = proto;

      p.addListener = p.listen = p.bind = p.on;
      p.removeListener = p.unlisten = p.unbind = p.off;
      p.emit = p.trigger;

      // this is just a wrapper alias of .on()
      p.pon = p.promiseOn = function( events, selector ){
        var self = this;
        var args = Array.prototype.slice.call( arguments, 0 );

        return new $$.Promise(function( resolve, reject ){
          var callback = function( e ){
            self.off.apply( self, offArgs );

            resolve( e );
          };

          var onArgs = args.concat([ callback ]);
          var offArgs = onArgs.concat([]);

          self.on.apply( self, onArgs );
        });
      };
    },

    off: function offImpl( params ){
      var defaults = {
      };
      params = $$.util.extend({}, defaults, params);
      
      return function(events, callback){
        var self = this;
        var selfIsArrayLike = self.length !== undefined;
        var all = selfIsArrayLike ? self : [self]; // put in array if not array-like
        var eventsIsString = $$.is.string(events);

        if( arguments.length === 0 ){ // then unbind all

          for( var i = 0; i < all.length; i++ ){
            all[i]._private.listeners = [];
          }

          return self; // maintain chaining
        }

        if( eventsIsString ){ // then convert to map
          var map = {};
          map[ events ] = callback;
          events = map;
        }

        for( var evts in events ){
          callback = events[evts];

          if( callback === false ){
            callback = $$.define.event.falseCallback;
          }

          evts = evts.split(/\s+/);
          for( var h = 0; h < evts.length; h++ ){
            var evt = evts[h];
            if( $$.is.emptyString(evt) ){ continue; }

            var match = evt.match( $$.define.event.optionalTypeRegex ); // [type][.namespace]
            if( match ){
              var type = match[1] ? match[1] : undefined;
              var namespace = match[2] ? match[2] : undefined;

              for( var i = 0; i < all.length; i++ ){ //
                var listeners = all[i]._private.listeners = all[i]._private.listeners || [];

                for( var j = 0; j < listeners.length; j++ ){
                  var listener = listeners[j];
                  var nsMatches = !namespace || namespace === listener.namespace;
                  var typeMatches = !type || listener.type === type;
                  var cbMatches = !callback || callback === listener.callback;
                  var listenerMatches = nsMatches && typeMatches && cbMatches;

                  // delete listener if it matches
                  if( listenerMatches ){
                    listeners.splice(j, 1);
                    j--;
                  }
                } // for listeners
              } // for all
            } // if match
          } // for events array

        } // for events map
        
        return self; // maintain chaining
      }; // function
    }, // off

    trigger: function( params ){
      var defaults = {};
      params = $$.util.extend({}, defaults, params);
      
      return function triggerImpl(events, extraParams, fnToTrigger){
        var self = this;
        var selfIsArrayLike = self.length !== undefined;
        var all = selfIsArrayLike ? self : [self]; // put in array if not array-like
        var eventsIsString = $$.is.string(events);
        var eventsIsObject = $$.is.plainObject(events);
        var eventsIsEvent = $$.is.event(events);

        if( eventsIsString ){ // then make a plain event object for each event name
          var evts = events.split(/\s+/);
          events = [];

          for( var i = 0; i < evts.length; i++ ){
            var evt = evts[i];
            if( $$.is.emptyString(evt) ){ continue; }

            var match = evt.match( $$.define.event.regex ); // type[.namespace]
            var type = match[1];
            var namespace = match[2] ? match[2] : undefined;

            events.push( {
              type: type,
              namespace: namespace
            } );
          }
        } else if( eventsIsObject ){ // put in length 1 array
          var eventArgObj = events;

          events = [ eventArgObj ];
        }

        if( extraParams ){
          if( !$$.is.array(extraParams) ){ // make sure extra params are in an array if specified
            extraParams = [ extraParams ];
          }
        } else { // otherwise, we've got nothing
          extraParams = [];
        }

        for( var i = 0; i < events.length; i++ ){ // trigger each event in order
          var evtObj = events[i];
          
          for( var j = 0; j < all.length; j++ ){ // for each
            var triggerer = all[j];
            var listeners = triggerer._private.listeners = triggerer._private.listeners || [];
            var bubbleUp = false;

            // create the event for this element from the event object
            var evt;

            if( eventsIsEvent ){ // then just get the object
              evt = evtObj;

            } else { // then we have to make one
              evt = new $$.Event( evtObj, {
                namespace: evtObj.namespace
              } );
            }

            if( fnToTrigger ){ // then override the listeners list with just the one we specified
              listeners = [{
                namespace: evt.namespace,
                type: evt.type,
                callback: fnToTrigger
              }];
            }

            for( var k = 0; k < listeners.length; k++ ){ // check each listener
              var lis = listeners[k];
              var nsMatches = !lis.namespace || lis.namespace === evt.namespace;
              var typeMatches = lis.type === evt.type;
              var targetMatches = true;
              var listenerMatches = nsMatches && typeMatches && targetMatches;

              if( listenerMatches ){ // then trigger it
                var args = [ evt ];
                args = args.concat( extraParams ); // add extra params to args list

                if( lis.data ){ // add on data plugged into binding
                  evt.data = lis.data;
                } else { // or clear it in case the event obj is reused
                  evt.data = undefined;
                }

                if( lis.unbindSelfOnTrigger || lis.unbindAllBindersOnTrigger ){ // then remove listener
                  listeners.splice(k, 1);
                  k--;
                }

                if( lis.unbindAllBindersOnTrigger ){ // then delete the listener for all binders
                  var binders = lis.binders;
                  for( var l = 0; l < binders.length; l++ ){
                    var binder = binders[l];
                    if( !binder || binder === triggerer ){ continue; } // already handled triggerer or we can't handle it

                    var binderListeners = binder._private.listeners;
                    for( var m = 0; m < binderListeners.length; m++ ){
                      var binderListener = binderListeners[m];

                      if( binderListener === lis ){ // delete listener from list
                        binderListeners.splice(m, 1);
                        m--;
                      }
                    }
                  }
                }

                // run the callback
                var context = triggerer;
                var ret = lis.callback.apply( context, args );

                if( ret === false || evt.isPropagationStopped() ){
                  // then don't bubble
                  bubbleUp = false;

                  if( ret === false ){
                    // returning false is a shorthand for stopping propagation and preventing the def. action
                    evt.stopPropagation();
                    evt.preventDefault();
                  }
                }
              } // if listener matches
            } // for each listener

            if( bubbleUp ){
              // TODO if bubbling is supported...
            }

          } // for each of all
        } // for each event
        
        return self; // maintain chaining
      }; // function
    } // trigger

  }; // define

  
})( weaver );

// cross-env thread/worker
// NB : uses (heavyweight) processes on nodejs so best not to create too many threads

;(function($$, window){ 'use strict';

  $$.Thread = function( fn ){
    if( !(this instanceof $$.Thread) ){
      return new $$.Thread( fn );
    }

    var _p = this._private = {
      requires: [],
      queue: null,
      pass: []
    };

    if( fn ){
      this.run( fn );
    }

  };

  $$.thread = $$.Thread;
  $$.thdfn = $$.Thread.prototype; // short alias

  $$.fn.thread = function( fnMap, options ){
    for( var name in fnMap ){
      var fn = fnMap[name];
      $$.Thread.prototype[ name ] = fn;
    }
  };

  var stringifyFieldVal = function( val ){
    var valStr = $$.is.fn( val ) ? val.toString() : 'JSON.parse("' + JSON.stringify(val) + '")';

    return valStr;
  };

  // allows for requires with prototypes and subobjs etc
  var fnAsRequire = function( fn ){
    var req;
    var fnName;

    if( $$.is.object(fn) && fn.fn ){ // manual fn
      req = fnAs( fn.fn, fn.name );
      fnName = fn.name;
      fn = fn.fn;
    } else if( $$.is.fn(fn) ){ // auto fn
      req = fn.toString();
      fnName = fn.name;
    } else if( $$.is.string(fn) ){ // stringified fn
      req = fn;
    } else if( $$.is.object(fn) ){ // plain object
      if( fn.proto ){
        req = '';
      } else {
        req = fn.name + ' = {};';
      }

      fnName = fn.name;
      fn = fn.obj;
    }

    req += '\n';

    var protoreq = function( val, subname ){
      if( val.prototype ){
        var protoNonempty = false;
        for( var prop in val.prototype ){ protoNonempty = true; break; };

        if( protoNonempty ){
          req += fnAsRequire( {
            name: subname,
            obj: val,
            proto: true
          }, val );
        }
      }
    };

    // pull in prototype
    if( fn.prototype && fnName != null ){

      for( var name in fn.prototype ){
        var protoStr = '';

        var val = fn.prototype[ name ];
        var valStr = stringifyFieldVal( val );
        var subname = fnName + '.prototype.' + name;

        protoStr += subname + ' = ' + valStr + ';\n';

        if( protoStr ){
          req += protoStr;
        }

        protoreq( val, subname ); // subobject with prototype
      }
  
    }

    // pull in properties for obj/fns
    if( !$$.is.string(fn) ){ for( var name in fn ){
      var propsStr = '';

      if( fn.hasOwnProperty(name) ){
        var val = fn[ name ];
        var valStr = stringifyFieldVal( val );
        var subname = fnName + '["' + name + '"]';

        propsStr += subname + ' = ' + valStr + ';\n';
      }

      if( propsStr ){
        req += propsStr;
      }

      protoreq( val, subname ); // subobject with prototype
    } }

    return req;
  };

  $$.fn.thread({

    require: function( fn, as ){
      if( as ){
        if( $$.is.fn(fn) ){
          // disabled b/c doesn't work with forced names on functions w/ prototypes
          //fn = fnAs( fn, as );

          as = as || fn.name;

          fn = { name: as, fn: fn };
        } else {
          fn = { name: as, obj: fn };
        }
      }

      this._private.requires.push( fn );

      return this; // chaining
    },

    pass: function( data ){
      this._private.pass.push( data );

      return this; // chaining
    },

    run: function( fn, pass ){ // fn used like main()
      var self = this;
      var _p = this._private;
      pass = pass || _p.pass.shift();

      if( _p.stopped ){
        $$.util.error('Attempted to run a stopped thread!  Start a new thread or do not stop the existing thread and reuse it.');
        return;
      }

      if( _p.running ){
        return _p.queue = _p.queue.then(function(){ // inductive step
          return self.run( fn, pass );
        });
      }

      self.trigger('run');

      var runP = new $$.Promise(function( resolve, reject ){

        _p.running = true;

        var threadTechAlreadyExists = _p.ran;

        var fnImplStr = $$.is.string( fn ) ? fn : fn.toString();

        // worker code to exec
        var fnStr = '\n' + ( _p.requires.map(function( r ){
          return fnAsRequire( r );
        }) ).concat([
          '( function(){',
            'var ret = (' + fnImplStr + ')(' + JSON.stringify(pass) + ');',
            'if( ret !== undefined ){ resolve(ret); }', // assume if ran fn returns defined value (incl. null), that we want to resolve to it
          '} )()\n'
        ]).join('\n');

        // because we've now consumed the requires, empty the list so we don't dupe on next run()
        _p.requires = [];

        if( window ){
          var fnBlob, fnUrl;

          // add normalised thread api functions
          if( !threadTechAlreadyExists ){
            var fnPre = fnStr + '';

            fnStr = [
              'function broadcast(m){ return message(m); };', // alias
              'function message(m){ postMessage(m); };',
              'function listen(fn){',
              '  self.addEventListener("message", function(m){ ',
              '    if( typeof m === "object" && (m.data.$$eval || m.data === "$$start") ){',
              '    } else { ',
              '      fn( m.data );',
              '    }',
              '  });',
              '};', 
              'self.addEventListener("message", function(m){  if( m.data.$$eval ){ eval( m.data.$$eval ); }  });',
              'function resolve(v){ postMessage({ $$resolve: v }); };', 
              'function reject(v){ postMessage({ $$reject: v }); };'
            ].join('\n');
          
            fnStr += fnPre;

            fnBlob = new Blob([ fnStr ], {
              type: 'application/javascript'
            });
            fnUrl = window.URL.createObjectURL( fnBlob );
          }
          // create webworker and let it exec the serialised code
          var ww = _p.webworker = _p.webworker || new Worker( fnUrl );

          if( threadTechAlreadyExists ){ // then just exec new run() code
            ww.postMessage({
              $$eval: fnStr
            });
          }

          // worker messages => events
          var cb;
          ww.addEventListener('message', cb = function( m ){
            if( $$.is.object(m) && $$.is.object( m.data ) && ('$$resolve' in m.data) ){
              ww.removeEventListener('message', cb); // done listening b/c resolve()

              resolve( m.data.$$resolve );
            } else if( $$.is.object(m) && $$.is.object( m.data ) && ('$$reject' in m.data) ){
              ww.removeEventListener('message', cb); // done listening b/c reject()

              reject( m.data.$$reject );
            } else {
              self.trigger( new $$.Event(m, { type: 'message', message: m.data }) );
            }
          }, false);

          if( !threadTechAlreadyExists ){
            ww.postMessage('$$start'); // start up the worker
          }

        } else if( typeof module !== 'undefined' ){
          // create a new process
          var path = require('path');
          var child_process = require('child_process');
          var child = _p.child = _p.child || child_process.fork( path.join(__dirname, 'thread-node-fork') );

          // child process messages => events
          var cb;
          child.on('message', cb = function( m ){
            if( $$.is.object(m) && ('$$resolve' in m) ){
              child.removeListener('message', cb); // done listening b/c resolve()

              resolve( m.$$resolve );
            } else if( $$.is.object(m) && ('$$reject' in m) ){
              child.removeListener('message', cb); // done listening b/c reject()

              reject( m.$$reject );
            } else {
              self.trigger( new $$.Event({}, { type: 'message', message: m }) );
            }
          });

          // ask the child process to eval the worker code
          child.send({
            $$eval: fnStr
          });
        } else {
          $$.error('Tried to create thread but no underlying tech found!');
          // TODO fallback on main JS thread?
        }

      }).then(function( v ){
        _p.running = false;
        _p.ran = true;

        self.trigger('ran');

        return v;
      });

      if( _p.queue == null ){
        _p.queue = runP; // i.e. first step of inductive promise chain (for queue)
      }

      return runP;
    },

    // send the thread a message
    message: function( m ){
      var _p = this._private;

      if( _p.webworker ){
        _p.webworker.postMessage( m );
      }

      if( _p.child ){
        _p.child.send( m );
      } 

      return this; // chaining
    },

    stop: function(){
      var _p = this._private;

      if( _p.webworker ){
        _p.webworker.terminate();
      }

      if( _p.child ){
        _p.child.kill();
      } 

      _p.stopped = true;

      return this.trigger('stop'); // chaining
    },

    stopped: function(){
      return this._private.stopped;
    }

  });

  var fnAs = function( fn, name ){
    var fnStr = fn.toString();
    fnStr = fnStr.replace(/function.*\(/, 'function ' + name + '(');

    return fnStr;
  };

  var defineFnal = function( opts ){
    opts = opts || {};

    return function fnalImpl( fn, arg1 ){
      var fnStr = fnAs( fn, '_$_$_' + opts.name );

      this.require( fnStr );

      return this.run( [ 
        'function( data ){',
        '  var origResolve = resolve;',
        '  var res = [];',
        '  ',
        '  resolve = function( val ){',
        '    res.push( val );',
        '  };',
        '  ',
        '  var ret = data.' + opts.name + '( _$_$_' + opts.name + ( arguments.length > 1 ? ', ' + JSON.stringify(arg1) : '' ) + ' );',
        '  ',
        '  resolve = origResolve;',
        '  resolve( res.length > 0 ? res : ret );',
        '}'
      ].join('\n') );
    };
  };

  $$.fn.thread({
    reduce: defineFnal({ name: 'reduce' }),

    reduceRight: defineFnal({ name: 'reduceRight' }),

    map: defineFnal({ name: 'map' })
  });

  // aliases
  var fn = $$.thdfn;
  fn.promise = fn.run;
  fn.terminate = fn.halt = fn.stop;

  // higher level alias (in case you like the worker metaphor)
  $$.worker = $$.Worker = $$.Thread;

  // pull in event apis
  $$.fn.thread({
    on: $$.define.on(),
    one: $$.define.on({ unbindSelfOnTrigger: true }),
    off: $$.define.off(), 
    trigger: $$.define.trigger()
  });

  $$.define.eventAliasesOn( $$.thdfn );
  
})( weaver, typeof window === 'undefined' ? null : window );

;(function($$, window){ 'use strict';

  $$.Fabric = function( N ){
    if( !(this instanceof $$.Fabric) ){
      return new $$.Fabric( N );
    }

    var _p = this._private = {
      pass: []
    };

    var defN = 4;

    if( $$.is.number(N) ){
      // then use the specified number of threads
    } if( typeof navigator !== 'undefined' && navigator.hardwareConcurrency != null ){
      N = navigator.hardwareConcurrency;
    } else if( typeof module !== 'undefined' ){
      N = require('os').cpus().length;
    } else { // TODO could use an estimation here but would the additional expense be worth it?
      N = defN;
    }

    for( var i = 0; i < N; i++ ){
      this[i] = $$.Thread();
    }

    this.length = N;
  };

  $$.fabric = $$.Fabric;
  $$.fabfn = $$.Fabric.prototype; // short alias

  $$.fn.fabric = function( fnMap, options ){
    for( var name in fnMap ){
      var fn = fnMap[name];
      $$.Fabric.prototype[ name ] = fn;
    }
  };

  $$.fn.fabric({

    // require fn in all threads
    require: function( fn, as ){
      for( var i = 0; i < this.length; i++ ){
        var thread = this[i];

        thread.require( fn, as );
      }

      return this;
    },

    // get a random thread
    random: function(){
      var i = Math.round( (this.length - 1) * Math.random() );
      var thread = this[i];

      return thread;
    },

    // run on random thread
    run: function( fn ){
      var pass = this._private.pass.shift();

      return this.random().pass( pass ).run( fn );
    },

    // sends a random thread a message
    message: function( m ){
      return this.random().message( m );
    },

    // send all threads a message
    broadcast: function( m ){
      for( var i = 0; i < this.length; i++ ){
        var thread = this[i];

        thread.message( m );
      }

      return this; // chaining
    },

    // stop all threads
    stop: function(){
      for( var i = 0; i < this.length; i++ ){
        var thread = this[i];

        thread.stop();
      }

      return this; // chaining
    },

    // pass data to be used with .spread() etc.
    pass: function( data ){
      var pass = this._private.pass;

      if( $$.is.array(data) ){
        pass.push( data );
      } else {
        $$.util.error('Only arrays or collections may be used with fabric.pass()');
      }

      return this; // chaining
    },

    spreadSize: function(){
      var subsize =  Math.ceil( this._private.pass[0].length / this.length );

      subsize = Math.max( 1, subsize ); // don't pass less than one ele to each thread

      return subsize;
    },

    // split the data into slices to spread the data equally among threads
    spread: function( fn ){
      var self = this;
      var _p = self._private;
      var subsize = self.spreadSize(); // number of pass eles to handle in each thread
      var pass = _p.pass.shift().concat([]); // keep a copy
      var runPs = [];

      for( var i = 0; i < this.length; i++ ){
        var thread = this[i];
        var slice = pass.splice( 0, subsize );

        var runP = thread.pass( slice ).run( fn );

        runPs.push( runP );

        var doneEarly = pass.length === 0;
        if( doneEarly ){ break; }
      }

      return $$.Promise.all( runPs ).then(function( thens ){
        var postpass = new Array();
        var p = 0;

        // fill postpass with the total result joined from all threads
        for( var i = 0; i < thens.length; i++ ){
          var then = thens[i]; // array result from thread i

          for( var j = 0; j < then.length; j++ ){
            var t = then[j]; // array element

            postpass[ p++ ] = t;
          }
        }

        return postpass;
      });
    },

    // parallel version of array.map()
    map: function( fn ){
      var self = this;

      self.require( fn, '_$_$_fabmap' );

      return self.spread(function( split ){
        var mapped = [];
        var origResolve = resolve;

        resolve = function( val ){
          mapped.push( val );
        };

        for( var i = 0; i < split.length; i++ ){
          var oldLen = mapped.length;
          var ret = _$_$_fabmap( split[i] );
          var nothingInsdByResolve = oldLen === mapped.length;

          if( nothingInsdByResolve ){
            mapped.push( ret );
          }
        }

        resolve = origResolve;

        return mapped;
      });

    },

    // parallel version of array.filter()
    filter: function( fn ){
      var _p = this._private;
      var pass = _p.pass[0];

      return this.map( fn ).then(function( include ){
        var ret = [];

        for( var i = 0; i < pass.length; i++ ){
          var datum = pass[i];
          var incDatum = include[i];

          if( incDatum ){
            ret.push( datum );
          }
        }

        return ret;
      });
    },

    // sorts the passed array using a divide and conquer strategy
    sort: function( cmp ){
      var self = this;
      var P = this._private.pass[0].length;
      var subsize = this.spreadSize();
      var N = this.length;

      cmp = cmp || function( a, b ){ // default comparison function
        if( a < b ){
          return -1;
        } else if( a > b ){
          return 1;
        }

        return 0;
      };

      self.require( cmp, '_$_$_cmp' );

      return self.spread(function( split ){ // sort each split normally
        var sortedSplit = split.sort( _$_$_cmp );
        resolve( sortedSplit );

      }).then(function( joined ){
        // do all the merging in the main thread to minimise data transfer

        // TODO could do merging in separate threads but would incur add'l cost of data transfer
        // for each level of the merge

        var merge = function( i, j, max ){
          // don't overflow array
          j = Math.min( j, P );
          max = Math.min( max, P );

          // left and right sides of merge
          var l = i;
          var r = j;

          var sorted = [];

          for( var k = l; k < max; k++ ){

            var eleI = joined[i];
            var eleJ = joined[j];

            if( i < r && ( j >= max || cmp(eleI, eleJ) <= 0 ) ){
              sorted.push( eleI );
              i++;
            } else {
              sorted.push( eleJ );
              j++;
            }

          }

          // in the array proper, put the sorted values
          for( var k = 0; k < sorted.length; k++ ){ // kth sorted item
            var index = l + k;

            joined[ index ] = sorted[k];
          }
        };

        for( var splitL = subsize; splitL < P; splitL *= 2 ){ // merge until array is "split" as 1

          for( var i = 0; i < P; i += 2*splitL ){
            merge( i, i + splitL, i + 2*splitL );
          }

        }

        return joined;
      });
    }


  });

  var defineRandomPasser = function( opts ){
    opts = opts || {};

    return function( fn, arg1 ){
      var pass = this._private.pass.shift();

      return this.random().pass( pass )[ opts.threadFn ]( fn, arg1 );
    };
  };

  $$.fn.fabric({
    randomMap: defineRandomPasser({ threadFn: 'map' }),

    reduce: defineRandomPasser({ threadFn: 'reduce' }),

    reduceRight: defineRandomPasser({ threadFn: 'reduceRight' })
  });

  // aliases
  var fn = $$.fabfn;
  fn.promise = fn.run;
  fn.terminate = fn.halt = fn.stop;

  // pull in event apis
  $$.fn.fabric({
    on: $$.define.on(),
    one: $$.define.on({ unbindSelfOnTrigger: true }),
    off: $$.define.off(),
    trigger: $$.define.trigger()
  });

  $$.define.eventAliasesOn( $$.fabfn );

})( weaver, typeof window === 'undefined' ? null : window );
