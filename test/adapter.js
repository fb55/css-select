var CSSselect = require( '..' ),
    adapter   = require( '../browser-adapter' ),
    jsdom     = require( 'jsdom' ),
    assert    = require("assert");

var html = '<main><div></div><div class="apple"></div><span><strong>Hello</strong>, <em>World!</em></span></main>';

function getBody( html ){
  return jsdom.jsdom( html ).defaultView.document.querySelector( 'body' );
}

describe( 'Browser Adapter', function(){
  /*
    isTag, existsOne, getAttributeValue, getChildren, getName, getParent,
    getSiblings, getText, hasAttrib, removeSubsets, findAll, equals
  */

  it( 'should isTag', function(){
    var body = getBody( html );

    assert( adapter.isTag( body ) );
  });

  it( 'should existsOne', function(){
    var body = getBody( html );
    var divs = body.querySelectorAll( 'div' );
    var arr = Array.from( divs );

    var hasDiv = adapter.existsOne( function( node ){
      return node.classList.contains( 'apple' );
    }, arr );

    assert( hasDiv );
  });

  it( 'should getAttributeValue', function(){
    var body = getBody( html );
    var div = body.querySelector( '.apple' );
    var value = adapter.getAttributeValue( div, 'class' );

    assert.equal( value, 'apple' );
  });

  it( 'should getChildren', function(){
    var body = getBody( html );
    var main = body.querySelector( 'main' );
    var children = adapter.getChildren( main );

    assert( Array.isArray( children ) );
    assert.equal( children.length, 3 );
  });

  it( 'should getName', function(){
    var body = getBody( html );

    assert.equal( adapter.getName( body ), 'body' );
  });

  it( 'should getParent', function(){
    var body = getBody( html );
    var main = body.querySelector( 'main' );

    assert.equal( body, adapter.getParent( main ) );
  });

  it( 'should getSiblings', function(){
    var body = getBody( html );
    var div = body.querySelector( 'div' );

    var siblings = adapter.getSiblings( div );

    assert( Array.isArray( siblings ) );
    assert.equal( siblings.length, 3 );
  });

  it( 'should getText', function(){
    var body = getBody( html );
    var span = body.querySelector( 'span' );

    var text = adapter.getText( span );

    assert.equal( text, 'Hello, World!' );
  });

  it( 'should hasAttrib', function(){
    var body = getBody( html );
    var apple = body.querySelector( '.apple' );

    assert( adapter.hasAttrib( apple, 'class' ) );
    assert( !adapter.hasAttrib( body, 'class' ) );
  });
});
