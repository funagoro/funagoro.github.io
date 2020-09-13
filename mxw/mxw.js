
window.acc_from_swift = function( x, y){
	handle_acc_proc( parseFloat( x), parseFloat( y));
}

var skt;
var skc;
var ska;

var BUILD_BROWSER = 0, BUILD_IOS = 1, BUILD_ANDROID = 2;
var build = BUILD_BROWSER;
//var build = BUILD_IOS;
//var build = BUILD_ANDROID;

//◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍

var SP = "mxw_"; //★ これを付けないと、別のアプリのデータと混ざってしまう。

var FPS = 24;

//◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍
//★ skeleton_3.js から参照されるもの

var REFW = 600, REFH = 800;
var MAXWIDTH = 600;
var mypadding = 30;
var myorientation = 0;

var MAXTOUCH = 5;
var CAN_PINCH = false;

var IMAGENUM = 12;
var AUDIONUM = 12;

//var DPR = window.devicePixelRatio; //★retina 対応。2017年時点のマシンには負担が大きすぎ。
var DPR = 1;

function touch_event_hook(){
	if( init_count == 2){
		if( skt.num == 1 && skt.x == skt.bx && skt.y == skt.by){
			ska.start_ios();
			init_acc();
			init_count++;
		}
	}
}

//◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍

var ua = navigator.userAgent;

var is_acc = false;
var acc_x = acc_y = 0;

function init_acc(){
	if( build == BUILD_IOS){
		//★ iOS ネイティブでは、Swift からどんどん window.acc_from_swift() を
		//★ 呼んでもらうので、リスナはいらない。
		is_acc = true;
		return;
	}

	if( 0 <= ua.indexOf( "Android")){
		//★ Android は、ブラウザでもネイティブでも、
		//★ パーミッションなしでイベントリスナを登録できる。
		addEventListener( "devicemotion", handle_acc, false);
		is_acc = true;
		return;
	}

	//★ パソコンのブラウザか、iOS のブラウザの場合。
	if( window.DeviceMotionEvent && typeof DeviceMotionEvent.requestPermission === "function"){
		//★ iOS 13 以上のブラウザの場合。
		DeviceMotionEvent.requestPermission().then( permissionState => {
			if( permissionState === "granted"){
				//★ ダイアログで、プレイヤーの許可が得られた時。
				addEventListener( "devicemotion", handle_acc, false);
				is_acc = true;
			} else {
				//★ ダイアログで、プレイヤーから拒否された場合。
				//★ または https じゃなく http で配信している場合、ダイアログなしでここに来る。
				is_acc = false;
			}
		}).catch();
	} else{
		//★ パソコンのブラウザか、iOS 13 未満のブラウザの場合。
		is_acc = (
			0 <= ua.indexOf( "iPhone") ||
			0 <= ua.indexOf( "iPod") ||
			0 <= ua.indexOf( "iPad")
		);
		if( is_acc) addEventListener( "devicemotion", handle_acc, false);
	}
}

function handle_acc( e){
	handle_acc_proc(
		e.accelerationIncludingGravity.x,
		e.accelerationIncludingGravity.y
	);
}

function handle_acc_proc( v, w){
	var n;
	var x, y;

	if( window.orientation != undefined){//★値が 0 の場合、判定が false 扱いになるので注意。
		//★iOS、Android、Windows スマホは、これ。
		n = window.orientation;
	} else if(
		screen.orientation &&
		( 0 <= ua.indexOf( "Chrome") && ua.indexOf( "Edge") < 0)
	){
		//★Chrome であって、ニセの Chrome (Edge のこと) ではない。
		//★Windows タブレットの Chrome は、これ。
		n = screen.orientation.angle;
	} else return;//★端末の向きを特定できなかった (またはデスクトップ機である) ので、加速度を使用しない。

	switch( ( n + myorientation + 360) % 360){
		case 0: x = v; y = -w; break;
		case 90: x = -w; y = -v; break;
		case 180: x = -v; y = w; break;
		case 270: x = w; y = v; break;
		default: x = y = 0; break;
	}

	if(
		//★Edge の ua には、何でもかんでも入ってるから注意。
		//★↓Android であって、ニセの Android (Edge のこと) ではない。
		( 0 <= ua.indexOf( "Android") && ua.indexOf( "Edge") < 0) ||

		//★↓Windows であって、Edge 以外である。
		( 0 <= ua.indexOf( "Windows") && ua.indexOf( "Edge") < 0)
	){
		x *= -1.0;
		y *= -1.0;
	}

	acc_x = 0.9 * acc_x + 0.1 * x;
	acc_y = 0.9 * acc_y + 0.1 * y;
}

//◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍

var k_img_loading;
var k_img_bg_title, k_img_bg_game;
var k_img_game_over;
var k_img_explosion, k_img_numbers;
var k_img_button_author, k_img_button_policy, k_img_audio;
var k_img_dialogue;

var k_aud_decide;
var k_aud_money; //★11個

var audioBase64 = new Array( AUDIONUM);

//◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍

var ANIMUNIT = 3; //★ ←大きくするとモクモクのアニメーションを遅くできる。
var PI = Math.PI;

function onMyorientation(){ myorientation = ( myorientation + 90) % 360;}

