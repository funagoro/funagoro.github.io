

//★外部の変数を参照する

//REFW, REFH
//mypadding, myorientation

//MAXTOUCH
//CAN_PINCH
if( !("CAN_PINCH" in window)) var CAN_PINCH = false;

//IMAGENUM, AUDIONUM

//touchEventHook()

//●==========●==========●==========●==========●==========●==========●

var isAcc;
var accX, accY;

var can;
var ctx;
var currentMag, targetMag;

var fpsCopy;
var myTimerID;
var latestTimer = 0;

var loadedCount;

//●==========●==========●==========●==========●==========●==========●

var NOID = -1, MOUSEID = -2, PINCHMOUSEID = -3;
var NOWHERE = 1000000;

var touchID = new Array( MAXTOUCH);

var touchX = new Array( MAXTOUCH), touchY = new Array( MAXTOUCH);
var touchBX = new Array( MAXTOUCH), touchBY = new Array( MAXTOUCH);
var touchMX = new Array( MAXTOUCH), touchMY = new Array( MAXTOUCH);

var touchIn = new Array( MAXTOUCH);
var touchBegan = new Array( MAXTOUCH);
var touchEnded = new Array( MAXTOUCH);
var touchOut = new Array( MAXTOUCH);

var inTouch = new Array( MAXTOUCH);
var latestTouch = 0;
var latestMouse = 0;

