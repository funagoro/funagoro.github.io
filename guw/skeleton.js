var ctx;

var fps;
var myTimerID;
var latestTimer = 0;

//========== ========== ========== ========== ========== ========== ==========

var MAXTOUCH = 5;
var NOID = -1, MOUSEID = -2;
var NOWHERE = 1000000;

var touchID = new Array( MAXTOUCH);

var touchX = new Array( MAXTOUCH), touchY = new Array( MAXTOUCH);
var touchBX = new Array( MAXTOUCH), touchBY = new Array( MAXTOUCH);
var touchMX = new Array( MAXTOUCH), touchMY = new Array( MAXTOUCH);

var touchIn = new Array( MAXTOUCH), touchOut = new Array( MAXTOUCH);
var touchBegan = new Array( MAXTOUCH), touchEnded = new Array( MAXTOUCH);

var touch;
var inTouch = new Array( MAXTOUCH);
var latestTouch = 0;
var latestMouse = 0;

//========== ========== ========== ========== ========== ========== ==========

var MAXIMGNUM = 100;
var imgCount;  //int
var img;  //array of img
var imgTryCount;  //array of int

//========== ========== ========== ========== ========== ========== ==========

var ac;
var isAudioIOS;

var MAXAUDIONUM = 100;
var audioCount;  //int
var ab; //array of AudioBuffer
var absNode;  //array of AudioBufferSourceNode
var audioTryCount;  //array of int

//========== ========== ========== ========== ========== ========== ==========

function resetTouches(){
  var i;

  touch = false;
  for( i = 0; i < MAXTOUCH; i++) touchID[ i] = NOID;
}

function myTouchIn( n, x, y){
  var i;

  for( i = 0; i < MAXTOUCH; i++) if( touchID[ i] == NOID){
    touchID[ i] = n;

    touchX[ i] = touchBX[ i] = x;
    touchY[ i] = touchBY[ i] = y;
    touchMX[ i] = NOWHERE;

    touchIn[ i] = true;
    touchBegan[ i] = false;
    touchEnded[ i] = false;
    touchOut[ i] = false;
    break;
  }
}

function myTouchBegan( n, x, y){
  var i;

  for( i = 0; i < MAXTOUCH; i++) if( touchID[ i] == n) break;

  if( i == MAXTOUCH) for( i = 0; i < MAXTOUCH; i++) if( touchID[ i] == NOID){
    touchID[ i] = n;

    touchX[ i] = touchBX[ i] = x;
    touchY[ i] = touchBY[ i] = y;
    touchMX[ i] = NOWHERE;

    touchIn[ i] = true;
    touchEnded[ i] = false;
    touchOut[ i] = false;
    break;
  }

  if( i < MAXTOUCH) touchBegan[ i] = true;
}

function myTouchMoved( n, x, y){
  var i;

  for( i = 0; i < MAXTOUCH; i++) if( touchID[ i] == n){
    if( touchMX[ i] == NOWHERE){
      touchMX[ i] = touchX[ i];
      touchMY[ i] = touchY[ i];
    }
    touchX[ i] = x;
    touchY[ i] = y;
    break;
  }
}

function myTouchEnded( n){
  var i;

  for( i = 0; i < MAXTOUCH; i++) if( touchID[ i] == n){
    touchEnded[ i] = true;
    break;
  }
}

function myTouchOut( n){
  var i;

  for( i = 0; i < MAXTOUCH; i++) if( touchID[ i] == n){
    touchOut[ i] = true;
    break;
  }
}

//========== ========== ========== ========== ========== ========== ==========