var STATE_DEFAULT = 0, STATE_LOADING = 1;
var STATE_TITLE = 2, STATE_GAME = 3, STATE_GAME_OVER = 4;

var PX = 20, PY = 220, PW = 140, PH = 140;
var MW = 4, MH = 4, MHW = MH * MW;
var MAX_LEVEL = 12;

//◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍

var con;
var cam;
var CAMZ = 1490;
var light = new Array( 2);

var scene;
var ren;

var k_mesh_money = 0;
var k_mesh_transparent = k_mesh_money + MAX_LEVEL * MHW;
var k_mesh_board = k_mesh_transparent + 6;

var MODELNUM = 16;
var modelString = new Array( MODELNUM);
var mesh = new Array( MAX_LEVEL * MHW + 6 + 1);
var loaded_model_num;

//◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍
//永続させるグローバル変数

var is_audio;

var map = new Array( MHW);
var counter_map = new Array( MHW);
var emotion_map = new Array( MHW);
var rock_map = new Array( MHW);

//◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍

var EMOTION_NORMAL = 0;
var EMOTION_SLIP = 1;
var EMOTION_APPEAR = 2;
var VP = [ -MW, 1, MW, -1];
var VX = [ 0, 1, 0, -1];
var VY = [ -1, 0, 1, 0];

//◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍

var init_count;

var current_state, next_state, state_count;

var is_policy;
var is_dialogue;

var is_slipping;
var slip_num;
var direction, lead;

var MAXSCORE = 999999999;
var my_score, display_score;
var hiscores = new Array( 5);

var MAX_SMOKE_NUM = MHW;
var smoke_n = new Array( MAX_SMOKE_NUM);
var smoke_x = new Array( MAX_SMOKE_NUM);
var smoke_y = new Array( MAX_SMOKE_NUM);

//◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍

function play_audio( n){ if( is_audio) ska.play( n);}

//◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍

function my_start(){
	var c;

	//console.log( (254).toString( 16));
	//console.log( parseInt( "0x" + "fe"));

	if( build == BUILD_IOS){
		MAXWIDTH = -1;
		if( 0 < navigator.userAgent.indexOf( "iPhone")){ myorientation = 0; mypadding = 10;}
	} else if( build == BUILD_ANDROID){
		MAXWIDTH = -1;
		mypadding = 10;
	}

	c = document.getElementById( "canvas1");
	skeleton();
	skt = new skeleton_touch( c);
	skc = new skeleton_canvas( c);
	ska = new skeleton_audio();

	con = document.getElementById( "div1");
	cam = new THREE.PerspectiveCamera( 30, REFW / REFH, 1, 5000);

	scene = new THREE.Scene();

	ren = new THREE.WebGLRenderer( { antialias: true, alpha: true});
	ren.setClearColor( 0xfffcf8, 0);
	//ren.setClearAlpha( 0.5);
	//ren.setClearColorHex( 0xfffcf8, 0.7);

	scene.add( new THREE.AmbientLight( 0x666666));
	//scene.add( new THREE.AmbientLight( 0xcccccc));

	var x, y, z;
	var p;

	x = 0.5 * REFW;
	y = 0.5 * REFH;
	z = 0;

	light[ 0] = new THREE.PointLight( 0xffffff);
	light[ 0] = new THREE.PointLight( 0x000000);
	light[ 0].castShadow = false;
	light[ 0].position.set( x + 400, y - 50, z + 100);
	//scene.add( light[ 0]);

	light[ 1] = new THREE.PointLight( 0xffffff );
	light[ 1].castShadow = false;
	light[ 1].position.set( x - 400, y - 50, z + 100);
	scene.add( light[ 1]);

	p = new THREE.PointLight( 0xffffff );
	p.castShadow = false;
	p.position.set( x + 0, y + 500, z + 100);
	scene.add( p);

	p = new THREE.HemisphereLight( 0xffeedd, 0x99bbcc, 0.3);
	p.position.set( 0, 10, 8);
	//scene.add( p);

	ren.setPixelRatio( window.devicePixelRatio);
	ren.setSize( REFW, REFH);
	ren.shadowMap.enabled = true;
	con.appendChild( ren.domElement);

	ren.gammaInput = false;
	ren.gammaOutput = false;

	//window.addEventListener( 'resize', onWindowResize, false);

	init_count = 0;
	current_state = STATE_DEFAULT;
	next_state = STATE_LOADING;

	set_fps( FPS);
}

//◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍

function main(){
	var w, h;

	if( current_state != next_state){
		current_state = next_state;
		state_count = 0;
		skt.reset();
	}

	skt.pre();
	skc.pre();

	if( STATE_TITLE <= current_state) process_touch();

	process_main();

	draw_main();

	skc.post();
	skt.post();

	if( current_mag != latest_mag || myorientation != latest_myorientation){
		skt.set_mag_and_orientation( current_mag, myorientation);
		skc.set_mag_and_orientation( current_mag, myorientation);

		w = skc.can.width;
		h = skc.can.height;

		//document.getElementById( "div2").style.width = "" + w + "px";
		//document.getElementById( "div2").style.height = "" + h + "px";

		con.style.width = "" + w + "px";
		con.style.height = "" + h + "px";

		ren.setSize( w, h);

		if( myorientation % 180) cam.zoom = REFH / REFW; else cam.zoom = 1;

		cam.aspect = w / h;
		cam.updateProjectionMatrix();

		cam.position.set( 0.5 * REFW, 0.5 * REFH, CAMZ);
		cam.lookAt( new THREE.Vector3( 0.5 * REFW, 0.5 * REFH, 0));
		cam.rotation.z += myorientation * 2 * PI / 360;
	}

	ren.toneMappingExposure = 1.0;

	ren.render( scene, cam);

	//★一年間でカンスト。
	if( state_count < 365 * 24 * 60 * 60 * FPS) state_count++;
}

//◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍

function load_permanents(){
	var i;
	var s;

	my_score = parseInt( localStorage.getItem( SP + "my_score"));
	for( i = 0; i < 5; i++) hiscores[ i] = parseInt( localStorage.getItem( SP + "hs" + i));
	is_audio = localStorage.getItem( SP + "is_audio") == "true";

	s = localStorage.getItem( SP + "map");
	for( i = 0; i < MHW; i++) map[ i] = parseInt( "0x" + s.substr( i, 1));
}

function save_permanents(){
	var i;
	var s;

	s = "";
	for( i = 0; i < MHW; i++) s += map[ i].toString( 16);

	try{
		localStorage.setItem( SP + "my_score", my_score);
		for( i = 0; i < 5; i++) localStorage.setItem( SP + "hs" + i, hiscores[ i]);
		localStorage.setItem( SP + "is_audio", is_audio);
		localStorage.setItem( SP + "map", s);
	} catch( e){};
}

//◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍

function process_touch(){
  var d, i;
  var x, y;
  var f;

  for( i = 0; i < MAXTOUCH; i++) if( skt.ids[ i] != skt.NOID){
    x = skt.xs[ i];
    y = skt.ys[ i];

    if( skt.starts[ i]){

      switch( current_state){

      case STATE_TITLE:
        if( is_policy){
          play_audio( k_aud_decide);
          is_policy = false;
          if( 135 <= x && x < 135 + 350 && 35 + 400 <= y && y < 35 + 400 + 60){
            location.assign( 'https://policies.google.com/technologies/ads');
          }
        } else if( 0 <= y && y < 100){
          if( build != BUILD_BROWSER && 0 <= x && x < 100){
            //★作者ボタンがタッチされた。
            play_audio( k_aud_decide);
            if( build == BUILD_IOS){
              //★iOS
              //location.assign( 'https://itunes.apple.com/jp/artist/akihiro-maeda/id298274003?mt=8');
              webkit.messageHandlers.appstore.postMessage( 0);
            } else if( build == BUILD_ANDROID){
              //★Android
              //location.assign( 'http://play.google.com/store/apps/developer?id=www.mameson.com');
              myAndroid.myGooglePlay();
            }
          } else if( REFW - 100 <= x && x < REFW){
            //★音 ON / OFF ボタンがタッチされた。
            is_audio = !is_audio;
            play_audio( k_aud_decide);
          } else if( build == BUILD_ANDROID && 105 <= x && x < 105 + 60){
            //★プライバシーポリシーボタンがタッチされた。
            play_audio( k_aud_decide);
            is_policy = true;
          }
        } else{
          //★それ以外の場所がタッチされたらゲームスタート。
          play_audio( k_aud_decide);
          next_state = STATE_GAME;
        }
        break;

      case STATE_GAME:
        if( is_dialogue){
          if( 10 + 100 <= y && y < 10 + 100 + 120){
            if( 10 + 30 <= x && x < 10 + 30 + 280){
              play_audio( k_aud_decide);
              if( x < 10 + 30 + 140){
                next_state = STATE_GAME_OVER;
              } else{
                is_dialogue = false;
              }
            }
          }
        } else{
          if( !is_slipping){
            if( y < 100 && x < 100){
              play_audio( k_aud_decide);
              is_dialogue = true;
            }
          }
        }
        break;

      case STATE_GAME_OVER:
        if( FPS <= state_count){
          play_audio( k_aud_decide);
          next_state = STATE_TITLE;
        }
        break;
      }
    }

    if( skt.ons[ i]){
      switch( current_state){

      case STATE_TITLE:
        //a
        break;

      case STATE_GAME:
        if( !is_slipping && !is_dialogue){
          appear_now();

          x = skt.xs[ i] - skt.bxs[ i];
          y = skt.ys[ i] - skt.bys[ i];

          if( x == 0 && y == 0) d = -1;
          else if( x * x < y * y) if( y < 0) d = 0; else d = 2;
          else if( x < 0) d = 3; else d = 1;

          if( d != direction) set_direction( d);

          lead = Math.sqrt( x * x + y * y);
          if( PW < lead) lead = PW;
          if( PH < lead) lead = PH;

          if( d % 2) f = ( 0.3 * PW < lead);
          else f = ( 0.3 * PH < lead);

          if( f && 0 < slip_num){
            is_slipping = true;
            skt.ids[ i] = skt.NOID;
            skt.ends[ i] = skt.outs[ i] = false;
          }
        }

        break;

      case STATE_GAME_OVER:
        break;
      }
    }

    if( skt.ends[ i] || skt.outs[ i]){
      switch( current_state){

      case STATE_TITLE:
        //a
        break;

      case STATE_GAME:
        if( !is_slipping && !is_dialogue){
          for( i = 0; i < MHW; i++) if( 0 < map[ i]){
            emotion_map[ i] = EMOTION_NORMAL;
          }
        }
        break;

      case STATE_GAME_OVER:
        break;
      }
    }

    break; //★ ひとつめのタッチだけで抜ける。
  }
}

