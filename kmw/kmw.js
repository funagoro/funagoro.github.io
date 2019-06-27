//ガワネイティブにする時は

var SP = "mxw_";//★これを付けないと、別のアプリのデータと混ざってしまう。

//●==========●==========●==========●==========●==========●==========●

var kImgLoading;
var kImgBGGame, kImgStart, kImgGameOver;
var kImgButtonInfo, kImgInfo;
var kImgMen, kImgExplosion, kImgNumbers;
var kImgButtonAuthor, kImgAudio;

var IMAGENUM = 12;

var kAudDecide;
var kAudDead;
var kAudAppear;
var AUDIONUM = 14;

//●==========●==========●==========●==========●==========●==========●

var FPS = 30;
var MAXTOUCH = 5;
var ANIMUNIT = 1;

var REFW = 600, REFH = 800;
var mypadding = 10;
var myorientation = 0;

var STATE_DEFAULT = 0, STATE_LOADING = 1;
var STATE_TITLE = 2, STATE_INFO = 3, STATE_GAME = 4, STATE_GAME_OVER = 5;

var PX = 0, PY = 200, PW = 150, PH = 150, SLIPSPEED = 30;
var MW = 4, MH = 4, MHW = MH * MW;

//●==========●==========●==========●==========●==========●==========●
//永続させるグローバル変数

var isAudio;

var map = new Array( MHW);
var counterMap = new Array( MHW);
var emotionMap = new Array( MHW);
var EMOTION_NORMAL = 0;
var EMOTION_SLIP = 1;
var EMOTION_APPEAR = 2;
var VP = [ -MW, 1, MW, -1];
var VX = [ 0, 1, 0, -1];
var VY = [ -1, 0, 1, 0];

//●==========●==========●==========●==========●==========●==========●

var currentState, nextState, stateCount;

var isSlipping;
var slipNum;
var direction, lead;
var score, displayScore;
var hiscores = new Array( 5);

var MAXSMOKENUM = 100;
var smokeN = new Array( MAXSMOKENUM);
var smokeX = new Array( MAXSMOKENUM);
var smokeY = new Array( MAXSMOKENUM);

//●==========●==========●==========●==========●==========●==========●

function play( n){ if( isAudio) playAudio( n);}

//●==========●==========●==========●==========●==========●==========●

onload = function(){

  //console.log( (254).toString( 16));
  //console.log( parseInt( "0x" + "fe"));
  
  skeleton( document.getElementById( "canvas1"));

  currentState = STATE_DEFAULT;
  nextState = STATE_LOADING;

  setFPS( FPS);
};

//●==========●==========●==========●==========●==========●==========●

function main(){
  if( currentState != nextState){
    resetTouches();
    currentState = nextState;
    stateCount = 0;
  }

  if( STATE_TITLE <= currentState) processTouch();

  processMain();

  drawMain();

  //★一年間でカンスト。
  if( stateCount < 365 * 24 * 60 * 60 * FPS) stateCount++;
}

//●==========●==========●==========●==========●==========●==========●

function loadPermanents(){
  var i;
  var s;

  score = parseInt( localStorage.getItem( SP + "score"));
  for( i = 0; i < 5; i++) hiscores[ i] = parseInt( localStorage.getItem( SP + "hs" + i));
  isAudio = localStorage.getItem( SP + "isAudio") == "true";

  s = localStorage.getItem( SP + "map");
  for( i = 0; i < MHW; i++) map[ i] = parseInt( "0x" + s.substr( i, 1));
}

function savePermanents(){
  var i;
  var s;

  s = "";
  for( i = 0; i < MHW; i++) s += map[ i].toString( 16);

  try{
    localStorage.setItem( SP + "score", score);
    for( i = 0; i < 5; i++) localStorage.setItem( SP + "hs" + i, hiscores[ i]);
    localStorage.setItem( SP + "isAudio", isAudio);
    localStorage.setItem( SP + "map", s);
  } catch( e){};
}

