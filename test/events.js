var expect = require('chai').expect;
var weaver = require('../build/weaver.js', weaver);
var $$ = weaver;


describe('Events', function(){

  var t;
  var f;

  // test setup
  beforeEach(function(done){
    t = $$.thread();
    f = $$.fabric();

    done();
  });


  describe('thread.on()', function(){

    it('binds to one event', function(done){
      t
        .on('foo', function(){
          done();
        })

        .trigger('foo')
      ;

    });

    it('binds to multiple events', function(done){
      var triggeredFoo = false;
      var triggeredBar = false;
      var triggers = 0;

      t
        .on('foo bar', function(e){
          
          if( e.type === 'foo' ){
            triggeredFoo = true;
          } else if( e.type === 'bar' ){
            triggeredBar = true;
          }

          triggers++;

          if( triggers === 2 ){
            expect( triggeredFoo ).to.be.true;
            expect( triggeredBar ).to.be.true;

            done();
          }

        })

        .trigger('foo')

        .trigger('bar')
      ;

    });

    it('binds with data', function(done){

      t.on('foo', { bar: 'baz' }, function(e){
        expect( e ).to.have.property('data');
        expect( e.data ).to.have.property('bar', 'baz');

        done();
      });

      t.trigger('foo');

    });

    it('binds with an event map', function(){
      var triggers = 0;

      t.on({
        'foo': function(){ triggers++; },
        'bar': function(){ triggers++; }
      });

      t.trigger('foo bar');

      expect( triggers ).to.equal(2);
    });

    it('has event object structure', function(done){

      t
        .on('foo.bar', function(e){
          
          expect( e ).to.be.ok;
          expect( e ).to.have.property('type', 'foo');
          expect( e ).to.have.property('namespace', '.bar');
          expect( e.timeStamp ).to.be.a('number');

          done();
        })

        .trigger('foo.bar')
      ;

    });

  });

  describe('thread.one()', function(){

    it('only triggers once', function(){
      var triggers = 0;

      t.one('foo', function(e){
        triggers++;
      });

      t.trigger('foo');
      expect( triggers ).to.equal(1);

      t.trigger('foo');
      expect( triggers ).to.equal(1);
    });

    it('triggers once with map', function(){
      var triggers = 0;

      t.one({
        'foo': function(e){
          triggers++;
        }
      });

      t.trigger('foo');
      expect( triggers ).to.equal(1);

      t.trigger('foo');
      expect( triggers ).to.equal(1);
    });

  });

  describe('thread.off()', function(){

    it('removes a handler from .on()', function(){
      var triggers = 0;
      var handler;

      t.on('foo', handler = function(){
        triggers++;
      });

      t.off('foo', handler);

      t.trigger('foo');
      expect( triggers ).to.equal(0);
    });

    it('removes a handler from .one()', function(){
      var triggers = 0;
      var handler;

      t.one('foo', handler = function(){
        triggers++;
      });

      t.off('foo', handler);

      t.trigger('foo');
      expect( triggers ).to.equal(0);
    });

    it('removes a handler via just event type', function(){
      var triggers = 0;
      var handler;

      t.on('foo', handler = function(){
        triggers++;
      });

      t.off('foo');

      t.trigger('foo');
      expect( triggers ).to.equal(0);
    });

    it('removes a handler via events map', function(){
      var triggers = 0;
      var handler;

      t.on('foo', handler = function(){
        triggers++;
      });

      t.off({
        'foo': handler
      });

      t.trigger('foo');
      expect( triggers ).to.equal(0);
    });

    it('removes multiple handlers of same event type', function(){
      var triggers = 0;
      var handler1, handler2;

      t.on('foo', handler1 = function(){
        triggers++;
      });

      t.on('foo', handler2 = function(){
        triggers++;
      });

      t.off('foo');

      t.trigger('foo');
      expect( triggers ).to.equal(0);
    });

  });

  describe('thread.trigger()', function(){

    it('triggers the handler', function(){
      var triggers = 0;

      t.on('foo', function(){
        triggers++;
      });

      t.trigger('foo');

      expect( triggers ).to.equal(1);
    });

    it('passes extra params correctly', function(done){
      t.on('foo', function(e, bar, baz){
        expect( bar ).to.equal('bar');
        expect( baz ).to.equal('baz');

        done();
      });

      t.trigger('foo', ['bar', 'baz']);
    });

  });

  describe('thread.on()', function(){

    var triggers = 0;
    var handler = function(){ triggers++; }

    beforeEach(function(){
      triggers = 0;
    });

    it('should get triggered with matching event', function(){
      t.on('foo', handler);
      t.trigger('foo');
      expect( triggers ).to.equal(1);
    });

    it('should get triggered with matching event and namespace', function(){
      t.on('foo.bar', handler);
      t.trigger('foo.bar');
      expect( triggers ).to.equal(1);
    });

    it('should pass extra data correctly', function(done){
      t.on('foo', { bar: 'baz' }, function(e){
        expect( e.data.bar ).to.equal('baz');
        done();
      });

      t.trigger('foo');
    });

  });

  describe('thread.one()', function(){

    var triggers = 0;
    var handler = function(){ triggers++; }

    beforeEach(function(){
      triggers = 0;
    });

    it('triggers only one time', function(){
      t.one('foo', handler);
      t.trigger('foo');
      expect( triggers ).to.equal(1);
      t.trigger('foo');
      expect( triggers ).to.equal(1);
    });

    it('passes data correctly', function(){
      var evt;

      t.one('foo', { bar: 'baz' }, function(e){
        evt = e;
      });
      t.trigger('foo');

      expect( evt.data ).to.exist;
      expect( evt.data.bar ).to.exist;
      expect( evt.data.bar ).to.equal('baz');
    });

  });

  describe('thread.once()', function(){ return; // if added later...

    var triggers = 0;
    var handler = function(){ triggers++; }

    beforeEach(function(){
      triggers = 0;
    });

    it('triggers only one time', function(){
      t.once('foo', handler);
      t.trigger('foo');
      expect( triggers ).to.equal(1);
      t.trigger('foo');
      expect( triggers ).to.equal(1);
    });

    it('passes data correctly', function(){
      var evt;

      t.once('foo', { bar: 'baz' }, function(e){
        evt = e;
      });
      t.trigger('foo');

      expect( evt.data ).to.exist;
      expect( evt.data.bar ).to.exist;
      expect( evt.data.bar ).to.equal('baz');
    });

  });

  describe('thread.off()', function(){

    var triggers = 0;
    var handler = function(){ triggers++; }

    beforeEach(function(){
      triggers = 0;
    });

    it('should remove all handlers for same event type', function(){
      t.on('foo', handler);
      t
        .off('foo')
        .trigger('foo')
      ;
      expect( triggers ).to.equal(0);
    });
    
    it('should remove all matching handlers', function(){
      t.on('foo', handler);
      t
        .off('foo', handler)
        .trigger('foo')
      ;
      expect( triggers ).to.equal(0);
    });

  });

  describe('thread.trigger()', function(){

    var triggers = 0;
    var handler = function(){ triggers++; }

    beforeEach(function(){
      triggers = 0;
    });

    it('should trigger for one element', function(){
      t.on('foo', handler);
      t.trigger('foo');
      expect( triggers ).to.equal(1);
    });

    it('should trigger with extra parameters', function(done){
      t.on('foo', function(e, bar, baz){
        expect( bar ).to.equal('bar');
        expect( baz ).to.equal('baz');
        done();
      });
      t.trigger('foo', ['bar', 'baz']);
    });

  });

  describe('thread.promiseOn()', function(){

    it('should run a then() callback', function( next ){
      t.pon('foo').then(function(){
        next();
      });

      t.trigger('foo');
    });

    it('should receive event obj', function( next ){
      t.pon('foo').then(function( e ){
        expect( e ).to.not.be.undefined;
        expect( e.type ).to.equal('foo');

        next();
      });

      t.trigger('foo');
    });

    it('should run callback only once', function( next ){
      var trigs = 0;

      t.pon('foo').then(function(){
        trigs++;
      });

      t.trigger('foo');
      t.trigger('foo');

      setTimeout(function(){
        expect( trigs ).to.equal(1);
        next();
      }, 50);
    });

  });

});