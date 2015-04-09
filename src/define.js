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