//●==========●==========●==========●==========●==========●==========●

function processTouch(){
  var d, i;
  var x, y;
  var f;

  if( currentState == STATE_GAME){
    if( isSlipping) return;
    for( i = 0; i < MHW; i++) if( 0 < map[ i] && emotionMap[ i] == EMOTION_APPEAR) return;
  }

  for( i = 0; i < MAXTOUCH; i++) if( touchID[ i] != NOID){
    x = touchX[ i];
    y = touchY[ i];

    if( touchBegan[ i]){

      switch( currentState){

      case STATE_TITLE:
        if( y < 100){
          if( x < 100){
            //作者ボタンがタッチされた。

            //★web 版の場合、無効を表現する音が出るだけ。
            play( kAudDecide);

            //★旧 Android へ組込む時
            //location.assign( 'market://search?q=www.mameson.com');
            //★新 Android へ組込む時
            //location.assign( 'http://play.google.com/store/apps/developer?id=www.mameson.com');

            //★iOS へ組込む時
            //location.assign( 'https://itunes.apple.com/jp/artist/akihiro-maeda/id298274003?mt=8');

          } else if( REFW - 100 <= x){
            //音 ON / OFF ボタンがタッチされた。
            isAudio = !isAudio;
            play( kAudDecide);
          }
        } else if( y < 200 && x < 100){
          //★インフォボタンがタッチされた。
          play( kAudDecide);
          nextState = STATE_INFO;
        }else{
          play( kAudAppear);
          nextState = STATE_GAME;
        }
        break;

      case STATE_INFO:
        play( kAudDecide);
        nextState = STATE_TITLE;
        break;

      case STATE_GAME:
        //play( kAudDecide);
        if( touchY[ i] < 30) nextState = STATE_GAME_OVER;
        break;

      case STATE_GAME_OVER:
        if( FPS <= stateCount){
          play( kAudDecide);
          nextState = STATE_TITLE;
        }
        break;
      }
    }

    if( inTouch[ i]){
      switch( currentState){

      case STATE_TITLE:
        //a
        break;

      case STATE_GAME:
        x = touchX[ i] - touchBX[ i];
        y = touchY[ i] - touchBY[ i];

        if( x == 0 && y == 0) d = -1;
        else if( x * x < y * y) if( y < 0) d = 0; else d = 2;
        else if( x < 0) d = 3; else d = 1;

        if( d != direction) setDirection( d);

        lead = Math.sqrt( x * x + y * y);
        if( PW < lead) lead = PW;
        if( PH < lead) lead = PH;

        if( d % 2) f = ( 0.5 * PW < lead);
        else f = ( 0.5 * PH < lead);

        if( f && 0 < slipNum){
          isSlipping = true;
          touchID[ i] = NOID;
          touchEnded[ i] = touchOut[ i] = false;
        }

        break;

      case STATE_GAME_OVER:
        break;
      }
    }

    if( touchEnded[ i] || touchOut[ i]){
      switch( currentState){

      case STATE_TITLE:
        //a
        break;

      case STATE_GAME:
        for( i = 0; i < MHW; i++) if( 0 < map[ i]){
          emotionMap[ i] = EMOTION_NORMAL;
        }
        break;

      case STATE_GAME_OVER:
        break;
      }
    }

    //break;//★ひとつめのタッチだけで抜ける。
  }
}

function setDirection( d){
  var a, i, p, q, vq;
  var f;

  direction = d;

  slipNum = 0;

  if( d == 0 || d == 3){ q = 0; vq = 1;} else { q = MHW - 1; vq = -1;}

  for( i = 0; i < MHW; i++, q+= vq) if( 0 < map[ q]){
    if( d < 0) a = EMOTION_NORMAL;
    else{
      p = q + VP[ d];

      if( d % 2) f = ( Math.floor( q / MW) == Math.floor( p / MW));
      else f = ( 0 <= p && p < MHW);

      if( f && ( map[ p] == 0 || map[ p] == map[ q] || emotionMap[ p] == EMOTION_SLIP)){
        a = EMOTION_SLIP;
        slipNum++;
      } else{
        a = EMOTION_NORMAL;
      }
    }
    if( emotionMap[ q] != EMOTION_APPEAR) emotionMap[ q] = a;
  }
}

