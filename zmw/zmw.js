var b2AABB = Box2D.Collision.b2AABB;
var b2Body = Box2D.Dynamics.b2Body;
var b2BodyDef = Box2D.Dynamics.b2BodyDef;
//var b2CircleShape = Box2D.Collision.Shapes.b2CircleShape;
//var b2DebugDraw = Box2D.Dynamics.b2DebugDraw;
//var b2Fixture = Box2D.Dynamics.b2Fixture;
var b2FixtureDef = Box2D.Dynamics.b2FixtureDef;
//var b2MassData = Box2D.Collision.Shapes.b2MassData;
var b2MouseJointDef =  Box2D.Dynamics.Joints.b2MouseJointDef;
var b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape;
//var b2PrismaticJointDef = Box2D.Dynamics.Joints.b2PrismaticJointDef;
var b2Vec2 = Box2D.Common.Math.b2Vec2;
var b2World = Box2D.Dynamics.b2World;

//●==========●==========●==========●==========●==========●==========●

var kImgLoading;
var kImgBGTitle, kImgBGGame;
var kImgBorderS, kImgHalfway, kImgLetters, kImgPanel, kImgAuthor, kImgAudio;
var IMAGENUM = 17;

var kAudDecide;
var AUDIONUM = 1;

//●==========●==========●==========●==========●==========●==========●

var SP = "ppw_";//★これを付けないと、別のアプリのデータと混ざってしまう。

var FPS = 30;
var MAXTOUCH = 5;

var REFW = 640, REFH = 920;
var mypadding = 30;
var myorientation = 0;

var STATE_DEFAULT = 0;
var STATE_LOADING_FIRST = 1, STATE_LOADING_IMAGE = 2, STATE_LOADING_AUDIO = 3;
var STATE_TITLE = 4, STATE_GAME = 5;

var QUESTION_NUM = 10;
var MAP_SIZE = 15;  //★1+1+最大13 = 15

var MAP_UNDEFINED = 0;
var MAP_INITIALIZED = 1;
var MAP_MODIFIED = 2;

var M = 100;
var BX = 20, BY = 20;
var PW = 150, PR = 30;
var BW = 20;
var PP = 0.5;//←iOSでは0.1
var MENU_SPAN = 800, MENU_CENTER_Y = 640;

//●==========●==========●==========●==========●==========●==========●
//永続させるグローバル変数

var isAudio;
var question;
var map = new Int32Array( QUESTION_NUM * MAP_SIZE);

//●==========●==========●==========●==========●==========●==========●

var currentState, nextState, stateCount;

var menuX, menuVX, menuMag;

var focusedQuestion;

var myWorld;
var myTestBody, myTestPoint;
var mouseJoint = new Array( MAXTOUCH);

//●==========●==========●==========●==========●==========●==========●

function play( n){ if( isAudio) playAudio( n);}

//●==========●==========●==========●==========●==========●==========●

onload = function(){
  skeleton( document.getElementById( "canvas1"));

  resetMouseJoint();

  currentState = STATE_DEFAULT;
  nextState = STATE_LOADING_FIRST;

  setFPS( FPS);
};

//●==========●==========●==========●==========●==========●==========●