function skeleton( c){
  var f;

  ctx = c.getContext( '2d');

  resetTouches();

  f = false;

  if( window.PointerEvent){
    //★windows 用
    c.addEventListener( "pointerover", touchIn, f);
    c.addEventListener( "pointerdown", touchBegan, f);
    c.addEventListener( "pointermove", touchMoved, f);
    c.addEventListener( "pointerup", touchEnded, f);
    c.addEventListener( "pointerleave", touchOut, f);
  } else{
    //★windows 以外用
    c.addEventListener( "touchstart", touchBegan, f);
    c.addEventListener( "touchmove", touchMoved, f);
    c.addEventListener( "touchend", touchEnded, f);
    c.addEventListener( "touchcancel", touchOut, f);
    c.addEventListener( "touchout", touchOut, f);

    c.addEventListener( "mouseover", touchIn, f);
    c.addEventListener( "mousedown", touchBegan, f);
    c.addEventListener( "mousemove", touchMoved, f);
    c.addEventListener( "mouseup", touchEnded, f);
    c.addEventListener( "mouseout", touchOut, f);
  }

  function touchIn( e){
    var i;
    var t;

    //e.preventDefault();
    //e.stopPropagation();

    var r = e.target.getBoundingClientRect();
    var x = r.left;
    var y = r.top;

    if( window.PointerEvent){
      //★Windows 用
      myTouchIn( e.pointerId, e.clientX - x, e.clientY - y);
    } else if( e.changedTouches){
      for( i = 0; i < e.changedTouches.length; i++){
        t = e.changedTouches[ i];
        myTouchIn( t.identifier, t.clientX - x, t.clientY - y);
      }
    } else{
      myTouchIn( MOUSEID, e.clientX - x, e.clientY - y);
    }
    //return false;
  }

  function touchBegan( e){
    var i;
    var t;

    e.preventDefault();
    //e.stopPropagation();

    var r = e.target.getBoundingClientRect();
    var x = r.left;
    var y = r.top;
    var n = Date.now();

    //if( snd.isAvailable && !snd.isPlaying) snd.start();

    if( window.PointerEvent){
      //★Windows 用
      myTouchBegan( e.pointerId, e.clientX - x, e.clientY - y);
    } else if( e.changedTouches){
      //★タッチ
      if( latestMouse + 500 < n){
        latestTouch = n;
        for( i = 0; i < e.changedTouches.length; i++){
          t = e.changedTouches[ i];
          myTouchBegan( t.identifier, t.clientX - x, t.clientY - y);
        }
      }
    } else{
      //★マウス
      if( latestTouch + 500 < n){
        latestMouse = n;
        myTouchBegan( MOUSEID, e.clientX - x, e.clientY - y);
      }
    }
    //return false;
  }

  function touchMoved( e){
    var i;
    var t;

    //e.preventDefault();
    //e.stopPropagation();

    var r = e.target.getBoundingClientRect();
    var x = r.left;
    var y = r.top;

    if( window.PointerEvent){
      //★Windows 用
      myTouchMoved( e.pointerId, e.clientX - x, e.clientY - y);
    } else if( e.changedTouches){
      for( i = 0; i < e.changedTouches.length; i++){
        t = e.changedTouches[ i];
        myTouchMoved( t.identifier, t.clientX - x, t.clientY - y);
      }
    } else myTouchMoved( MOUSEID, e.clientX - x, e.clientY - y);
    //return false;
  }

  function touchEnded( e){
    var i;
    var t;

    //★タッチイベントのタイミングで実行する必要がある
    if( ac && !isAudioIOS) startAudioIOS();

    //e.preventDefault();
    //e.stopPropagation();

    if( window.PointerEvent){
      //★Windows 用
      myTouchEnded( e.pointerId);
    } else if( e.changedTouches){
      for( i = 0; i < e.changedTouches.length; i++){
        t = e.changedTouches[ i];
        myTouchEnded( t.identifier);
      }
    } else myTouchEnded( MOUSEID);
    //return false;
  }

  function touchOut( e){
    var i;
    var t;

    //e.preventDefault();
    //e.stopPropagation();

    if( window.PointerEvent){
      //★Windows 用
      myTouchOut( e.pointerId);
    } else if( e.changedTouches){
      for( i = 0; i < e.changedTouches.length; i++){
        t = e.changedTouches[ i];
        myTouchOut( t.identifier);
      }
    } else myTouchOut( MOUSEID);
    //return false;
  }

  if( screen.orientation) screen.orientation.lock( 'portrait');

  initImage();

  initAudio();
}

//========== ========== ========== ========== ========== ========== ==========

function setFPS( n){
  fps = n;
  myTimerID = requestAnimationFrame( onTimer);
}

function onTimer(){
  var i;

  myTimerID = requestAnimationFrame( onTimer);
  if( Math.floor( Date.now() * fps / 1000) == Math.floor( latestTimer * fps / 1000)) return;
  latestTimer = Date.now();

  for( i = 0; i < MAXTOUCH; i++) if( touchID[ i] != NOID && touchIn[ i]){
    inTouch[ i] = false;
  }

  touch = false;
  for( i = 0; i < MAXTOUCH; i++) if( touchID[ i] != NOID && touchBegan[ i]){
    touch = true;
    inTouch[ i] = true;
  }

  main();

  for( i = 0; i < MAXTOUCH; i++) if( touchID[ i] != NOID){
    touchIn[ i] = false;
    touchBegan[ i] = false;

    if( touchOut[ i]) touchID[ i] = NOID;
    else if( touchEnded[ i]){
      if( touchID[ i] == MOUSEID){
        inTouch[ i] = false;
        touchEnded[ i] = false;
      } else{
        touchID[ i] = NOID;
      }
    }
  }

  //★デバグ用コンソール
  //ctx.fillStyle = 'rgba( 0, 0, 0, 0.3)';
  //ctx.fillRect( 0, 800 - 30, 600, 30);
  //drawString( 0, 800, "out", 30, 0xffffff);
}