//●==========●==========●==========●==========●==========●==========●

function processMain(){
  var a, i, j, n, p, p2, q, vq;
  var f;

  function li( s){ return loadImage( "image/" + s + ".png");}

  switch( currentState){

  case STATE_LOADING:
    if( stateCount == 0){
      kImgLoading = li( "loading1");
      li( "loading2");

      kImgBGGame = -1;
    }

    if( kImgBGGame < 0 && img[ kImgLoading].complete && img[ kImgLoading + 1].complete){
      kImgBGGame = li( "bg_game");
      kImgStart = li( "start");
      kImgGameOver = li( "game_over");

      kImgButtonInfo = li( "button_info");
      kImgInfo = li( "info");

      kImgMen = li( "men");
      kImgExplosion = li( "explosion");
      kImgNumbers = li( "numbers");

      kImgButtonAuthor = li( "button_author");
      kImgAudio = li( "audio");

      kAudDecide = loadAudio( "audio/decide.mp3");
      kAudDead = loadAudio( "audio/dead.mp3");
      kAudAppear = loadAudio( "audio/1.mp3");
      loadAudio( "audio/2.mp3");
      loadAudio( "audio/3.mp3");
      loadAudio( "audio/4.mp3");
      loadAudio( "audio/5.mp3");
      loadAudio( "audio/6.mp3");
      loadAudio( "audio/7.mp3");
      loadAudio( "audio/8.mp3");
      loadAudio( "audio/9.mp3");
      loadAudio( "audio/10.mp3");
      loadAudio( "audio/11.mp3");
      loadAudio( "audio/12.mp3");
    }

    if( loadedCount == IMAGENUM + AUDIONUM && FPS <= stateCount){

      score = undefined;
      if( "localStorage" in window){
        try{ score = localStorage.getItem( SP + "score");} catch( e){}
      }

      if( score){
        loadPermanents();
        if( score == 0) nextState = STATE_TITLE;
        else{
          displayScore = score;
          for( i = 0; i < MHW; i++) if( 0 < map[ i]) emotionMap[ i] = EMOTION_NORMAL;
          currentState = nextState = STATE_GAME;
          stateCount = 0;
        }
      } else{
        //★score が、文字列 "undefined" → NaN とパースされた場合もここに来る。
        isAudio = true;
        for( i = 0; i < 5; i++) hiscores[ i] = Math.pow( 10, 4 - i);
        nextState = STATE_TITLE;
      }
    }

    break;

  case STATE_TITLE:
    if( stateCount == 0){
      score = displayScore = 0;
      for( i = 0; i < MHW; i++) map[ i] = 0;
      savePermanents();
    }
    break;

  case STATE_INFO:
    break;

  case STATE_GAME:
    if( stateCount == 0){
      appear();
      score = 1;
      isSlipping = false;
    }

    if( isSlipping){
      //★惰性でスリップ中。
      lead += SLIPSPEED;

      if( direction % 2){ f = ( PW <= lead); if( f) lead -= PW;}
      else{ f = ( PH <= lead); if( f) lead -= PH;}

      if( f){
        //★ひとマス分、進んだ時。
        if( direction == 0 || direction == 3){ q = 0; vq = 1;} else{ q = MHW - 1; vq = -1;}

        n = 0;
        isSlipping = false;
        for( i = 0; i < MHW; i++){
          if( 0 < map[ q] && emotionMap[ q] == EMOTION_SLIP){
            p = q + VP[ direction];

            if( map[ p] == 0){
              map[ p] = map[ q];

              p2 = p + VP[ direction];
              if( direction % 2) f = ( Math.floor( p / MW) == Math.floor( p2 / MW));
              else f = ( 0 <= p2 && p2 < MHW);

              if( f && (
                map[ p2] == 0 ||
                ( map[ p2] == map[ p] && emotionMap[ p2] == EMOTION_NORMAL) ||
                emotionMap[ p2] == EMOTION_SLIP
                )){
                emotionMap[ p] = EMOTION_SLIP;
                isSlipping = true;
              } else{
                emotionMap[ p] = EMOTION_NORMAL;
              }
            } else{
              map[ p]++;
              if( n < map[ p]) n = map[ p];
              emotionMap[ p] = EMOTION_APPEAR;
              counterMap[ p] = 4 * ANIMUNIT;
            }
            map[ q] = 0;
          }
          q += vq;
        }

        if( 0 < n){
          //★登場音。
          play( kAudAppear - 1 + n);
        }

        if( !isSlipping){
          //★スリップ中のパネルが、ひとつもなくなった瞬間。
          appear();
          if( n == 0) play( kAudAppear);

          score = 0;
          for( i = 0; i < MHW; i++) if( 0 < map[ i]) score += Math.pow( 10, map[ i] - 1);

          for( i = 0; i < 4; i++){
            setDirection( i);
            if( 0 < slipNum) break;
          }
          setDirection( -1);
          if( i < 4) savePermanents();
          else nextState = STATE_GAME_OVER
        }
      }
    }

    progressAnimation();

    a = score - displayScore;
    if( a != 0){
      if( -10 < a && a < 10) if( 0 < a) displayScore++; else displayScore--;
      else displayScore += Math.floor( 0.5 * a);
    }

    break;

  case STATE_GAME_OVER:
    if( stateCount == 0){
      play( kAudDead);

      for( i = 0; i < 5; i++){
        if( hiscores[ i] <= score){
          for( j = 4; i < j; j--) hiscores[ j] = hiscores[ j - 1];
          hiscores[ i] = score;
          break;
        }
      }
    }

    progressAnimation();

    break;
  }
}