function main(){
  if( currentState != nextState){
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
  var i, j, p;
  var s;

  isAudio = localStorage.getItem( SP + "isAudio") == "true";
  question = parseInt( localStorage.getItem( SP + "question"));

  for( i = 0; i < QUESTION_NUM; i++){
    s = localStorage.getItem( SP + "m" + i);
    p = i * MAP_SIZE;
    map[ p] = parseInt( s.substr( 0, 1));
    if( map[ p] != MAP_UNDEFINED){
      map[ p + 1] = parseInt( s. substr( 2, 2));
      for( j = 0; j < map[ p + 1]; j++){
        map[ p + 2 + j] = parseInt( s.substr( 5 + j * 7, 6));
      }
    }
  }
}

function savePermanents(){
  var i, j, p;
  var s;

  try{
    localStorage.setItem( SP + "isAudio", isAudio);
    localStorage.setItem( SP + "question", question);

    for( i = 0; i < QUESTION_NUM; i++){
      p = i * MAP_SIZE;
      s = "" + map[ p];
      if( map[ p] !=MAP_UNDEFINED){
        s += " " + map[ p + 1]
        for( j = 0; j < map[ p + 1]; j++){
          s += " " + ( "00000" + map[ p + 2 + j].toString()).substr( -6);
        }
      }
      localStorage.setItem( SP + "m" + i, s);
    }
  } catch( e){};
}

//●==========●==========●==========●==========●==========●==========●

function resetMouseJoint(){
  var i;

  for( i = 0; i < MAXTOUCH; i++){
    touchID[ i] = NOID;
    touchX[ i] = NOWHERE;
    if( mouseJoint[ i] != null){
      myWorld.DestroyJoint( mouseJoint[ i]);
      mouseJoint[ i] = null;
    }
  }
}

//●==========●==========●==========●==========●==========●==========●

function processTouch(){
  var a, i;
  var t;

  var p = new b2Vec2();
  var aabb = new b2AABB();;

  for( i = 0; i < MAXTOUCH; i++) if( touchID[ i] != NOID){
    if( touchBegan[ i]){

      if( currentState == STATE_TITLE){
        if( 520 <= touchX[ i] && touchX[ i] < 600 && 740 <= touchY[ i] && touchY[ i] < 820){
          isAudio = !isAudio;
          play( kAudDecide);
        } else if(
          MENU_CENTER_Y * ( 1 - menuMag) <= touchY[ i] &&
          touchY[ i] < MENU_CENTER_Y * ( 1 - menuMag) + 920 * menuMag
        ){
          a = Math.floor( ( touchX[ i] - 320) / menuMag + 320 + menuX);
          if( -MENU_SPAN <= a && a % MENU_SPAN < 640){
            a = 1 + Math.floor( 1.0 * a / MENU_SPAN);
            if( a <= QUESTION_NUM) focusedQuestion = a;
          }
        }
      } else if( currentState == STATE_GAME){
        p.Set( touchBX[ i] / M, touchBY[ i] / M);
        aabb.lowerBound.Set( p.x - 0.1 / M, p.y - 0.1 / M);
        aabb.upperBound.Set( p.x + 0.1 / M, p.y + 0.1 / M);
        myTestBody = undefined;
        myTestPoint = p;
        myWorld.QueryAABB( TestQueryCallback, aabb);

        if( myTestBody){
          var mjd = new b2MouseJointDef();
          mjd.bodyA = myWorld.GetGroundBody();
          mjd.bodyB = myTestBody;
          mjd.target.Set( p.x, p.y);
          mjd.frequencyHz = 2.0;
          mjd.dampingRatio = 0;
          mjd.maxForce = 1000.0 * myTestBody.GetMass();
  
          mouseJoint[ i] = myWorld.CreateJoint( mjd);
          myTestBody.SetAwake( true);
          mouseJoint[ i].SetTarget( p);
        } else{
          if( 810 <= touchY[ i]){
            if( touchX[ i] < PW){
              play( kAudDecide);
              saveIntoMap( question);
              nextState = STATE_TITLE;
            } else if( REFW - PW <= touchX[ i]){
              play( kAudDecide);

              resetWorld();
              setBorder();

              setMap( question);
              loadFromMap( question);
              break;
            }
          }
        }
      }
    }

    if( inTouch[ i] &&  touchMX[ i] != NOWHERE){
      if( currentState == STATE_TITLE){
        t = touchX[ i] - touchBX[ i];
        if( t < -40 || 40 < t) focusedQuestion = -1;

        menuVX = ( touchMX[ i] - touchX[ i]) / menuMag;
        menuX += menuVX;
      } else if( currentState == STATE_GAME){
        if( mouseJoint[ i] != null){
          mouseJoint[ i].SetTarget( new b2Vec2( touchX[ i] / M, touchY[ i] / M));
        }
      }
    } else{
      if( currentState == STATE_TITLE){
        //if( !touchEnded[ i]) menuVX = 0;
      }
    }

    if( touchEnded[ i] || touchOut[ i]){
      if( currentState == STATE_TITLE){
        if( 1 <= focusedQuestion){
          play( kAudDecide);
          question = focusedQuestion;
          loadFromMap( question);
          nextState = STATE_GAME;
        } else if( focusedQuestion == 0){
          //★作者の『他の作品』アイコンがタッチされた。

          //★web 版の場合、無効を表現する音が出るだけ。
          play( kAudDecide);

          //★旧 Android へ組込む時
          //location.assign( 'market://search?q=www.mameson.com');
          //★新 Android へ組込む時
          //location.assign( 'http://play.google.com/store/apps/developer?id=www.mameson.com');

          //★iOS へ組込む時
          //location.assign( 'https://itunes.apple.com/jp/artist/akihiro-maeda/id298274003?mt=8');
        }
        focusedQuestion = -1;
      } else if( currentState == STATE_GAME){
        if( mouseJoint[ i] != null){
          myWorld.DestroyJoint( mouseJoint[ i]);
          mouseJoint[ i] = null;
        }
      }
    }
  }
}

//●==========●==========●==========●==========●==========●==========●

function processMain(){
  var i;
  var t, v;
  var s;

  function li( s){ return loadImage( "image/" + s + ".png");}
  function lp( s){ loadImage( "image/p_" + s + "_n.png"); loadImage( "image/p_" + s + "_s.png");}

  switch( currentState){

  case STATE_LOADING_FIRST:
    if( stateCount == 0){
      kImgLoading = li( "loading1");
      li( "loading2");
    }

    if( loadedCount == 2) nextState = STATE_LOADING_IMAGE;

    break;

  case STATE_LOADING_IMAGE:
    if( stateCount == 0){
      kImgBGTitle = li( "bg_title");
      kImgBGGame = li( "bg_game");
      kImgBorderS = li( "border_s");
      kImgHalfway = li( "halfway");
      kImgLetters = li( "letters");

      kImgPanel = kImgLetters + 1;
      for( i = 0; i < 4; i++) lp( [ "p", "s", "v", "h"][ i]);

      kImgAuthor = li( "author");
      kImgAudio = li( "audio");
    }

    if( loadedCount == IMAGENUM) nextState = STATE_LOADING_AUDIO;

    break;

  case STATE_LOADING_AUDIO:
    if( stateCount == 0){
      kAudDecide = loadAudio( "audio/decide.wav");
    }

    //if( loadedCount == IMAGENUM + AUDIONUM  && FPS <= stateCount && isAudioIOS){//★最初にタッチを要求する場合
    if( loadedCount == IMAGENUM + AUDIONUM && FPS <= stateCount){

      resetWorld();
      setBorder();

      question = undefined;
      if( "localStorage" in window){
        try{ s = localStorage.getItem( SP + "question");} catch( e){}
        if( s) question = parseInt( s);
      }
      //★この時点で、question は、undefined か NaN か正しい数値
      if( question){
        loadPermanents();
      } else{
        isAudio = true;
        question = 1;
        for( i = 0; i < QUESTION_NUM; i++) map[ i * MAP_SIZE] = MAP_UNDEFINED;
      }

      menuVX = 0.0;
      menuMag = 0.6;
      nextState = STATE_TITLE;
    }

    break;

  case STATE_TITLE:
    if( stateCount == 0){
      resetMouseJoint();
      resetWorld();
      setBorder();
      menuX = ( question - 1) * MENU_SPAN;
      menuVX = 0;
      focusedQuestion = -1;
      savePermanents();
    }

    if( !touching){
      //★タッチが無い時
      menuVX *= 0.9;
      if( -30 < menuVX && menuVX < 30){
        t = Math.floor( menuX / MENU_SPAN + 0.5) * MENU_SPAN;
        v = t - menuX;
        if( -2.0 < v && v < 2.0){ menuX = t; menuVX = 0;}
        else if( v < 0) menuVX -= 2.0;
        else menuVX += 2.0;
      }
      menuX += menuVX;
    }

    if( menuX < -1.5 * MENU_SPAN){ menuX = -1.5 * MENU_SPAN; menuVX = 0;}
    else if( ( QUESTION_NUM - 0.51) * MENU_SPAN <= menuX){
      menuX = ( QUESTION_NUM - 0.51) * MENU_SPAN; 
      menuVX = 0;
    }

    break;

  case STATE_GAME:
    if( stateCount == 0){
      resetMouseJoint();
    }

    myWorld.Step( 1.0 / FPS, 6, 2);
    break;
  }
}

function resetWorld(){
  resetMouseJoint();

  if( myWorld) myWorld = null;

  myWorld = new b2World( new b2Vec2( 0, 0), true);//★無重力、sleep許可
}

function setBorder(){
  var t;
  var b = new b2BodyDef;
  var o;
  var f = new b2FixtureDef;

  b.bullet = true;
  f.density = 0;
  f.friction = 0;
  f.restitution = 0;
  f.shape = new b2PolygonShape;

  f.shape.SetAsBox( ( 2 * PW - PP) / M, ( BW / 2 - PP) / M);
  b.position.Set( ( BX + 2 * PW) / M, ( BY - BW / 2) / M);//★上
  o = myWorld.CreateBody( b);
  o.CreateFixture( f);//第二パラメータは、密度。0だからSTATIC。
  o.SetType( b2Body.b2_staticBody);

  f.shape.SetAsBox( ( PW / 2 - PP) / M, ( BW / 2 - PP) / M);
  b.position.Set( ( BX + PW / 2) / M, ( BY + 5 * PW + BW / 2) / M);//★左下
  o = myWorld.CreateBody( b);
  o.CreateFixture( f);
  o.SetType( b2Body.b2_staticBody);
  b.position.Set( ( BX + 3.5 * PW) / M, ( BY + 5 * PW + BW / 2) / M);//★右下
  o = myWorld.CreateBody( b);
  o.CreateFixture( f);
  o.SetType( b2Body.b2_staticBody);

  f.shape.SetAsBox( ( BW / 2 - PP) / M, ( ( 2.5 * PW - PP) + BW) / M);
  b.position.Set( ( BX - BW / 2) / M, ( BY + 2.5 * PW) / M);//★左
  o = myWorld.CreateBody( b);
  o.CreateFixture( f);
  o.SetType( b2Body.b2_staticBody);
  b.position.Set( ( BX + 4 * PW + BW / 2) / M, ( BY + 2.5 * PW) / M);//★右
  o = myWorld.CreateBody( b);
  o.CreateFixture( f);
  o.SetType( b2Body.b2_staticBody);

  t = 1.4 * PW;
  f.shape.SetAsBox( ( BW / 2 - PP) / M, ( t / 2 - PP) / M);
  b.position.Set( ( BX + PW - BW / 2 - 0.5) / M, ( BY + 5 * PW + BW + t / 2) / M);//★出口の外の左
  o = myWorld.CreateBody( b);
  o.CreateFixture( f);
  o.SetType( b2Body.b2_staticBody);
  b.position.Set( ( BX + 3 * PW + BW / 2 + 0.5) / M, ( BY + 5 * PW + BW + t / 2) / M);//★出口の外の右
  o = myWorld.CreateBody( b);
  o.CreateFixture( f);
  o.SetType( b2Body.b2_staticBody);
  f.shape.SetAsBox( ( PW - PP) / M, ( BW / 2 - PP) / M);
  b.position.Set( ( BX + 2 * PW) / M, ( BY + 5 * PW + t + BW / 2) / M);//★出口の外の下
  o = myWorld.CreateBody( b);
  o.CreateFixture( f);
  o.SetType( b2Body.b2_staticBody);

  b.position.Set( ( BX + 2 * PW) / M, ( BY + 5 * PW + BW / 2) / M);//★出口
  o = myWorld.CreateBody( b);
  //f.shape = p;
  f.filter.groupIndex = -1;
  o.CreateFixture( f);
  o.SetType( b2Body.b2_staticBody);
}

function roundedBox( b, fd, w, h){
  fd.shape = new b2PolygonShape;

  if( 0.75 * PW < w && 0.75 * PW < h) fd.filter.groupIndex = -1; else fd.filter.groupIndex = 0;

  var v = new Array( 8);
  v[ 0] = new b2Vec2( ( -w + PR) / M, ( -h + 0) / M);
  v[ 7] = new b2Vec2( ( -w + 0) / M, ( -h + PR) / M);
  v[ 6] = new b2Vec2( ( -w + 0) / M, ( h - PR) / M);
  v[ 5] = new b2Vec2( ( -w + PR) / M, ( h + 0) / M);
  v[ 4] = new b2Vec2( ( w - PR) / M, ( h + 0) / M);
  v[ 3] = new b2Vec2( ( w + 0) / M, ( h - PR) / M);
  v[ 2] = new b2Vec2( ( w + 0) / M, ( -h + PR) / M);
  v[ 1] = new b2Vec2( ( w - PR) / M, ( -h + 0) / M);

  fd.shape.SetAsArray( v, 8);
  b.CreateFixture( fd);
}

function setMap( q){
  var s = [
    //★1 : 01s楽 22h苦 → 01s 03h
    //"100022 122221 132221 000111 010111 020111 030111 040111 300111 310111 320111 330111 340111",
    "100022 120321 130321 000111 010111 020111 030111 040111 300111 310111 320111 330111 340111",

    //↓テスト用。すぐクリアできる。
    //"120022 102221 112221 000111 010111 020111 030111 040111 300111 310111 320111 330111 340111",

    //★2 : 02s食 23h欲 → 01s 03h
    //"100022 022321 222321 032321 232321 000211 010211 040211 300211 310211 340211",
    "100022 020321 220321 030321 230321 000111 010111 040111 300111 310111 340111",

    //★3 : 03s金 09v遊び → 01s 02v
    //"100022 120912 220912 000311 010311 020311 030311 040311 300311 310311 320311 330311 340311",
    "100022 120212 220212 000111 010111 020111 030111 040111 300111 310111 320111 330111 340111",

    //★4 : 10v喜 11v怒 12v哀 13v楽 04s謎 → 02v 01s
    //"100022 001012 301212 021112 321312 040411 120411 130411 220411 230411 340411",
    "100022 000212 300212 020212 320212 040111 120111 130111 220111 230111 340111",

    //★5 : 14v敵 24h敵 05s友 → 02v 03h 01s
    //"100022 001412 301412 132421 040511 030511 020511 120511 220511 320511 330511 340511",
    "100022 000212 300212 130321 040111 030111 020111 120111 220111 320111 330111 340111",

    //★6 : 15v笑 25h涙 06s愛 → 02v 03h 01s
    //"100022 001512 301512 022521 222521 040611 030611 130611 230611 330611 340611",
    "100022 000212 300212 020321 220321 040111 030111 130111 230111 330111 340111",

    //★7 : 16v嘘 26h幻 07s秘 → 02v 03h 01s
    //"100022 001612 022621 222621 300711 310711 040711 030711 130711 230711 330711 340711",
    "100022 000212 020321 220321 300111 310111 040111 030111 130111 230111 330111 340111",

    //★8 : 17v母親 18v父親 19v下女 20v下男 27h番頭 08s小僧 → 02v 03h 01s
    //"100022 001712 301812 021912 322012 122721 040811 130811 230811 340811",
    "100022 000212 300212 020212 320212 120321 040111 130111 230111 340111",

    //★9 : 17v母親 18v父親 21v祖母 27h番頭 08s小僧 → 02v 03h 01s
    //"100022 011712 311812 222112 042721 242721 000811 030811 300811 330811",
    "100022 010212 310212 220212 040321 240321 000111 030111 300111 330111",

    //★10 : 17v母親 18v父親 28h長男 29h次男 30h三男 08s小僧 → 02v 03h 01s
    //"100022 001712 301812 022821 222921 133021 030811 040811 330811 340811"
    "100022 000212 300212 020321 220321 130321 030111 040111 330111 340111"
  ];
  var d, i;

  d = ( q - 1) * MAP_SIZE;
  map[ d] = MAP_INITIALIZED;
  map[ d + 1] = Math.ceil( s[ q - 1].length / 7.0);
  for( i = 0; i < map[ d + 1]; i++){
    map[ d + 2 + i] = parseInt( s[ q - 1].substring( i * 7, i * 7 + 6));
  }
}

function saveIntoMap( q){
  var a, c, d;
  var f;
  var b;
  var p;

  f = false;
  d = ( q - 1) * MAP_SIZE;
  for( b = myWorld.GetBodyList(); b != null; b = b.GetNext()){
    if( b.GetUserData() != null){
      a = parseInt( b.GetUserData());
      if( 0 < a){
        p = b.GetPosition();
        c = (
          Math.floor( ( p.x * M - ( Math.floor( a / 10) % 10 / 2.0 - 0.5) * PW - BX) / PW) * 10 +
          Math.floor( ( p.y * M - ( a % 10 / 2.0 - 0.5) * PW - BY) / PW)
        ) * 10000 + a % 10000;
        if( map[ d + 2 + Math.floor( a / 1000000)] != c){
          map[ d + 2 + Math.floor( a / 1000000)] = c;
          f = true;
        }
      }
    }
  }
  if( f) map[ d] = MAP_MODIFIED;
}

function loadFromMap( q){
  var a, d, i;
  var w, h;

  var b;
  var bd = new b2BodyDef;
  var fd = new b2FixtureDef;

  fd.density = 0.01;
  fd.friction = 0;
  fd.restitution = 0;

  d = ( q - 1) * MAP_SIZE;
  for( i = 0; i < map[ d + 1]; i++){
    a = map[ d + 2 + i];
    w = Math.floor( Math.floor( a / 10) % 10 * PW / 2);
    h = Math.floor( a % 10 * PW / 2);
    bd.position.Set(
      ( BX + Math.floor( a / 100000) % 10 * PW + w) / M,
      ( BY + Math.floor( a / 10000) % 10 * PW + h) / M
    );
    bd.bullet = true;
    b = myWorld.CreateBody( bd);
    roundedBox( b, fd, w - PP, h - PP);
    b.SetUserData( i * 1000000 + a);
    b.SetType( b2Body.b2_dynamicBody);
  }
}

//●==========●==========●==========●==========●==========●==========●

function drawStringPP( x, y, s, m, c){
  var a, d, i;

  d = 0;
  for( i = 0; i < s.length; i++){
    a = s.charCodeAt( i) - 32;
    drawTintedImagePartiallyScaled(
      kImgLetters,
      x + d, y - 64 * m / 4.0,
      a % 16 * 64, Math.floor( a / 16) * 100,
      64, 96,
      m / 4.0,
      c
    );
    if( " ,il".indexOf( s.charAt( i)) < 0) d += 64 * m / 4.0; else d += 32 * m / 4.0;
  }
}

function drawMouseJoint(){
  var i;
  var p;
  var g;

  ctx.strokeStyle = "#b04ce7";
  ctx.lineWidth = 5;

  for( i = 0; i < MAXTOUCH; i++) if( touchID[ i] != NOID){
    if( mouseJoint[ i]){
      ctx.beginPath();
      p = mouseJoint[ i].GetTarget();
      ctx.moveTo( M * p.x, M * p.y);
      p = mouseJoint[ i].GetAnchorB();
      ctx.lineTo( M * p.x, M * p.y);
      ctx.stroke();
    }
  }
}

function getAngle( vx, vy){
  var a;

  if( vx == 0) if( vy > 0) return Math.PI; else return 0;
  a = Math.acos( -vy / Math.sqrt( vx * vx + vy * vy));
  if( vx > 0) return a; else return 2 * Math.PI - a;
}

function drawPanda( x, y, r, e1, e2, mouth, m){
  var y1, y2;
  var vx, xL, xR;
  var vy, yL, yR;

  vx = Math.sin( r);
  vy = -Math.cos( r);
  xL = -9 * vx + 37 * vy;
  yL = -9 * vy - 37 * vx;
  xR = -9 * vx - 37 * vy;
  yR = -9 * vy + 37 * vx;

  ctx.save();
  ctx.translate( x, y);
  ctx.scale( m, m);
/*
  //●耳
  ctx.globalAlpha = 1;
  ctx.fillStyle = "#000000";
  fillCircle( 70 * vx + 80 * vy, 70 * vy - 80 * vx, 35);
  fillCircle( 70 * vx - 80 * vy, 70 * vy + 80 * vx, 35);

  //●顔
  fillCircle( 0, 0, 100);
  ctx.fillStyle = "#ffffff";
  fillCircle( 0, 0, 90);

  //●鼻
  ctx.fillStyle = "#000000";
  fillCircle( -55 * vx, -55 * vy, 11);

  //●目のまわり
  fillCircle( xL - 5 * vx + 10 * vy, yL - 5 * vy - 10 * vx, 38);
  fillCircle( xR - 5 * vx - 10 * vy, yR - 5 * vy + 10 * vx, 38);
  fillCircle( xL, yL, 40);
  fillCircle( xR, yR, 40);

  //●白目
  ctx.fillStyle = "#ffffff";
  fillCircle( xL, yL, 32);
  fillCircle( xR, yR, 32);
*/
  //●黒目
  ctx.fillStyle = "#000000";
  if( 0 <= e1){
    xL += Math.sin( e1) * 16;
    yL -= Math.cos( e1) * 16;
    xR += Math.sin( e2) * 16;
    yR -= Math.cos( e2) * 16;
  }
  fillCircle( xL, yL, 23);
  fillCircle( xR, yR, 23);

  y1 = 60 + mouth * 30;
  y2 = 80 - mouth * 10;

  ctx.strokeStyle = "#000000";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo( -20, y2);
  ctx.lineTo( 0, y1);
  ctx.lineTo( 20, y2);
  ctx.stroke();

  ctx.restore();
}

function drawMenu( q, x0, y0){
  var a, d, i, j, n;
  var x, y, w, h, r;
  var f;

  var g;

  if( 1 <= q){
    d = ( q - 1) * MAP_SIZE;
    f = Math.floor( map[ d + 2] / 10000) % 10 == 4;//★クリアしていたらtrue

    ctx.save();
    ctx.translate( x0, y0);

   drawImage( kImgBorderS, 0, -56);

    if( map[ d] == MAP_UNDEFINED) setMap( q);

    for( i = 0; i < map[ d + 1]; i++){
      a = map[ d + 2 + i];
      x = BX + Math.floor( a / 100000) % 10 * PW + PP + 0.5;
      y = BY + Math.floor( a / 10000) % 10 * PW + PP + 0.5;
      w = Math.floor( a / 10) % 10 * PW - 2 * PP - 1;
      h = a % 10 * PW - 2 * PP - 1;
      r = PR;
      x *= menuMag; y *= menuMag; w *= menuMag; h *= menuMag; r *= menuMag;

      a = Math.floor( a / 100) % 100;

      drawImageCenteredScaled( kImgPanel + 2 * a, x + w / 2, y + h / 2, menuMag);
    }

    ctx.globalAlpha = 1;
    drawStringPP( 280, -18, "" + q, 2.6, 0xaa88bb);

    ctx.restore();

    for( i = 0; i < map[ d + 1]; i++){
      a = map[ d + 2 + i];

      if( a % 100 == 22){
        x = BX + ( Math.floor( a / 100000) % 10 + 1) * PW + PP + 0.5;
        y = BY + ( Math.floor( a / 10000) % 10 + 1) * PW + PP + 0.5;
        x = x0 + menuMag * x;
        y = y0 + menuMag * y;

        if( f) a = 1; else a = 0;

        n = -1; for( j = 0; j < MAXTOUCH; j++) if( touchID[ j] != NOID){ n = j; break;}

        ctx.save();
        ctx.translate( x, y);
        ctx.scale( menuMag, menuMag);

        if( 0 <= n){
          drawPanda(
            0, 0, 0,
            getAngle( touchX[ n] - ( x - 8), touchY[ n] - y),
            getAngle( touchX[ n] - ( x + 8), touchY[ n] - y),
            a, 1.0
          );
        } else drawPanda( 0, 0, 0, -1, -1, a, 1.0);

        if( f){ ctx.translate( 0, -60); drawCrown( 0, 0);}

        ctx.restore();
      }
    }

    if( !f && map[ d] == MAP_MODIFIED){
      drawImageCentered( kImgHalfway, x0 + 2 * PW * menuMag, y0 + 2.5 * PW * menuMag);
    }

    if( q == focusedQuestion){
      ctx.save();
      ctx.translate( x0, y0);
      ctx.scale( menuMag, menuMag);
      ctx.fillStyle = "#ffff00";
      ctx.globalAlpha = 0.5;
      fillRoundRect( -BW, -BW, 640 + 2 * BW, 920 + 2 * BW, 2 * BW);
      ctx.restore();
    }
  } else{
    if( 0 <= menuX) x = 0.5; else x =  0.5 + 0.5 * -menuX / MENU_SPAN;

    ctx.save();
    ctx.translate( x0, y0);
    ctx.scale( menuMag, menuMag);
    ctx.fillStyle = "#ffffff";
    ctx.globalAlpha = 0.85;
    fillRoundRect( 320 - 640 * x, 360 - 800 * x, 1280 * x, 1600 * x, BW);
    ctx.restore();

    drawImageCenteredScaled(
      kImgAuthor,
      x0 + 320 * menuMag,
      y0 + 360 * menuMag,
      1.75 * x * menuMag
    );

    if( q == focusedQuestion){
      ctx.save();
      ctx.translate( x0, y0);
      ctx.scale( menuMag, menuMag);
      ctx.fillStyle = "#ffff00";
      ctx.globalAlpha = 0.5;
      fillRoundRect( 320 - 640 * x, 360 - 800 * x, 1280 * x, 1600 * x, BW);
      ctx.restore();
    }
  }
}

function drawCrown(){
  var i;
  var t, m;

  m = 1.0 + 0.1 * Math.sin( stateCount % 12 * 2 * Math.PI / 12);

  ctx.beginPath();
  ctx.globalAlpha = 0.7;
  ctx.fillStyle = "#d9a719";

  ctx.moveTo( -0.9 * m * 75, 0);

  for( i = 0; i < 9; i++){
    t = 2 * Math.PI * ( i - 4) / 30.0;
    ctx.lineTo(
      ( i - 4) * 13 + ( 120 - i % 2 * 70) * m * Math.sin( t),
      0.3 * 75 - ( 250 - i % 2 * 80) * m * Math.cos( t)
    );
  }

  ctx.lineTo( 0.9 * m * 75, 0);

  ctx.fill();

  drawStringPP( -90, -50, "Clear!", 2.2, 0xffffcc);
}

//●==========●==========●==========●==========●==========●==========●

function drawMain(){
  var a, i, n, q, z;
  var f;
  var t, u;
  var x, y, w, h;

  var b;
  var v;

  switch( currentState){

  case STATE_LOADING_FIRST:
    ctx.fillStyle = "#999999";
    ctx.fillRect( 0, 0, REFW, REFH);
    break;

  case STATE_LOADING_IMAGE: case STATE_LOADING_AUDIO:
    ctx.fillStyle = "#cccccc";
    ctx.fillRect( 0, 0, REFW, REFH);

    //drawImage( kImgLoading, 0, 0);
    //if( stateCount % 4 < 2) drawImage( kImgLoading + 1, 144, 190);
    //else drawImageMirrored( kImgLoading + 1, 144, 190);

    t = loadedCount / ( IMAGENUM + AUDIONUM);

    if( currentState == STATE_LOADING_IMAGE){
      u = 0.7 * stateCount / FPS;
      if( 0.7 < u) u = 0.7;
    } else{
      u = 0.7 + 0.3 * stateCount / FPS;
      if( 1 < u) u = 1;
    }

    if( t * u < 1){
      //★プログレスバー
      ctx.fillStyle = "#000000";
      ctx.fillRect( 0.15 * REFW, 0.9 * REFH, t * u * 0.7 * REFW, 0.02 * REFH);
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 2;
      ctx.strokeRect( 0.15 * REFW, 0.9 * REFH, 0.7 * REFW, 0.02 * REFH);
    } else{
      //★ロード完了、ワンタッチ待ち
      if( stateCount % 6 < 4){
        drawStringPP( 0.5 * REFW - 60, 0.89 * REFH, "GO !!", 2, 0x000000);
      }
    }

    break;

  case STATE_TITLE:
    drawImage( kImgBGTitle, 0, 0);

    x = 520; y = 740;
    if( isAudio){
      drawTintedImagePartially( kImgAudio, x, y, 0, 80, 80, 80, 0xb0cccc);
      drawTintedImagePartially(
        kImgAudio,
        x, y - 8.0 * Math.sin( stateCount % 12 * Math.PI / 12),
        0, 160, 80, 80, 0xb0cccc
      );
    } else drawTintedImagePartially( kImgAudio, x, y, 0, 0, 80, 80, 0xb0cccc);

    q = Math.floor( 1.5 + menuX / MENU_SPAN);
    x = 0.5 * REFW * ( 1 - menuMag) + menuMag * ( ( q - 1) * MENU_SPAN - menuX);
    y = MENU_CENTER_Y * ( 1 - menuMag);
    if( 0 < q) drawMenu( q - 1, x - menuMag * MENU_SPAN, y);//★左
    if( q < QUESTION_NUM) drawMenu( q + 1, x + menuMag * MENU_SPAN, y);//★右
    drawMenu( q, x, y);//★中央

    break;

  case STATE_GAME:
    drawImage( kImgBGGame, 0, 0);

    f = false;
    for( b = myWorld.GetBodyList(); b != null; b = b.GetNext()){
      v = b.GetLinearVelocity();
      v.x *= 0.8;
      v.y *= 0.8;
      b.SetLinearVelocity( v);
      if( b.GetUserData() != null) a = parseInt( b.GetUserData()); else a = 0;
      if( 0 < a){
        b.SetAngularVelocity( -b.GetAngle() * 50);
        x = M * b.GetPosition().x;
        y = M * b.GetPosition().y;

        w = Math.floor( a / 10) % 10 * PW / 2 - PP;
        h = a % 10 * PW / 2 - PP;
        ctx.globalAlpha = 1;
        a = Math.floor( a / 100) % 100;
        n = kImgPanel + 2 * a;
        if( b.IsAwake()) n++;

        ctx.save();
        ctx.translate( x, y);
        ctx.rotate( b.GetAngle());

        drawImageCentered( n, 0, 0);

        if( a == 0){
          if( BY + 4.5 * PW <= y) f = true;

          if( f) z = 1; else z = 0;

          n = -1; for( i = 0; i < MAXTOUCH; i++) if( touchID[ i] != NOID){ n = i; break;}

          if( 0 <= n){
            drawPanda(
              0, 0, 0,
              getAngle( touchX[ n] - ( x - 16), touchY[ n] - y),
              getAngle( touchX[ n] - ( x + 16), touchY[ n] - y),
              z, 1.0
            );
          } else drawPanda( 0, 0, 0, -1, -1, z, 1.0);

          if( f){ ctx.translate( 0, -60); drawCrown( 0, 0);}
        }

        ctx.restore();
      }
    }

    drawMouseJoint();

    break;
  }
/*
//★デバグ用表示
ctx.fillStyle = "rgba( 0, 0, 0, 0.3)";
ctx.fillRect( 0, REFH - 30, REFW, 30);
ctx.fillStyle = "#ffffff";
ctx.font = "18pt 'Arial'";
ctx.fillText( "loaded:"+loadedCount+" cs:"+currentState+" sc:"+stateCount, 5, REFH - 5);
*/
/*
ctx.globalAlpha = 1;
for(i=0;i<MAXTOUCH;i++){
if(touchID[i]!= NOID){ctx.fillStyle="#666666";ctx.fillRect(touchX[i]-5,touchY[i]-5,10,10);}
}
*/
}

//========== ========== ========== ========== ========== ========== ==========

function TestQueryCallback( fixture){
  if( fixture.GetBody().GetType() != b2Body.b2_staticBody){
    if( fixture.GetShape().TestPoint( fixture.GetBody().GetTransform(), myTestPoint)){
      myTestBody = fixture.GetBody();
      return false;
    }
    return true;
  }
}