var touch, touching, touching_num;
var touch_id, touch_bx, touch_by;
var touch_x, touch_y;
var touch_dx, touch_dy;
var touch_end;

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
var gainNode = new Array( AUDIONUM);
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

  touch = touching = false;

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

    if( n != MOUSEID && n != PINCHMOUSEID) touchIn[ i] = true;
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
    //★Windows 用。Chrome 55 以降も。
    c.addEventListener( "pointerover", eveTouchIn, f);
    c.addEventListener( "pointerdown", eveTouchStart, f);
    c.addEventListener( "pointermove", eveTouchMove, f);
    c.addEventListener( "pointerup", eveTouchEnd, f);
    c.addEventListener( "pointerleave", eveTouchOut, f);
  } else{
    //★Windows 以外用
    c.addEventListener( "touchstart", eveTouchStart, f);
    c.addEventListener( "touchmove", eveTouchMove, f);
    c.addEventListener( "touchend", eveTouchEnd, f);
    c.addEventListener( "touchcancel", eveTouchEnd, f);

    //c.addEventListener( "mouseover", eveTouchIn, f);
    c.addEventListener( "mouseenter", eveTouchIn, f);
    c.addEventListener( "mousedown", eveTouchStart, f);
    c.addEventListener( "mousemove", eveTouchMove, f);
    c.addEventListener( "mouseup", eveTouchEnd, f);
    //c.addEventListener( "mouseout", eveTouchOut, f);
    c.addEventListener( "mouseleave", eveTouchOut, f);
  }

  if( CAN_PINCH){
    document.addEventListener( "keydown", function( e){
      var i;

      if( e.keyCode == 16){  //shift
        for( i = 0; i < MAXTOUCH; i++){
          if( touchID[ i] == MOUSEID){
            myTouchIn(
              PINCHMOUSEID,
              currentMag * ( REFW - touchX[ i]),
              currentMag * ( REFH - touchY[ i])
            );
            break;
          }
        }
      }
    });

    document.addEventListener( "keyup", function( e){
      var i;

      if( e.keyCode == 16){  //shift
        for( i = 0; i < MAXTOUCH; i++){
          if( touchID[ i] == PINCHMOUSEID){
            myTouchOut( PINCHMOUSEID);
            break;
          }
        }
      }
    });
  }

  function eveTouchIn( e){
    var i;
    var t;

    //e.preventDefault();
    //e.stopPropagation();

    var r = e.target.getBoundingClientRect();
    var x = r.left;
    var y = r.top;

    if( window.PointerEvent){
      //★Windows 用。Chrome も。
      x = e.clientX - x;
      y = e.clientY - y;
      if( e.pointerType == "mouse"){
        myTouchIn( MOUSEID, x, y);
        if( CAN_PINCH && e.shiftKey){
          myTouchIn( PINCHMOUSEID, currentMag * REFW - x, currentMag * REFH - y);
        }
      } else myTouchIn( e.pointerId, x, y);
    } else if( e.changedTouches){
      for( i = 0; i < e.changedTouches.length; i++){
        t = e.changedTouches[ i];
        myTouchIn( t.identifier, t.clientX - x, t.clientY - y);
      }
    } else{
      x = e.clientX - x;
      y = e.clientY - y;
      myTouchIn( MOUSEID, x, y);
      if( CAN_PINCH && e.shiftKey){
        myTouchIn( PINCHMOUSEID, currentMag * REFW - x, currentMag * REFH - y);
      }
    }
    //return false;
  }

  function eveTouchStart( e){
    var i;
    var t;

    e.preventDefault();
    //e.stopPropagation();

    //★タッチイベントのタイミングで実行する必要がある
    if( !e.touches || e.touches.length == 1){
      //iPhone と iPad の Web Audio で、不思議なこと。
      //複数同時タッチの touchstart 内では、scriptProcessorNode を始動できない。
      //複数同時タッチ中のシングルタッチでも始動できない。
      //タッチが1ピクセルも動かなかった後の touchend では始動できる。
      //タッチが動いた後の touchend では始動できない。
      if( ac && !isAudioIOS) startAudioIOS();
    }

    var r = e.target.getBoundingClientRect();
    var x = r.left;
    var y = r.top;
    var n = Date.now();

    if( window.PointerEvent){
      //★Windows 用。Chrome も。
      x = e.clientX - x;
      y = e.clientY - y;
      if( e.pointerType == "mouse"){
        myTouchBegan( MOUSEID, x, y);
        if( CAN_PINCH && e.shiftKey){
          myTouchBegan( PINCHMOUSEID, currentMag * REFW - x, currentMag * REFH - y);
        }
      } else myTouchBegan( e.pointerId, x, y);
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
        x = e.clientX - x;
        y = e.clientY - y;
        myTouchBegan( MOUSEID, x, y);
        if( CAN_PINCH && e.shiftKey){
          myTouchBegan( PINCHMOUSEID, currentMag * REFW - x, currentMag * REFH - y);
        }
      }
    }

    if( typeof touchEventHook == "function") touchEventHook();

    //return false;
  }

  function eveTouchMove( e){
    var i;
    var t;

    e.preventDefault();
    //e.stopPropagation();

    var r = e.target.getBoundingClientRect();
    var x = r.left;
    var y = r.top;

    if( window.PointerEvent){
      //★Windows 用。Chrome も。
      x = e.clientX - x;
      y = e.clientY - y;
      if( e.pointerType == "mouse"){
        myTouchMoved( MOUSEID, x, y);
        if( CAN_PINCH && e.shiftKey){
          myTouchMoved( PINCHMOUSEID, currentMag * REFW - x, currentMag * REFH - y);
        }
      } else myTouchMoved( e.pointerId, x, y);
    } else if( e.changedTouches){
      for( i = 0; i < e.changedTouches.length; i++){
        t = e.changedTouches[ i];
        myTouchMoved( t.identifier, t.clientX - x, t.clientY - y);
      }
    } else{
      x = e.clientX - x;
      y = e.clientY - y;
      myTouchMoved( MOUSEID, x, y);
      if( CAN_PINCH && e.shiftKey){
        myTouchMoved( PINCHMOUSEID, currentMag * REFW - x, currentMag * REFH - y);
      }
    }
    //return false;
  }

  function eveTouchEnd( e){
    var i;
    var t;

    //e.preventDefault();
    //e.stopPropagation();

    if( e.touches && e.touches.length == 0){
      //★不正なトラッキングが残っていたら消す。
      //(タッチデバイスなのに、MOUSEID が残ってしまう場合があるから。)
      //(canvas 外でダブルタップして、ルーペ機能が出た時に？
      //window.touches が undefined になって、タッチデバイスなのに MOUSEID が残る？)
      for( i = 0; i < e.changedTouches.length; i++){
        t = e.changedTouches[ i];
        myTouchEnded( t.identifier);
      }
      for( i = 0; i < MAXTOUCH; i++) if( touchID[ i] != NOID && !touchEnded[ i]) touchID[ i] = NOID;
      return;//★抜ける。
    }

    if( window.PointerEvent){
      //★Windows 用。Chrome も。
      if( e.pointerType == "mouse"){
        myTouchEnded( MOUSEID);
        if( CAN_PINCH && e.shiftKey) myTouchEnded( PINCHMOUSEID);
      } else myTouchEnded( e.pointerId);
    } else if( e.changedTouches){
      for( i = 0; i < e.changedTouches.length; i++){
        t = e.changedTouches[ i];
        myTouchEnded( t.identifier);
      }
    } else{
      myTouchEnded( MOUSEID);
      if( CAN_PINCH && e.shiftKey) myTouchEnded( PINCHMOUSEID);
    }
    //return false;
  }

  function eveTouchOut( e){
    var i;
    var t;

    //e.preventDefault();
    //e.stopPropagation();

    if( window.PointerEvent){
      //★Windows 用。Chrome も。
      if( e.pointerType == "mouse"){
        myTouchOut( MOUSEID);
        if( CAN_PINCH && e.shiftKey) myTouchOut( PINCHMOUSEID);
      } else myTouchOut( e.pointerId);
    } else if( e.changedTouches){
      for( i = 0; i < e.changedTouches.length; i++){
        t = e.changedTouches[ i];
        myTouchOut( t.identifier);
      }
    } else{
      myTouchOut( MOUSEID);
      if( CAN_PINCH && e.shiftKey) myTouchOut( PINCHMOUSEID);
    }
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
  fpsCopy = n;
  myTimerID = requestAnimationFrame( onTimer);
}