onkeydown = function( e){
  var a;

  e.preventDefault();

  if( currentState == STATE_GAME){
    if( isSlipping) return;
    for( i = 0; i < MHW; i++) if( 0 < map[ i] && emotionMap[ i] == EMOTION_APPEAR) return;

    a = e.keyCode;
    if( 37 <= a && a <= 40){
      setDirection( ( a - 37 + 3) % 4);
      if( 0 < slipNum){
        lead = 0;
        isSlipping = true;
      }
    }
  }
};

function appear(){
  var a, b, i, j, p;

  a = 0;
  for( i = 0; i < MHW; i++) if( map[ i] == 0) a++;

  p = 0;
  for( i = 0; i < 1; i++){
    if( a == 0) break;
    b = Math.floor( a * Math.random());
    for( j = 0; j < MHW; j++){
      if( map[ p] == 0) if( b == 0){
        map[ p] = 1;
        emotionMap[ p] = EMOTION_APPEAR;
        counterMap[ p] = 0;
        break;
      } else b--;
      p = ++p % MHW;
    }
    a--;
  }
}

function progressAnimation(){
  var i;

  for( i = 0; i < MHW; i++) if( 0 < map[ i] && emotionMap[ i] == EMOTION_APPEAR){
    if( ++counterMap[ i] == 8 * ANIMUNIT) emotionMap[ i] = EMOTION_NORMAL;
  }
}

//●==========●==========●==========●==========●==========●==========●