//========== ========== ========== ========== ========== ========== ==========

function initImage(){
  imgCount = 0;
  img = new Array( MAXIMGNUM);
  imgTryCount = new Array( MAXIMGNUM);
}

function loadImage( s){
  var n;

  n = imgCount;

  img[ n] = new Image();

  img[ n].onerror = function(){
    imgTryCount[ n]++;
    console.log( "err img " + n + " (" + imgTryCount[ n] + ")");
    if( imgTryCount[ n] < 5) setTimeout( ldi, 500);
  };

  imgTryCount[ n] = 0;

  ldi();

  return imgCount++;

  function ldi(){
    img[ n].src = s;
  }
};

function drawImage( n, x, y){
  if( img[ n].complete){
    ctx.drawImage( this.img[ n], x, y);
  }
}

function drawImageCentered( n, x, y){
  if( img[ n].complete){
    ctx.drawImage(
      this.img[ n],
      x - this.img[ n].naturalWidth / 2,
      y - this.img[ n].naturalHeight / 2
    );
  }
}

//========== ========== ========== ========== ========== ========== ==========

function fillRect( x, y, w, h, c){
  ctx.fillStyle = "#" + ( "00000" + c.toString( 16)).substr( -6);
  ctx.fillRect( x, y, w, h);
}

function drawString( x, y, s, p, c){
  ctx.fillStyle = "#" + ( "00000" + c.toString( 16)).substr( -6);
  ctx.font = "" + p + "pt 'Arial'";
  ctx.textAlign = "left";
  ctx.fillText( s, x, y);
}

//========== ========== ========== ========== ========== ========== ==========

function initAudio(){
  isAudioIOS = false;

  ac = new( window.AudioContext || window.webkitAudioContext);
  if( !ac) return;

  audioCount = 0;
  ab = new Array( MAXAUDIONUM);
  absNode = new Array( MAXAUDIONUM);
  audioTryCount = new Array( MAXAUDIONUM);
}

function loadSound( s){
  var a;
  var n;
  var r;
  var res;

  n = audioCount;

  r = new XMLHttpRequest();

  r.onreadystatechange = function(){
    a = r.readyState;
    //console.log( "snd " + n + " : rs " + a);
    if( a == 4){//★4 は完了を表す。 (成功でも失敗でも。)
      a = r.status;
      res = r.response;
      //console.log( "snd " + n + " : status " + a);
      if( ( a == 0 || a == 200) && res){//★0 はオフライン、200 は成功を表す。
        //console.log( "snd " + n + " : res " + res);
        ac.decodeAudioData(
          res,
          function onSuccess( buf){
            ab[ n] = buf;
          },
          function onFailure(){ console.log( "err dec snd " + n);}
        );
      } else{
        audioTryCount[ n]++;
        console.log( "err snd " + n + " (" + audioTryCount[ n] + ")");
        if( audioTryCount[ n] < 5) setTimeout( lda, 500);
      }
    }
  };

  audioTryCount[ n] = 0;

  lda();

  return audioCount++;

  function lda(){
    try{
      r.open( 'GET', s, true);
      r.responseType = 'arraybuffer';
      r.send();
    } catch( e){}
  }
}

function playSound( n){
  if( !ac || !ab[ n]) return;

  if( absNode[ n]) absNode[ n].stop( 0);

  absNode[ n] = ac.createBufferSource();
  absNode[ n].buffer = ab[ n];
  absNode[ n].connect( ac.destination);
  absNode[ n].start( 0);
}

function playSoundLoop( n){
  if( !ac || !ab[ n]) return;

  if( absNode[ n]) absNode[ n].stop( 0);

  absNode[ n] = ac.createBufferSource();
  absNode[ n].buffer = ab[ n];
  absNode[ n].loop = true;
  absNode[ n].connect( ac.destination);
  absNode[ n].start( 0);
}

function stopSound( n){
  if( !ac || !ab[ n]) return;

  if( absNode[ n]){
    absNode[ n].stop( 0);
    absNode[ n] = undefined;
  }
}

function startAudioIOS(){
  //★iOS 対応
  ac.createBufferSource().start( 0);
  isAudioIOS = true;
}
