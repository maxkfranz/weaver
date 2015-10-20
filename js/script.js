
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

  function debounce( fn, delay ){
  	var timeout;

  	return function(){
  		var context = this;
      var args = arguments;

  		clearTimeout( timeout );
  		timeout = setTimeout(function(){
  			timeout = null;

        fn.apply( context, args );
  		}, delay );
  	};
  };

  // toc link search

  var $toclinks = $('.section > .toclink');
  var $tocinput = $('#toc-input');
  var $tocsections = $('#toc-sections');
  var lastTxt;

  var filterSections = debounce(function(){
    txt = $tocinput.val().toLowerCase();

    var $shown = txt === '' ? $toclinks : $toclinks.filter(function(i, ele){
      return ele.text.toLowerCase().match( txt );
    });

    var $notShown = $toclinks.not( $shown );

    $shown.show();
    $notShown.hide();

    $shown.parent().each(function(i, ele){
      var $section = $(ele);

      if( $section.hasClass('lvl3') ){
        $section.prevAll('.lvl2:first').children('.toclink').show();
        $section.prevAll('.lvl1:first').children('.toclink').show();
      } else if( $section.hasClass('lvl2') ){
        $section.prevAll('.lvl1:first').children('.toclink').show();
        $section.nextUntil('.lvl2, .lvl1').children('.toclink').show();
      } else if( $section.hasClass('lvl1') ){
        $section.nextUntil('.lvl1').children('.toclink').show();
      }
    });

    $tocsections.removeClass('toc-sections-searching');
  }, 250);

  $tocinput.on( 'keydown keyup keypress change', function(){
    txt = $tocinput.val().toLowerCase();

    if( txt === lastTxt ){ return; }
    lastTxt = txt;

    $tocsections.addClass('toc-sections-searching');

    filterSections();
  });

  $('#toc-clear').on('click', function(){
    $tocinput.val('').trigger('change');
  });

});