function drawMain(){
  var a, b, c, i, j, p;
  var t, x, y;

  switch( currentState){

  case STATE_LOADING:
    if( kImgBGGame < 0){
      //ctx.fillStyle = "#f8f0f0";
      //ctx.fillRect( 0, 0, REFW, REFH);
      ctx.clearRect( 0, 0, REFW, REFH);
    } else{
      //ctx.fillStyle = "#666666";
      //ctx.fillRect( 0, 0, REFW, REFH);
      ctx.clearRect( 0, 0, REFW, REFH);

      drawImage( kImgLoading, 0, 0);
      if( stateCount % 4 < 2) drawImage( kImgLoading + 1, 144, 190);
      else drawImageMirrored( kImgLoading + 1, 144, 190);

      t = stateCount / FPS;
      if( 1 < t) t = 1;

      t *= loadedCount / ( IMAGENUM + AUDIONUM);

      if( t < 1){
        //★プログレスバー
        ctx.fillStyle = "#000000";
        ctx.fillRect( 0.15 * REFW, 0.9 * REFH, t * 0.7 * REFW, 0.02 * REFH);
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 2;
        ctx.strokeRect( 0.15 * REFW, 0.9 * REFH, 0.7 * REFW, 0.02 * REFH);
      } else{
        //★ロード完了、ワンタッチ待ち
        if( stateCount % 6 < 4){
          //drawStringPP( 0.5 * REFW - 60, 0.89 * REFH, "GO !!", 2, 0x000000);
        }
      }
    }
    break;

  case STATE_TITLE:
    drawImage( kImgBGGame, 0, 0);

    x = 5; y = 5;
    ctx.save();
    ctx.translate( x, y);
    ctx.scale( 80 / 124, 80 / 124);
    ctx.globalAlpha = 0.7;
    drawImage( kImgButtonAuthor, 0, 0);
    ctx.restore();

    drawImage( kImgButtonInfo, 10, 110);

    x = REFW - 80 - 5;
    if( isAudio){
      drawTintedImagePartially( kImgAudio, x, y, 0, 80, 80, 80, 0xeedd99);
      drawTintedImagePartially(
        kImgAudio, x, y - 8 * Math.sin( stateCount % 15 * Math.PI / 15),
        0, 160, 80, 80, 0xeedd99
      );
    } else drawTintedImagePartially( kImgAudio, x, y, 0, 0, 80, 80, 0xeedd99);

    for( i = 0; i < 5; i++){
      drawStringSizeColor( 400, 160 + i * 130, "第" + ( 1 + i) + "位", 30, 0x000000);
      ctx.fillStyle = "rgba(" + ( 255 - i * 30) + ",153," + ( 135 + i * 40) + ",0.5)";
      drawYen( 512, 225 + i * 130, hiscores[ i]);
    }

    ctx.globalAlpha = 0.7;
    drawImageCenteredScaledRotated(
      kImgStart, 0.5 * REFW, 0.5 * REFH,
      1 + 0.1 * Math.sin( stateCount * 2 * Math.PI / ( 2 * FPS)),
      0.03 * Math.PI * Math.sin( stateCount * 2 * Math.PI / ( 0.7 * FPS))
    );
    ctx.globalAlpha = 1.0;

    break;

  case STATE_INFO:
    drawImage( kImgInfo, 0, 0);
    break;

  case STATE_GAME:
    drawImage( kImgBGGame, 0, 0);

    drawStringSizeColor( 20, 120, "ただいまの獲得金額は", 30, 0x000000);
    ctx.fillStyle = "rgba( 255, 255, 0, 0.5)";
    drawYen( 512, 190, displayScore);
    drawStringSizeColor( 520, 190, "です", 30, 0x000000);

    drawBoard();

    break;

  case STATE_GAME_OVER:
    drawImage( kImgBGGame, 0, 0);

    drawStringSizeColor( 20, 120, "最終的な獲得金額は", 30, 0x000000);
    ctx.fillStyle = "rgba( 255, 255, 0, 0.5)";
    drawYen( 512, 190, displayScore);
    drawStringSizeColor( 520, 190, "でした", 18, 0x000000);

    drawBoard();

    if( stateCount < FPS) t = 0.5 * stateCount / FPS; else t = 0.5;
    ctx.fillStyle = "rgba( 0, 0, 0," + t + ")";
    ctx.fillRect( 0, 0, REFW, REFH);

    if( t == 0.5) drawImageCenteredScaledRotated(
      kImgGameOver, 0.5 * REFW, 0.6 * REFH,
      1 + 0.3 * Math.sin( stateCount * 2 * Math.PI / ( 2 * FPS)),
      0.07 * Math.PI * Math.sin( stateCount * 2 * Math.PI / ( 0.7 * FPS))
    );

    break;
  }
/*
//★デバグ用表示
ctx.fillStyle = "rgba( 0, 0, 0, 0.3)";
ctx.fillRect( 0, REFH - 30, REFW, 30);
ctx.fillStyle = "#ffffff";
ctx.font = "18pt 'Arial'";
ctx.fillText( "is: " + isSlipping, 5, REFH - 5);
*/
}

