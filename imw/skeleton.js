//★外部の変数を参照する
//REFW, REFH
//mypadding, myorientation
//MAXTOUCH, IMAGENUM, AUDIONUM

var isAcc;
var accX, accY;

var can;
var ctx;
var currentMag, targetMag;

var skFps;
var myTimerID;
var latestTimer = 0;

var loadedCount;

//●==========●==========●==========●==========●==========●==========●

var NOID = -1, MOUSEID = -2;
var NOWHERE = 1000000;

var touchID = new Array( MAXTOUCH);

var touchX = new Array( MAXTOUCH), touchY = new Array( MAXTOUCH);
var touchBX = new Array( MAXTOUCH), touchBY = new Array( MAXTOUCH);
var touchMX = new Array( MAXTOUCH), touchMY = new Array( MAXTOUCH);

var touchIn = new Array( MAXTOUCH);
var touchBegan = new Array( MAXTOUCH);
var touchEnded = new Array( MAXTOUCH);
var touchOut = new Array( MAXTOUCH);

var touch, touching, touch_x, touch_y;
var inTouch = new Array( MAXTOUCH);
var latestTouch = 0;
var latestMouse = 0;

var retX, retY;

//●==========●==========●==========●==========●==========●==========●

var imgCount;  //★int
var img = new Array( IMAGENUM);  //★array of image
var imgTryCount = new Array( IMAGENUM);  //★array of int

//●==========●==========●==========●==========●==========●==========●

var ac;
var isAudioIOS;
var audioCount;  //★int
var ab = new Array( AUDIONUM); //★array of AudioBuffer
var absNode = new Array( AUDIONUM);  //★array of AudioBufferSourceNode
var audioTryCount = new Array( AUDIONUM);  //★array of int

//●==========●==========●==========●==========●==========●==========●

onorientationchange = function(){
  resetTouches();
};

function adjustCoordinates( x0, y0){
  var x, y;

  x = x0 / currentMag;
  y = y0 / currentMag;

  switch( myorientation){
  case 0:
    retX = x;
    retY = y;
    break;
  case 90:
    retX = y;
    retY = REFH - x;
    break;
  case 180:
    retX = REFW - x;
    retY = REFH - y;
    break;
  case 270:
    retX = REFW - y;
    retY = x;
    break;
  }
}

function resetTouches(){
  var i;

  touch = false;
  for( i = 0; i < MAXTOUCH; i++) touchID[ i] = NOID;
}