function set_direction( d){
  var a, i, p, q, vq;
  var f;

  direction = d;

  slip_num = 0;

  if( d == 0 || d == 3){ q = 0; vq = 1;} else { q = MHW - 1; vq = -1;}

  for( i = 0; i < MHW; i++, q+= vq) if( 0 < map[ q]){
    if( d < 0) a = EMOTION_NORMAL;
    else{
      p = q + VP[ d];

      if( d % 2) f = ( Math.floor( q / MW) == Math.floor( p / MW));
      else f = ( 0 <= p && p < MHW);

      if( f && ( map[ p] == 0 || map[ p] == map[ q] || emotion_map[ p] == EMOTION_SLIP)){
        a = EMOTION_SLIP;
        slip_num++;
      } else{
        a = EMOTION_NORMAL;
      }
    }
    if( emotion_map[ q] != EMOTION_APPEAR) emotion_map[ q] = a;
  }
}

//◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍

function process_main(){
  var a, i, j, n, p, p2, q, vq;
  var t, x, y, z;
  var f;
  var m;

  function li( s){ return skc.load( "image/" + s + ".png");}

  switch( current_state){

  case STATE_LOADING:
    if( state_count == 0){
      k_img_loading = li( "loading_1");
      li( "loading_2");

      k_img_bg_title = -1;

      loaded_model_num = 0;
    }

    if( k_img_bg_title < 0 && skc.loaded_count == 2){
      k_img_bg_title = li( "bg_title");
      k_img_bg_game = li( "bg_game");

      k_img_game_over = li( "game_over");
      li( "game_over_back");

      k_img_explosion = li( "explosion");
      k_img_numbers = li( "numbers");

      k_img_button_author = li( "button_author");
      k_img_button_policy = li( "button_policy");
      k_img_audio = li( "audio");

      k_img_dialogue = li( "dialogue");
    }

    n = 0;
    for( i = 0; i < AUDIONUM; i++) if( audioBase64[ i]) n++;
    for( i = 0; i < MODELNUM; i++) if( modelString[ i]) n++;

    if( init_count == 0 && n == AUDIONUM + MODELNUM){
      k_aud_decide = ska.load_base_64( audioBase64[ 0]);

      k_aud_money = ska.load_base_64( audioBase64[ 1]);
      for( i = 2; i < AUDIONUM; i++) ska.load_base_64( audioBase64[ i]);

      load_model();

      init_count++;
    }

    if(
      init_count == 1 &&
      skc.loaded_count + ska.loaded_count == IMAGENUM + AUDIONUM &&
      loaded_model_num == MAX_LEVEL + 3 + 1 && //★←透明が3つと、ボード。
      FPS <= state_count
    ) init_count++;

    if( init_count == 3){
      my_score = undefined;
      if( "localStorage" in window){
        try{ my_score = localStorage.getItem( SP + "my_score");} catch( e){}
      }

      if( my_score){
        //★永続データが存在する時。
        load_permanents();
        if( my_score == 0){
          //★タイトル画面へ
          next_state = STATE_TITLE;
        } else{
          //★ゲーム画面へ
          display_score = my_score;
          for( i = 0; i < MHW; i++) if( 0 < map[ i]){ emotion_map[ i] = EMOTION_NORMAL; rock_map[ i] = -1;}
          for( i = 0; i < MAX_SMOKE_NUM; i++) smoke_n[ i] = -1;
          current_state = next_state = STATE_GAME;
          state_count = 1;
          is_dialogue = false;
        }
      } else{
        //★永続データが存在しない時。
        //★my_score が、文字列 "undefined" → NaN とパースされた場合もここに来る。
        is_audio = true;
        for( i = 0; i < 5; i++) hiscores[ i] = [ 100, 50, 10, 5, 1][ i];
        next_state = STATE_TITLE;
      }

      for( i = 0; i < 3; i++){
        a = l2mb( 7 + i);
        mesh[ a] = new THREE.Group();
        mesh[ a].add( mesh[ k_mesh_transparent + i * 2 + 1].clone());
        mesh[ a].add( mesh[ k_mesh_transparent + i * 2].clone());
      }

      for( i = 1; i <= MAX_LEVEL; i ++) for( j = 1; j < MHW; j++){
        a = l2mb( i);
        mesh[ a + j] = mesh[ a].clone();
      }

      t = 72;
      for( i = 0; i < MAX_LEVEL * MHW; i ++){
        m = mesh[ k_mesh_money + i];
        m.scale.set( t, t, t);
        m.rotation.x = 0.5 * PI;
        m.visible = false;
        scene.add( m);
      }

      t = 100;
      m = mesh[ k_mesh_board];
      m.scale.set( t, t, t);
      m.position.set( 0.5 * REFW, 0.5 * REFH, 0);
      m.rotation.x = 0.5 * PI;
      scene.add( m);

		document.addEventListener( "visibilitychange", function(){
			if( document.visibilityState === "visible"){
				skt.reset();
			}
		}, false);
    }

    break;

  case STATE_TITLE:
    if( state_count == 0){
      mesh[ k_mesh_board].visible = false;
      my_score = display_score = 0;
      for( i = 0; i < MHW; i++) map[ i] = 0;
      for( i = 0; i < MAX_LEVEL * MHW; i++) mesh[ k_mesh_money + i].visible = false;
      for( i = 0; i < MAX_SMOKE_NUM; i++) smoke_n[ i] = -1;
      save_permanents();
      is_policy = false;
    }

    i = Math.floor( state_count % FPS / FPS * 12);
    j = Math.floor( ( state_count + 1) % FPS / FPS * 12);
    if( i != j && i < 4) put_smoke( 0, 200 + i * 70, 720);

    break;

  case STATE_GAME:
    if( state_count == 0){
      for( i = 0; i < MAX_SMOKE_NUM; i++) smoke_n[ i] = -1;
      mesh[ k_mesh_board].visible = true;
      appear();
      my_score = 1;
      is_slipping = false;
      is_dialogue = false;
    }

    if( is_slipping){
      //★惰性でスリップ中。
      lead += 30;

      if( direction % 2){ f = ( PW <= lead); if( f) lead -= PW;}
      else{ f = ( PH <= lead); if( f) lead -= PH;}

      if( f){
        //★ひとマス分、進んだ時。
        if( direction == 0 || direction == 3){ q = 0; vq = 1;} else{ q = MHW - 1; vq = -1;}

        n = 0;
        is_slipping = false;
        for( i = 0; i < MHW; i++){
          if( 0 < map[ q] && emotion_map[ q] == EMOTION_SLIP){
            p = q + VP[ direction];

            if( map[ p] == 0){
              //★空マスを通過、または空マスで停止。
              map[ p] = map[ q];

              p2 = p + VP[ direction];
              if( direction % 2) f = ( Math.floor( p / MW) == Math.floor( p2 / MW));
              else f = ( 0 <= p2 && p2 < MHW);

              if( f && (
                map[ p2] == 0 ||
                ( map[ p2] == map[ p] && emotion_map[ p2] == EMOTION_NORMAL) ||
                emotion_map[ p2] == EMOTION_SLIP
              )){
                //★通過。
                emotion_map[ p] = EMOTION_SLIP;
                rock_map[ p] = -1;
                is_slipping = true;
              } else{
                //★停止。
                emotion_map[ p] = EMOTION_NORMAL;
                rock_map[ p] = 0;
              }
            } else{
              //★同じもの２つが合体した。
              mesh[ l2mb( map[ p]) + p].visible = false;
              map[ p]++;
              if( n < map[ p]) n = map[ p];
              emotion_map[ p] = EMOTION_APPEAR;
              counter_map[ p] = 4 * ANIMUNIT - 1;
              rock_map[ p] = 0;
            }
            mesh[ l2mb( map[ q]) + q].visible = false;
            map[ q] = 0;
          }
          q += vq;
        }

        if( 0 < n){
          //★登場音。
          if( n == 12) n--;
          play_audio( k_aud_money + n - 1);
        }

        if( !is_slipping){
          //★スリップ中のパネルが、ひとつもなくなった瞬間。
          if( n == 0){
            //★登場音。
            play_audio( k_aud_money);
          }
          appear();

          my_score = 0;
          //for( i = 0; i < MHW; i++) if( 0 < map[ i]) my_score += Math.pow( 10, map[ i] - 1);
          for( i = 0; i < MHW; i++) if( 0 < map[ i]) my_score += [
            1, 5, 10, 50, 100, 500, 1000, 5000, 10000, 100000, 1000000, 100000000, MAXSCORE
          ][ map[ i] - 1];
          if( MAXSCORE < my_score) my_score = MAXSCORE;

          for( i = 0; i < 4; i++){
            set_direction( i);
            if( 0 < slip_num) break;
          }
          set_direction( -1);
          if( i < 4) save_permanents();
          else next_state = STATE_GAME_OVER
        }
      }
    }

    a = my_score - display_score;
    if( a != 0){
      if( -10 < a && a < 10) if( 0 < a) display_score++; else display_score--;
      else display_score += Math.floor( 0.5 * a);
    }

    break;

  case STATE_GAME_OVER:
    if( state_count == 0){
      for( i = 0; i < 5; i++){
        if( hiscores[ i] <= my_score){
          for( j = 4; i < j; j--) hiscores[ j] = hiscores[ j - 1];
          hiscores[ i] = my_score;
          break;
        }
      }
    }

    if( state_count % 2 == 0){
      p = Math.floor( MHW * Math.random());
      if( 0 < map[ p] && rock_map[ p] < 0) rock_map[ p] = FPS;
    }

    i = Math.floor( state_count % FPS / FPS * 12);
    j = Math.floor( ( state_count + 1) % FPS / FPS * 12);
    if( i != j && i < 4) put_smoke( 0, 250 + i * 70, 170);

    break;
  }

	if( STATE_TITLE <= current_state){
		if( STATE_GAME <= current_state){
			if( is_acc){
				x = 1000 * acc_x;
				y = 6000 - 1000 * acc_y;
			} else{
				t = 0.2 * state_count * 2 * PI / FPS;
				x = 1000 * Math.cos( t);
				y = -1000 * Math.sin( t);
			}
			z = 100;
			light[ 0].position.set( 0.5 * REFW + x, 0.5 * REFH + y, z);
			light[ 1].position.set( 0.5 * REFW - x, 0.5 * REFH - y, z);
		}

		progress_animation();
	}
}

//◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍

function load_model(){
	lm( l2mb( 1));
	lm( l2mb( 2));
	lm( l2mb( 3));
	lm( l2mb( 4));
	lm( l2mb( 5));
	lm( l2mb( 6));
	lm( k_mesh_transparent + 0);
	lm( k_mesh_transparent + 1);
	lm( k_mesh_transparent + 2);
	lm( k_mesh_transparent + 3);
	lm( k_mesh_transparent + 4);
	lm( k_mesh_transparent + 5);
	lm( l2mb( 10));
	lm( l2mb( 11));
	lm( l2mb( 12));

	lm( k_mesh_board);

	function lm( n){
		var l;

		l= new THREE.JSONLoader();
		l.loadFromText( modelString[ loaded_model_num], function( geo, mats){
			var i;
			var c;

			for( i = 0; i < mats.length; i++){
				c = mats[ i].color;

				if( n == k_mesh_board){
					//★ボード。
					mats[ i] = new THREE.MeshPhongMaterial( {
						transparent: true,
						opacity: 0.3,

						specular: 0xffffff,
						shininess: 0,
						shading: THREE.FlatShading
					});
				} else if( k_mesh_transparent <= n && n < k_mesh_transparent + 6){
					if( c.r == 1){
						//★1000、5000、10000 の数字。
						mats[ i] = new THREE.MeshLambertMaterial( {
							//specular: 0xffffff,
							//shininess: 0,
							shading: THREE.FlatShading
						});
					} else {
						//★1000、5000、10000 の本体。
						mats[ i] = new THREE.MeshPhongMaterial( {
							transparent: true,
							opacity: 0.25,

							specular: 0xffffff,
							shininess: 100,
							shading: THREE.FlatShading
						});
					}
				} else if( n == l2mb( 11) || n == l2mb( 12)){
					//★ダイヤモンド。
					mats[ i] = new THREE.MeshPhongMaterial( {
						specular: 0xffffff,
						shininess: 100,
						shading: THREE.FlatShading
					});
				} else{
					//★その他すべて。
					mats[ i] = new THREE.MeshPhongMaterial( {
						specular: 0xffffff,
						shininess: 0,
						shading: THREE.FlatShading
					});
				}

				//c = new THREE.Color( 0xffffff);
				mats[ i].color = c;
			}

			m = mesh[ n] = new THREE.Mesh( geo, new THREE.MultiMaterial( mats));
			//m.castShadow = isShadow;
			//m.receiveShadow = isShadow;

			loaded_model_num++;
		});
	}
}

//◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍

onkeydown = function( e){
	var a;

	e.preventDefault();

	if( current_state == STATE_GAME){
		if( is_slipping || is_dialogue) return;

		appear_now();

		a = e.keyCode;
		if( 37 <= a && a <= 40){
			set_direction( ( a - 37 + 3) % 4);
			if( 0 < slip_num){
				lead = 0;
				is_slipping = true;
			}
		}
	}
};

function appear_now(){
	var i;

	for( i = 0; i < MHW; i++) if( 0 < map[ i]){
		if( emotion_map[ i] == EMOTION_APPEAR && counter_map[ i] < 4 * ANIMUNIT){
			emotion_map[ i] = EMOTION_NORMAL;
			put_smoke( 4 * ANIMUNIT, PX + ( 0.5 + i % MW) * PW, PY + ( 0.5 + Math.floor( i / MW)) * PH);
		}
	}
}

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
				emotion_map[ p] = EMOTION_APPEAR;
				counter_map[ p] = 0;
				rock_map[ p] = 0;
				break;
			} else b--;
			p = ++p % MHW;
		}
		a--;
	}
}

function put_smoke( n, x, y){
	var i;

	for( i = 0; i < MAX_SMOKE_NUM; i++) if( smoke_n[ i] < 0){
		smoke_n[ i] = n;
		smoke_x[ i] = x;
		smoke_y[ i] = y;
		break;
	}
}

function progress_animation(){
	var a, b, i;
	var t, u;
	var m;

	for( i = 0; i < MHW; i++) if( 0 < map[ i] && emotion_map[ i] == EMOTION_APPEAR){
		if( ++counter_map[ i] == 4 * ANIMUNIT){
			emotion_map[ i] = EMOTION_NORMAL;
			put_smoke( 4 * ANIMUNIT, PX + ( 0.5 + i % MW) * PW, PY + ( 0.5 + Math.floor( i / MW)) * PH);
		}
	}

	for( i = 0; i < MAX_SMOKE_NUM; i++) if( 0 <= smoke_n[ i]){
		if( ++smoke_n[ i] == 8 * ANIMUNIT) smoke_n[ i] = -1;
	}

	for( i = 0; i < MHW; i++) if( 0 < map[ i]){
		if( 11 <= map[ i]){
			m = mesh[ l2mb( map[ i]) + i];
			m.rotation.x = 0.6 * PI;
			m.rotation.z = state_count * 0.3 * PI / FPS;
		} else{
			a = rock_map[ i];
			if( 0 <= a){
				if( a < FPS){
					a++;
					if( a < FPS){
						t = 3 * a * 2 * PI / FPS;
						u = 0.5 * ( 1 - a / FPS);
						m = mesh[ l2mb( map[ i]) + i];
						m.rotation.x = 0.5 * PI - u * Math.cos( t);
						m.rotation.z = -u * Math.sin( t);
					} else a = -1;
				} else{
					a++;
					b = 0.5 * FPS;
					if( a < FPS + b){
						t = ( -0.5 + ( 0.25 * FPS + a - FPS + 1) % b / b) * PI;
						m = mesh[ l2mb( map[ i]) + i];
						m.rotation.z = t;
					} else a = -1;
				}
				rock_map[ i] = a;
			}
		}
	}
}

//◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍

function draw_main(){
	var a, i;
	var t, x, y;
	var c;

	c = skc.ctx;

	c.clearRect( 0, 0, REFW, REFH);

	switch( current_state){

	case STATE_LOADING:
		if( k_img_bg_title < 0){
			//c.fillStyle = "rgba( 255, 255, 0, 0.2)";
			//c.fillRect( 0, 0, REFW, REFH);
		} else{
			//c.fillStyle = "rgba( 255, 0, 153, 0.2)";
			//c.fillRect( 0, 0, REFW, REFH);

			skc.draw_string_size_color( 100, 0.2 * REFH, "Money Explosion", 40, 0x000000);

			x = 0.5 * REFW;
			y = 0.5 * REFH;
			skc.draw_centered( k_img_loading, x, y);
			if( state_count % 4 < 2) skc.draw_centered( k_img_loading + 1, x, y);
			else skc.draw_mirrored_centered( k_img_loading + 1, x, y);

			t = state_count / FPS;
			if( 1 < t) t = 1;

			a = 0;
			for( i = 0; i < AUDIONUM; i++) if( audioBase64[ i]) a++;
			for( i = 0; i < MODELNUM; i++) if( modelString[ i]) a++;

			t *= ( a + skc.loaded_count + ska.loaded_count + loaded_model_num) / ( IMAGENUM + 2 * AUDIONUM + 2 * MODELNUM);

			if( t < 1){
				//★プログレスバー
				c.fillStyle = "#000000";
				c.fillRect( 0.15 * REFW, 0.85 * REFH, t * 0.7 * REFW, 0.02 * REFH);
				c.strokeStyle = "#000000";
				c.lineWidth = 2;
				c.strokeRect( 0.15 * REFW, 0.85 * REFH, 0.7 * REFW, 0.02 * REFH);
			} else{
				//★ロード完了、ワンタッチ待ち
				if( state_count % 6 < 4){
					skc.draw_string_size_color( 0.5 * REFW - 70, 0.85 * REFH, "tap to start", 24, 0x000000);
				}
			}
		}
		break;

	case STATE_TITLE:
		draw_smokes();

		skc.draw( k_img_bg_title, 0, 0);

		skc.draw_string_size_color( 200, 60, "Monkey Circus", 24, 0xbbbbee);
		skc.draw_string_size_color( 250, 90, "presents", 18, 0xbbccee);
		skc.draw_string_size_color( 340, 216, "©︎2016, 2020 Maeda Mameo", 15, 0x000000);

		if( build != BUILD_BROWSER){
			skc.draw_tinted_centered_scaled( k_img_button_author, 45, 45, 80 / 120, 0xffffff);
			c.globalAlpha = 0.6;
			skc.draw_centered_scaled( k_img_button_author, 45, 45, 80 / 120);
			c.globalAlpha = 1;
		}

		x = REFW - 80 - 5; y = 5;
		if( is_audio){
			skc.draw_tinted_partially( k_img_audio, x, y, 0, 80, 80, 80, 0xeedd99);
			skc.draw_tinted_partially(
				k_img_audio, x, y - 8 * Math.sin( state_count % 15 * PI / 15),
				0, 160, 80, 80, 0xeedd99
			);
		} else skc.draw_tinted_partially( k_img_audio, x, y, 0, 0, 80, 80, 0xeedd99);

		for( i = 0; i < 5; i++){
			skc.draw_string_size_color( 50, 280 + i * 90, "第" + ( 1 + i) + "位", 30, 0x000000);
			c.fillStyle = "rgba(" + ( 255 - i * 30) + ",153," + ( 135 + i * 40) + ",0.5)";
			draw_yen( 550, 280 + i * 90, hiscores[ i]);
		}

		x = 135;
		y = 35;
		if( is_policy){
			c.fillStyle = "#ffffff";
			c.fillRect( x, y, 350, 490);

			c.fillStyle = "#666666";
			c.textAlign = "center";
			c.font = "bold 21pt 'Arial'";
			c.fillText( "privacy policy", x + 175, y + 50);
			c.font = "bold 17pt 'Arial'";
			c.fillText( "プライバシーポリシー", x + 175, y + 80);

			c.font = "12pt 'Arial'";
			var s = [
				"The following advertisement",
				"distribution company may acquire",
				"user's information for better ads.",
				"No personal identification",
				"information be collected.",
				"Please see the link below for details.",
				"",
				"よりよい広告の配信を目的として",
				"下記の広告配信事業者がユーザー情報を",
				"自動取得する場合があります。この情報",
				"から個人が特定されることはありません。",
				"詳しくは下記のリンクよりご確認ください。",
				"",
				"",
				"AdMob（Google Inc.）" ,
				"https://policies.google.com/technologies/ads"
			];
			for( i = 0; i < s.length; i++) c.fillText( s[ i], x + 175, y + 140 + i * 20);

			c.strokeStyle = "#666666";
			//c.lineWidth = 1;
			skc.draw_line( x + 10, y + 448, x + 340, y + 448);
		}
		if( build == BUILD_ANDROID){
			skc.draw_tinted_centered_scaled( k_img_button_policy, 135, 35, 60 / 80, 0xffffff);
			c.globalAlpha = 0.6;
			skc.draw_centered_scaled( k_img_button_policy, 135, 35, 60 / 80);
			c.globalAlpha = 1;
		}

		break;

	case STATE_GAME:
		skc.draw( k_img_bg_game, 0, 0);

		skc.draw_string_size_color( 50, 125, "ただいまの獲得金額は……", 20, 0x000000);
		c.fillStyle = "rgba( 255, 255, 0, 0.5)";
		draw_yen( 512, 190, display_score);
		skc.draw_string_size_color( 520, 190, "です。", 20, 0x000000);

		draw_board();

		draw_smokes();

		if( is_dialogue) skc.draw( k_img_dialogue, 10, 10);

		break;

	case STATE_GAME_OVER:
		skc.draw( k_img_bg_game, 0, 0);

		skc.draw_string_size_color( 50, 125, "最終的な獲得金額は……", 20, 0x000000);

		draw_smokes();

		c.fillStyle = "rgba( 255, 255, 0, 0.5)";
		draw_yen( 512, 190, display_score);
		skc.draw_string_size_color( 520, 190, "でした。", 15, 0x000000);

		draw_board();

		x = PX + 2 * PW; y = PY + 2 * PH;
		if( state_count < 3 * FPS) t = 0.4 * state_count / FPS / 3; else t = 0.4;
		c.globalAlpha = t;
		skc.draw_centered_scaled_rotated(
			k_img_game_over + 1, x, y,
			0.98 + 0.02 * Math.sin( 5 * PI * state_count / FPS),
			0.18 * PI * state_count / FPS
		);
		c.globalAlpha = 0.5;
		skc.draw_centered( k_img_game_over, x, y);
		c.globalAlpha = 1;

		break;
	}
/*
//★デバグ用表示
c.fillStyle = "rgba( 0, 0, 0, 0.3)";
c.fillRect( 0, REFH - 30, REFW, 30);
c.fillStyle = "#ffffff";
c.font = "18pt 'Arial'";
c.fillText( "is_acc: " + is_acc + " acc_x:" + acc_x + " acc_y:" + acc_y, 5, REFH - 5);
*/
}

