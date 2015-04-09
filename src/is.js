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