function myTouchIn( n, x, y){
  var i;

  adjustCoordinates( x, y);

  for( i = 0; i < MAXTOUCH; i++) if( touchID[ i] == NOID){
    touchID[ i] = n;

    touchX[ i] = touchBX[ i] = retX;
    touchY[ i] = touchBY[ i] = retY;
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

  adjustCoordinates( x, y);

  for( i = 0; i < MAXTOUCH; i++) if( touchID[ i] == n) break;

  if( i == MAXTOUCH) for( i = 0; i < MAXTOUCH; i++) if( touchID[ i] == NOID) break;

  if( i < MAXTOUCH){
    touchID[ i] = n;

    touchX[ i] = touchBX[ i] = retX;
    touchY[ i] = touchBY[ i] = retY;
    touchMX[ i] = NOWHERE;

    if( n != MOUSEID) touchIn[ i] = true;
    touchBegan[ i] = true;
    touchEnded[ i] = false;
    touchOut[ i] = false;
  }
}

function myTouchMoved( n, x, y){
  var i;

  if( x < 0 || can.width <= x || y < 0 || can.height <= y){
    myTouchOut( n);
    return;
  }

  adjustCoordinates( x, y);

  for( i = 0; i < MAXTOUCH; i++) if( touchID[ i] == n) break;

  if( i == MAXTOUCH && n == MOUSEID) for( i = 0; i < MAXTOUCH; i++) if( touchID[ i] == NOID){
    touchID[ i] = n;

    touchX[ i] = touchBX[ i] = retX;
    touchY[ i] = touchBY[ i] = retY;

    touchIn[ i] = true;
    touchBegan[ i] = false;
    touchEnded[ i] = false;
    touchOut[ i] = false;

    break;
  }

  if( i < MAXTOUCH){
    if( touchMX[ i] == NOWHERE){
      touchMX[ i] = touchX[ i];
      touchMY[ i] = touchY[ i];
    }
    touchX[ i] = retX;
    touchY[ i] = retY;
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

//●==========●==========●==========●==========●==========●==========●

function skeleton( c){
  var f;

  var u = navigator.userAgent;
  if(
    0 <= u.indexOf( 'iPhone') ||
    0 <= u.indexOf( 'iPod') ||
    0 <= u.indexOf( 'iPad') ||
    0 <= u.indexOf( 'Android')
  ) isAcc = true;
  else{
    isAcc = false;
  }
  accX = accY = 0;

  if( isAcc) addEventListener(
    "devicemotion",
    function( e){
      var n;
      var u = navigator.userAgent;

      if( window.orientation != undefined){//★0 の時、false 扱いになるので注意。
        //★iOS、Android、Windows スマホは、これ。
        n = window.orientation;

      } else if(
        screen.orientation &&
        ( 0 <= u.indexOf( 'Chrome') && u.indexOf( 'Edge') < 0)
        //★Chrome であって、ニセの Chrome (Edge のこと) ではない。
        //★Windows タブレットの Chrome は、これ。
      ){
        n = screen.orientation.angle;

      } else return;//★端末の向きを特定できなかった (またはデスクトップ機である) ので、加速度を使用しない。

      var x, y;
      var a = e.accelerationIncludingGravity;

      switch( ( n + 360 + myorientation) % 360){
        case 0: x = a.x; y = -a.y; break;
        case 90: x = -a.y; y = -a.x; break;
        case 180: x = -a.x; y = a.y; break;
        case 270: x = a.y; y = a.x; break;
        default: x = y = 0; break;
      }

      if(
        //★Edge の ua には、何でもかんでも入ってるから注意。
        //★↓Android であって、ニセの Android (Edge のこと) ではない。
        ( 0 <= u.indexOf( 'Android') && u.indexOf( 'Edge') < 0) ||

        //★↓Windows であって、Edge 以外である。
        ( 0 <= u.indexOf( 'Windows') && u.indexOf( 'Edge') < 0)
      ){
        x *= -1.0;
        y *= -1.0;
      }

      accX = 0.9 * accX + 0.1 * x;
      accY = 0.9 * accY + 0.1 * y;
    },
    false
  );

  can = c;
  ctx = c.getContext( '2d');

  resetTouches();

  f = false;

  if( window.PointerEvent){
    //★windows 用
    c.addEventListener( "pointerover", touchIn, f);
    c.addEventListener( "pointerdown", touchBegan, f);
    c.addEventListener( "pointermove", touchMoved, f);
    c.addEventListener( "pointerup", touchEnded, f);
    //c.addEventListener( "pointerleave", touchOut, f);
  } else{
    //★windows 以外用
    c.addEventListener( "touchstart", touchBegan, f);
    c.addEventListener( "touchmove", touchMoved, f);
    c.addEventListener( "touchend", touchEnded, f);
    c.addEventListener( "touchcancel", touchEnded, f);

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
      if( e.pointerType == "mouse") myTouchIn( MOUSEID, e.clientX - x, e.clientY - y);
      else myTouchIn( e.pointerId, e.clientX - x, e.clientY - y);
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
      if( e.pointerType == "mouse") myTouchBegan( MOUSEID, e.clientX - x, e.clientY - y);
      else myTouchBegan( e.pointerId, e.clientX - x, e.clientY - y);
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

    e.preventDefault();
    //e.stopPropagation();

    var r = e.target.getBoundingClientRect();
    var x = r.left;
    var y = r.top;

    if( window.PointerEvent){
      //★Windows 用
      if( e.pointerType == "mouse") myTouchMoved( MOUSEID, e.clientX - x, e.clientY - y);
      else myTouchMoved( e.pointerId, e.clientX - x, e.clientY - y);
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
      if( e.pointerType == "mouse") myTouchEnded( MOUSEID);
      else myTouchEnded( e.pointerId);
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
      if( e.pointerType == "mouse") myTouchOut( MOUSEID);
      else myTouchOut( e.pointerId);
    } else if( e.changedTouches){
      for( i = 0; i < e.changedTouches.length; i++){
        t = e.changedTouches[ i];
        myTouchOut( t.identifier);
      }
    } else myTouchOut( MOUSEID);
    //return false;
  }

  loadedCount = 0;

  initImage();

  initAudio();

  setTargetMag();  currentMag = targetMag;
}

//●==========●==========●==========●==========●==========●==========●

function setTargetMag(){
  var w, h, t;

  w = document.documentElement.clientWidth;
  h = document.documentElement.clientHeight;
  if( myorientation % 180 == 90){ t = w; w = h; h = t;}
  t = 2 * mypadding + 20;  if( w < t) w = t;
  if( h < t) h = t;

  t = 2 * mypadding;
  if( ( h - t) / ( w - t) < REFH / REFW) targetMag = ( h - t) / REFH;
  else targetMag = ( w - t) / REFW;
}

function setFPS( n){
  skFps = n;
  myTimerID = requestAnimationFrame( onTimer);
}

function onTimer(){
  var i;
  var t;
  var w, h;

  myTimerID = requestAnimationFrame( onTimer);
  if( Math.floor( Date.now() * skFps / 1000) == Math.floor( latestTimer * skFps / 1000)) return;
  latestTimer = Date.now();

  for( i = 0; i < MAXTOUCH; i++) if( touchID[ i] != NOID && touchIn[ i]){
    inTouch[ i] = false;
  }

  touch = touching = false;
  for( i = 0; i < MAXTOUCH; i++) if( touchID[ i] != NOID && touchBegan[ i]){
    touch = touching = true;
    touch_x = touchX[ i];
    touch_y = touchY[ i];

    inTouch[ i] = true;
  }

  if( !touch){
    for( i = 0; i < MAXTOUCH; i++) if( touchID[ i] != NOID && inTouch[ i]){
      touching = true;
      touch_x = touchX[ i];
      touch_y = touchY[ i];
    }
  }

  setTargetMag();
  currentMag = targetMag;//★この行をコメントアウトすると、じわじわ伸縮するようになる。

  t = targetMag - currentMag;  if( t != 0){    if( -0.01 < t && t < 0.01) currentMag = targetMag;      else currentMag += 0.1 * t;  }  w = Math.floor( currentMag * REFW);
  h = Math.floor( currentMag * REFH);
  if( myorientation % 180 == 90){ t = w; w = h; h = t;}
  can.width = w;
  can.height = h;

  ctx.save();
  ctx.translate( w / 2, h / 2);
  ctx.scale( currentMag, currentMag);
  ctx.rotate( myorientation * 2 * Math.PI / 360);
  ctx.translate( -REFW / 2, -REFH / 2);  main();

  ctx.restore();

  for( i = 0; i < MAXTOUCH; i++) if( touchID[ i] != NOID){
    touchIn[ i] = false;
    touchBegan[ i] = false;
    touchMX[ i] = NOWHERE;

    if( touchOut[ i]) touchID[ i] = NOID;
    else if( touchEnded[ i]){
      if( touchID[ i] == MOUSEID){
        //★マウスはアップしても要素の中であれば追跡を続ける。
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

//●==========●==========●==========●==========●==========●==========●

function initImage(){
  imgCount = 0;
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

  img[ n].onload = function(){ loadedCount++;};

  imgTryCount[ n] = 0;

  ldi();

  return imgCount++;

  function ldi(){
    img[ n].src = s;
  }
};

function drawImage( n, x, y){
  if( !img[ n].complete) return;

  ctx.drawImage( img[ n], x, y);
}

function drawImageMirrored( n, x, y){
  var w, h;

  if( !img[ n].complete) return;

  w = img[ n].naturalWidth;
  h = img[ n].naturalHeight;

  ctx.save();
  ctx.translate( x + w / 2, y + h / 2);
  ctx.transform( -1, 0, 0, 1, 1, 1);
  ctx.drawImage( img[ n], -w / 2, -h / 2);
  ctx.restore();
}

function drawImageMirroredCentered( n, x, y){ drawImageMirroredCenteredScaled( n, x, y, 1);}
function drawImageMirroredCenteredScaled( n, x, y, s){
  var w, h;

  if( !img[ n].complete) return;

  w = img[ n].naturalWidth;
  h = img[ n].naturalHeight;

  ctx.save();
  ctx.translate( x, y);
  ctx.transform( -1, 0, 0, 1, 1, 1);
  ctx.scale( s, s);
  ctx.drawImage( img[ n], -w / 2, -h / 2);
  ctx.restore();
}

function drawImageCentered( n, x, y, s){ drawImageCenteredScaledRotated( n, x, y, 1, 0);}
function drawImageCenteredScaled( n, x, y, s){ drawImageCenteredScaledRotated( n, x, y, s, 0);}
function drawImageCenteredRotated( n, x, y, r){  drawImageCenteredScaledRotated( n, x, y, 1, r);}
function drawImageCenteredScaledRotated( n, x, y, s, r){
  if( ! img[ n].complete) return;

  ctx.save();
  ctx.translate( x, y);
  ctx.rotate( r);
  ctx.scale( s, s);
  ctx.drawImage( img[ n], -img[ n].naturalWidth / 2, -img[ n].naturalHeight / 2);
  ctx.restore();
}

function drawImagePartially( n, x, y, sx, sy, sw, sh){
  drawImagePartiallyScaled( n, x, y, sx, sy, sw, sh, 1.0);
}
function drawImagePartiallyScaled( n, x, y, sx, sy, sw, sh, s){
  if( !img[ n].complete) return;

  ctx.drawImage( img[ n], sx, sy, sw, sh, x, y, s * sw, s * sh);
}

function drawImagePartiallyCenteredScaledRotated( n, x, y, sx, sy, sw, sh, s, r){
  if( !img[ n].complete) return;

  ctx.save();
  ctx.translate( x, y);
  ctx.rotate( r);
  ctx.scale( s, s);
  ctx.drawImage( img[ n], sx, sy, sw, sh, -sw / 2, -sh / 2, sw, sh);
  ctx.restore();
}

function drawTintedImagePartially( n, x, y, sx, sy, sw, sh, c){
  drawTintedImagePartiallyScaled( n, x, y, sx, sy, sw, sh, 1, c);
}
function drawTintedImagePartiallyScaled( n, x, y, sx, sy, sw, sh, m, c){
  var w, h;
  var can2;
  var ctx2;

  if( !img[ n].complete) return;

  w = m * sw;
  h = m * sh;

  can2 = document.createElement( "canvas");
  can2.width = Math.ceil( w);
  can2.height = Math.ceil( h);
  ctx2 = can2.getContext( "2d");

  ctx2.fillStyle = "#" + ( "00000" + c.toString( 16)).substr( -6);
  ctx2.globalCompositeOperation = "source-over";
  ctx2.fillRect( 0, 0, w, h);

  ctx2.globalCompositeOperation = "destination-atop";
  ctx2.drawImage( img[ n], sx, sy, sw, sh, 0, 0, w, h);
  ctx.drawImage( can2, 0, 0, w, h, x, y, w, h);
}

function drawTintedImageCenteredScaled( n, x, y, s, c){
  drawTintedImageCenteredScaledRotated( n, x, y, s, 0, c);
}
function drawTintedImageCenteredScaledRotated( n, x, y, s, r, c){
  var w, h;
  var can2;
  var ctx2;

  if( !img[ n].complete) return;

  w = img[ n].naturalWidth;
  h = img[ n].naturalHeight;

  can2 = document.createElement( "canvas");
  can2.width = Math.ceil( s * w);
  can2.height = Math.ceil( s * h);
  ctx2 = can2.getContext( "2d");

  ctx2.fillStyle = "#" + ( "00000" + c.toString( 16)).substr( -6);
  ctx2.globalCompositeOperation = "source-over";
  ctx2.fillRect( 0, 0, s * w, s * h);

  ctx2.globalCompositeOperation = "destination-atop";
  ctx2.drawImage( img[ n], 0, 0, w, h, 0, 0, s * w, s * h);

  ctx.save();
  ctx.translate( x, y);
  ctx.rotate( r);
  ctx.drawImage( can2, -0.5 * s * w, -0.5 * s * h);
  ctx.restore();
}

//●==========●==========●==========●==========●==========●==========●

function fillRectColor( x, y, w, h, c){
  ctx.fillStyle = "#" + ( "00000" + c.toString( 16)).substr( -6);
  ctx.fillRect( x, y, w, h);
}

function drawRoundRect( x, y, w, h, r){ prr( x, y, w, h, r); ctx.closePath(); ctx.stroke();}function fillRoundRect( x, y, w, h, r){ prr( x, y, w, h, r); ctx.fill();}function prr( x, y, w, h, r){  ctx.beginPath();  ctx.arc( x + w - r, y + r, r, 0, 1.5 * Math.PI, true);  ctx.arc( x + r, y + r, r, 1.5 * Math.PI, Math.PI, true);  ctx.arc( x + r, y + h - r, r, Math.PI, 0.5 * Math.PI, true);  ctx.arc( x + w - r, y + h - r, r, 0.5 * Math.PI, 0, true);}function fillCircle( x, y, r){
  ctx.beginPath();
  ctx.arc( x, y, r, 0, 2 * Math.PI, true);
  ctx.fill();
}
function drawCircle( x, y, r){
  ctx.beginPath();
  ctx.arc( x, y, r, 0, 2 * Math.PI, true);
  ctx.closePath();
  ctx.stroke();
}

function fillOval( x, y, rw, rh){  ctx.save();  ctx.translate( x, y);  ctx.scale( 1, rh / rw);  ctx.beginPath();  ctx.arc( 0, 0, rw, 0, 2 * Math.PI, true);  ctx.fill();  ctx.restore();}
function drawLine( x, y, x2, y2){  ctx.beginPath();  ctx.moveTo( x, y);  ctx.lineTo( x2, y2);  ctx.stroke();}function drawLineColorWidth( x0, y0, x, y, c, w){
  ctx.strokeStyle = "#" + ( "00000" + c.toString( 16)).substr( -6);
  ctx.lineWidth = w;
  ctx.beginPath();
  ctx.moveTo( x0, y0);
  ctx.lineTo( x, y);
  ctx.stroke();
}

function drawStringSizeColor( x, y, s, p, c){
  ctx.fillStyle = "#" + ( "00000" + c.toString( 16)).substr( -6);
  ctx.font = "" + p + "pt 'Arial'";
  ctx.textAlign = "left";
  ctx.fillText( s, x, y);
}

//●==========●==========●==========●==========●==========●==========●

function initAudio(){
  isAudioIOS = false;

  ac = new( window.AudioContext || window.webkitAudioContext);
  if( !ac) return;

  audioCount = 0;
}

function loadAudio( s){
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
            loadedCount++;
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

function playAudio( n){
  if( !ac || !ab[ n]) return;

  if( absNode[ n]) absNode[ n].stop( 0);

  absNode[ n] = ac.createBufferSource();
  absNode[ n].buffer = ab[ n];
  absNode[ n].connect( ac.destination);
  absNode[ n].start( 0);
}

function playAudioLoop( n){
  if( !ac || !ab[ n]) return;

  if( absNode[ n]) absNode[ n].stop( 0);

  absNode[ n] = ac.createBufferSource();
  absNode[ n].buffer = ab[ n];
  absNode[ n].loop = true;
  absNode[ n].connect( ac.destination);
  absNode[ n].start( 0);
}

function stopAudio( n){
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