function drawBoard(){
  var a, b, c, i, j, p;
  var x, y;

  for( i = 0; i < MAXSMOKENUM; i++) smokeN[ i] = -1;

  for( i = 0; i < MHW; i++){
    a = map[ i];
    if( 0 < a){
      x = PX + ( i % MW) * PW;
      y = PY + Math.floor( i / MW) * PH;

      b = emotionMap[ i];
      c = counterMap[ i];

      switch( b){

      case EMOTION_NORMAL:
        drawImagePartially( kImgMen, x - 20, y - 50, ( a - 1) * 190, 0, 190, 210);
        break;

      case EMOTION_APPEAR:
        if( 4 * ANIMUNIT <= c){
          drawImagePartially( kImgMen, x - 20, y - 50, ( a - 1) * 190, 0, 190, 210);
        }
        drawImagePartially( kImgExplosion, x - 40, y - 40, Math.floor( c / ANIMUNIT) * 230, 0, 230, 230);
        break;

      case EMOTION_SLIP:
        x += lead * VX[ direction];
        y += lead * VY[ direction];
        drawImagePartially( kImgMen, x - 20, y - 50, ( a - 1) * 190, 0, 190, 210);

        p = i + VP[ direction];
        if( map[ p] == a && emotionMap[ p] != EMOTION_SLIP){
          for( j = 0; j < MAXSMOKENUM; j++) if( smokeN[ j] < 0){
            if( direction % 2) c = PW; else c = PH;
            smokeX[ j] = x + 0.5 * ( c - lead) * VX[ direction] - 40;
            smokeY[ j] = y + 0.5 * ( c - lead) * VY[ direction] - 40;
            smokeN[ j] = Math.floor( 4 * lead / c);
            //drawImagePartially( kImgExplosion, x - 40, y - 40, c * 230, 0, 230, 230);
            break;
          }
        }
        break;
      }
    }
  }

  for( i = 0; i < MAXSMOKENUM; i++) if( 0 <= smokeN[ i]){
    drawImagePartially( kImgExplosion, smokeX[ i], smokeY[ i], smokeN[ i] * 230, 0, 230, 230);
  }
}

function drawYen( x0, y, n){
  var a, b, c, i;
  var x;

  //★最大 20 文字。 (カンマと円も数えて。)
  var d = new Array( 20);
  var z = new Array( 20);

  c = 0;

  x = x0 - 33;
  z[ c] = x; d[ c++] = 11;

  x -= 4;

  a = 1;
  for( i = 0; a <= n || i == 0; i++){
    b = Math.floor( n / a) % 10;

    if( i % 3 == 0 && 0 < i){
      x -= 17;
      z[ c] = x; d[ c++] = 10;
      if( b == 7) x += 10;
    }

    if( b == 1) x -= 29; else x -= 33;
    z[ c] = x; d[ c++] = b;

    a *= 10;
  }

  ctx.fillRect( x - 30, y - 24, x0 - x + 60, 35);

  for( i = 0; i < c; i++){
    drawImagePartially( kImgNumbers, z[ i], y - 56, d[ i] * 33, 0, 33, 68);
  }
}