function draw_smokes(){
	var i;

	for( i = 0; i < MAX_SMOKE_NUM; i++) if( 0 <= smoke_n[ i]){
		draw_a_smoke( smoke_n[ i], smoke_x[ i], smoke_y[ i]);
	}
}

function draw_a_smoke( n, x, y){
	var s;

	if( current_state == STATE_TITLE) s = 0.7; else s = 1;
	skc.draw_partially_centered_scaled_rotated(
		k_img_explosion, x, y, Math.floor( n / ANIMUNIT) * 230, 0, 230, 230, s, 0
	);
}

function draw_board(){
	var a, b, c, i, p;
	var x, y;

	for( i = 0; i < MHW; i++){
		a = map[ i];
		if( 0 < a){
			x = PX + ( 0.5 + i % MW) * PW;
			y = PY + ( 0.5 + Math.floor( i / MW)) * PH;

			b = emotion_map[ i];
			c = counter_map[ i];

			switch( b){

			case EMOTION_NORMAL:
				set_money( a, i, x, y);
				break;

			case EMOTION_APPEAR:
				draw_a_smoke( c, x, y);
				break;

			case EMOTION_SLIP:
				x += lead * VX[ direction];
				y += lead * VY[ direction];
				set_money( a, i, x, y);

				p = i + VP[ direction];
				if( map[ p] == a && emotion_map[ p] != EMOTION_SLIP){
					if( direction % 2) c = PW; else c = PH;
					draw_a_smoke(
						Math.floor( 4 * lead / c) * ANIMUNIT,
						x + 0.5 * ( c - lead) * VX[ direction],
						y + 0.5 * ( c - lead) * VY[ direction]
					);
				}
				break;
			}
		}
	}
}

function set_money( n, p, x, y){
	var m;

	m = mesh[ l2mb( n) + p];
	m.visible = true;
	m.position.set( x, REFH - y, 5);
}

function l2mb( n){
	var a;

	if( MAX_LEVEL < n) a = MAX_LEVEL; else a = n;
	return k_mesh_money + ( a - 1) * MHW;
}

function draw_yen( x0, y, n){
	var a, b, c, i;
	var x;

	//★最大 20 文字。 (カンマと『円』も数えて。)
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

	skc.ctx.fillRect( x - 30, y - 24, x0 - x + 60, 35);

	for( i = 0; i < c; i++){
		skc.draw_partially( k_img_numbers, z[ i], y - 56, d[ i] * 33, 0, 33, 68);
	}
}