function onTimer(){
  var i;
  var t;
  var w, h;

  myTimerID = requestAnimationFrame( onTimer);
  if( Math.floor( Date.now() * fpsCopy / 1000) == Math.floor( latestTimer * fpsCopy / 1000)) return;
  latestTimer = Date.now();

  for( i = 0; i < MAXTOUCH; i++) if( touchID[ i] != NOID){
    if( touchIn[ i]) inTouch[ i] = false;
    if( touchBegan[ i]) inTouch[ i] = true;
  }

  touch = touch_end = false;
  if( touching){
    if( touchID[ touch_id] == NOID || touchEnded[ touch_id] || touchOut[ touch_id]){
      touch_end = true;
      touching = false;
    } else{
      touch_x = touchX[ touch_id];
      touch_y = touchY[ touch_id];
      if( touchMX[ touch_id] == NOWHERE){
        touch_dx = touch_dy = 0;
      } else{
        touch_dx = touch_x - touchMX[ touch_id];
        touch_dy = touch_y - touchMY[ touch_id];
      }
    }
  } else{
    for( i = 0; i < MAXTOUCH; i++) if( touchID[ i] != NOID && touchBegan[ i]){
      touch_id = i;
      touch = touching = true;
      touch_x = touch_bx = touchX[ i];
      touch_y = touch_by = touchY[ i];
      touch_dx = touch_dy = 0;
      break;
    }
  }
  touching_num = 0;
  for( i = 0; i < MAXTOUCH; i++) if( touchID[ i] != NOID && inTouch[ i]) touching_num++;

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
      if( touchID[ i] == MOUSEID || touchID[ i] == PINCHMOUSEID){
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
function drawImageScaled( n, x, y, s){
  var w, h;

  if( !img[ n].complete) return;

  w = img[ n].naturalWidth;
  h = img[ n].naturalHeight;

  ctx.drawImage( img[ n], x, y, s * w, s * h);
}

function drawImagePartToPart( n, x, y, w, h, sx, sy, sw, sh){
  ctx.drawImage( img[ n], sx, sy, sw, sh, x, y, w, h);
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

function drawImageMirroredCentered( n, x, y){ drawImageMirroredCenteredScaledRotated( n, x, y, 1, 0);}
function drawImageMirroredCenteredScaled( n, x, y, s){ drawImageMirroredCenteredScaledRotated( n, x, y, s, 0);}
function drawImageMirroredCenteredScaledRotated( n, x, y, s, r){
  var w, h;

  if( !img[ n].complete) return;

  w = img[ n].naturalWidth;
  h = img[ n].naturalHeight;

  ctx.save();
  ctx.translate( x, y);
  ctx.transform( -1, 0, 0, 1, 1, 1);
  ctx.scale( s, s);
  ctx.rotate( r);
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
  ctx.scale( s, s);
  ctx.rotate( r);
  ctx.drawImage( img[ n], -img[ n].naturalWidth / 2, -img[ n].naturalHeight / 2);
  ctx.restore();
}

function drawImagePartially( n, x, y, sx, sy, sw, sh){ drawImagePartiallyScaled( n, x, y, sx, sy, sw, sh, 1.0);}
function drawImagePartiallyScaled( n, x, y, sx, sy, sw, sh, s){
  if( !img[ n].complete) return;

  ctx.drawImage( img[ n], sx, sy, sw, sh, x, y, s * sw, s * sh);
}

function drawImagePartiallyCentered( n, x, y, sx, sy, sw, sh){
  drawImagePartiallyCenteredScaledRotated( n, x, y, sx, sy, sw, sh, 1, 0);
}
function drawImagePartiallyCenteredScaled( n, x, y, sx, sy, sw, sh, s){
  drawImagePartiallyCenteredScaledRotated( n, x, y, sx, sy, sw, sh, s, 0);
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
function drawTintedImagePartiallyCenteredScaled( n, x, y, sx, sy, sw, sh, s, c){
  drawTintedImagePartiallyCenteredScaledRotated( n, x, y, sx, sy, sw, sh, s, 0, c);
}
function drawTintedImagePartiallyCenteredScaledRotated( n, x, y, sx, sy, sw, sh, s, r, c){
  var w, h;
  var can2;
  var ctx2;

  if( !img[ n].complete) return;

  w = s * sw;
  h = s * sh;

  can2 = document.createElement( "canvas");
  can2.width = Math.ceil( w);
  can2.height = Math.ceil( h);
  ctx2 = can2.getContext( "2d");

  ctx2.fillStyle = "#" + ( "00000" + c.toString( 16)).substr( -6);
  ctx2.globalCompositeOperation = "source-over";
  ctx2.fillRect( 0, 0, w, h);

  ctx2.globalCompositeOperation = "destination-atop";
  ctx2.drawImage( img[ n], sx, sy, sw, sh, 0, 0, w, h);

  ctx.save();
  ctx.translate( x, y);
  ctx.rotate( r);
  ctx.drawImage( can2, -0.5 * w, -0.5 * h);
  ctx.restore();
}

function drawTintedImageCenteredScaled( n, x, y, s, c){
  drawTintedImageCenteredScaledRotated( n, x, y, s, 0, c);
}
function drawTintedImageCenteredScaledRotated( n, x, y, s, r, c){
  var sw, sh;

  sw = img[ n].naturalWidth;
  sh = img[ n].naturalHeight;

  if( !img[ n].complete) return;

  drawTintedImagePartiallyCenteredScaledRotated( n, x, y, 0, 0, sw, sh, s, r, c);
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
  var i;

  isAudioIOS = false;
  ac = new( window.AudioContext || window.webkitAudioContext);
  audioCount = 0;

  for( i = 0; i < AUDIONUM; i++){
    gainNode[ i] = ac.createGain();
    gainNode[ i].gain.value = 1.0;
    gainNode[ i].connect( ac.destination);
  }
}

function loadAudioBase64( i){
  var j, l, n;
  var s;
  var b;

  n = audioCount++;

  s = atob( audioBase64[ i]);
  l = s.length;
  b = new Uint8Array( l);
  for( j = 0; j < l; j++) b[ j] = s.charCodeAt( j);

  ac.decodeAudioData(
    b.buffer,
    function onSuccess( buf){
      ab[ n] = buf;
      loadedCount++;
    },
    function onFailure(){ console.log( "err dec snd " + n);}
  );

  return n;
}

function loadAudio( s){
  var a;
  var n;
  var r;
  var res;

  n = audioCount++;

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

  return n;

  function lda(){
    try{
      r.open( 'GET', s, true);
      r.responseType = 'arraybuffer';
      r.send();
    } catch( e){}
  }
}

function setAudioVolume( n, v){
  gainNode[ n].gain.value = v;
}

function playAudio( n){
  if( !ac || !ab[ n]) return;

  if( absNode[ n]) absNode[ n].stop( 0);

  absNode[ n] = ac.createBufferSource();
  absNode[ n].buffer = ab[ n];
  //absNode[ n].connect( ac.destination);
  absNode[ n].connect( gainNode[ n]);
  absNode[ n].start( 0);
}

function playAudioLoop( n){
  if( !ac || !ab[ n]) return;

  if( absNode[ n]) absNode[ n].stop( 0);

  absNode[ n] = ac.createBufferSource();
  absNode[ n].buffer = ab[ n];
  absNode[ n].loop = true;
  //absNode[ n].connect( ac.destination);
  absNode[ n].connect( gainNode[ n]);
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
  isAudioIOS = true;
  ac.createBufferSource().start( 0);
}
