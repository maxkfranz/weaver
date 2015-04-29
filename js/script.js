
$(function(){

  // fix for webkit
  $('#navigation').on('wheel mousewheel DOMMouseScroll MozMousePixelScroll scroll', function(e){
    e.stopPropagation();
  });

  $('#open-navigation').on('click', function(){
    $('body').addClass('navigation-open');
  });

  $('#open-navigation-bg, #navigation a').on('click', function(){
    $('body').removeClass('navigation-open');
  });

  // avoid weird rendering bug in chrome etc
  $('#navigation a').on('click', function(){
    var scroll = $('#navigation').scrollTop();

    // force navigation to rerender, because some browsers (looking at you, chrome)
    // don't render properly after clicking one of the links
    setTimeout(function(){
      $('#navigation').scrollTop( scroll + 10 );
      $('#navigation').scrollTop( scroll - 10 );
      $('#navigation').scrollTop( scroll );
    }, 0);
  });

  $(document).on('click', '.gallery-refresh', function(){
    var embedId = $(this).attr('data-embed-id');
    var embed = document.getElementById(embedId);

    embed.classList.remove('loaded');

    embed.src = embed.src;
  });

  $('.gallery-embed').on('load', function(){
    $(this).addClass('loaded');
  });

  // var consoleLog = console.log;
  //
  // console.log = function( m ){
  //   var $console = $('#console');
  //   var oldText = $console.text();
  //
  //   $console.text( oldText + '\n' + m );
  //
  //   consoleLog.apply( console, [m] );
  // };

  $(document).on('click', '.run.run-inline-code', function(){
    var $run = $(this);
    var $pre = $(this).prevAll('pre:first');
    var $ele = $(this);
    var $console = $('#console');


    var $etc = $('#runner-etc');
    //
    // $etc.remove();
    // $ele.after( $etc );

    var text = $pre.text();

    eval( text );

    return;

    var $title = $('#runner-title');
    var $content = $title.find('.content');

    $console.text('');
    $content.html( text );
    $title.show();

    eval( text );

    $content.hide().fadeIn(100).delay(250).hide(200, function(){

    });

  });

});
