'use strict';

var Thread = require('./thread');
var Fabric = require('./fabric');

var weaver = function(){ // jshint ignore:line
  return;
};

weaver.version = '{{VERSION}}';

weaver.thread = weaver.Thread = weaver.worker = weaver.Worker = Thread;
weaver.fabric = weaver.Fabric = Fabric;

module.exports = weaver;
