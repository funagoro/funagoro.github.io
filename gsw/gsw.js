
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

var MYSTORAGE = "gsw_";

var FPS = 40;

//◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍
//★skeleton_3.js から参照されるもの。

var REFW = 640, REFH = 920;
var MAXWIDTH = 640;
var mypadding = 30;
var myorientation = 0;

var MAXTOUCH = 1;
var CAN_PINCH = false;

var IMAGENUM = 27;
var AUDIONUM = 23;

//var DPR = window.devicePixelRatio; //★retina 対応。2017年時点のマシンには負担が大きすぎ。
var DPR = 1;

function touch_event_hook(){
	if( init_count == 3){
		//★シングルタッチでかつ、動いていないタッチで、オーディオの使用開始ができる。
		if( skt.num == 1 && skt.x == skt.bx && skt.y == skt.by){
			//if( !ska.did_ios_start) ska.start_ios();
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
var ACCMAG = 0.3;
var acc_x_std, acc_y_std;

function init_acc(){
	if( build = BUILD_IOS){
		//★ iOS ネイティブでは、Swift からどんどん window.acc_from_swift を
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

var BX = 16;
var BY = 156;
var GRIDW = 76; //★4の倍数で。
var CENTER_X = ( BX + 4 * GRIDW);
var CENTER_Y = ( BY + 4 * GRIDW);
var MENUW = 740;
var MAXSTAGE = 38;
var MAXMOVES = 6; //★全ステージ中で最大の手数。

var VX = [ 0, 1, 1, 1, 0, -1, -1, -1];
var VY = [ -1, -1, 0, 1, 1, 1, 0, -1];
var VP = [ -8, -7, 1, 9, 8, 7, -1, -9];

var EMPTY = 0, BLOCK = 1, SPHERE = 2, SPHERE3 = 3;

//◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍

var k_img_launch;
var k_img_bg;
var k_img_title, k_img_tilt, k_img_sound, k_img_stars;
var k_img_menu, k_img_reset, k_img_how_to, k_img_ok;
var k_img_game, k_img_grid, k_img_nums, k_img_fail;
var k_img_stage_focus, k_img_lock, k_img_clear, k_img_conquer;
var k_img_block, k_img_sphere, k_img_sphere_3;
var k_img_meteor, k_img_core, k_img_tail, k_img_tail_end;
var k_img_letters;
var k_img_flash;

var k_aud_bgm_title, k_aud_bgm_game;
var k_aud_clear, k_aud_conquer;
var k_aud_comet; //★7種ある。
var k_aud_hit; //★2種ある。
var k_aud_move; //★8種ある。
var k_aud_rewind, k_aud_start;

var audioBase64 = new Array( AUDIONUM);

//◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍

var STATE_DEFAULT = 0, STATE_LOADING = 1,
	STATE_TITLE = 2, STATE_HOW_TO = 3, STATE_MENU = 4,
	STATE_WARP = 5, STATE_GAME = 6, STATE_REWIND = 7,
	STATE_FAIL = 8, STATE_CLEAR = 9, STATE_CONQUER = 10;

var FIRST_SILENCE = 3 * FPS;

var WAITING = 0, MOVING = 1;

//◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍

var init_count;

var current_state, next_state, state_count, state_end_count;
var game_state;
var is_audio, is_tilt;

var map = new Int32Array( 64);
var heat_map = new Int32Array( 64);

var game_stage, solved_stage, just_cleared_stage;
var moves, moves_limit, moves_record = new Int32Array( MAXMOVES);

var in_grab = false;
var meteor_x, meteor_y;
var meteor_p, meteor_p_tail;
var last_tail_count, last_tail_d;
var moving_d, moving_count, moving_p, moving_off, moving_speed;

var menu_x, menu_vx;
var focused_stage;
var in_dialogue;

//◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍

var map_cache = new Int32Array( MAXSTAGE * 64);
var moves_limit_cache = new Int32Array( MAXSTAGE);

//◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍

var MAXSTARNUM = 100;
var star_n = new Int32Array( MAXSTARNUM);
var star_d = new Int32Array( MAXSTARNUM);
var star_z = new Int32Array( MAXSTARNUM);
var star_vz = new Int32Array( MAXSTARNUM);
var star_r = new Int32Array( MAXSTARNUM);
var star_vr = new Int32Array( MAXSTARNUM);

var MAXDUSTNUM = 100;
var dust_count, dust_center_d;
var dust_n = new Int32Array( MAXDUSTNUM);
var dust_x = new Float32Array( MAXDUSTNUM);
var dust_y = new Float32Array( MAXDUSTNUM);
var dust_d = new Float32Array( MAXDUSTNUM);
var dust_v = new Float32Array( MAXDUSTNUM);

var MAXFLASHNUM = 2 * MAXMOVES;
var flash_n = new Int32Array( MAXFLASHNUM);
var flash_x = new Float32Array( MAXFLASHNUM);
var flash_y = new Float32Array( MAXFLASHNUM);

//◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍

function on_myorientation(){ myorientation = ( myorientation + 90) % 360;}

function gsw_play_audio( n){
	if( is_audio){
		if( n < 2){
			//★BGM を再生。
			if( current_state == STATE_TITLE) ska.play_loop( k_aud_bgm_title);
			else ska.play_loop( k_aud_bgm_game);
		} else{
			//★効果音を再生。
			if( n == k_aud_comet) ska.play( n + Math.floor( Math.random() * 7));
			else if( n == k_aud_hit) ska.play( n + Math.floor( Math.random() * 2));
			else if( n == k_aud_move) ska.play( n + Math.floor( Math.random() * 8));
			else ska.play( n);
		}
	}
}

//◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍

function gsw_start(){
	var i;
	var c;

	if( build == BUILD_BROWSER){
		if( screen.orientation) screen.orientation.lock( "portrait").catch( function(){});
		//★↑ Chrome で確認済み。
	} else if( build == BUILD_IOS){
		MAXWIDTH = -1;
		if ( 0 <= navigator.userAgent.indexOf( "iPhone")) mypadding = 10;
	} else if( build == BUILD_ANDROID){
		MAXWIDTH = -1;
		mypadding = 10;
	}

	c = document.getElementById( "canvas1");
	skeleton();
	skt = new skeleton_touch( c);
	skc = new skeleton_canvas( c);
	ska = new skeleton_audio();

	focused_stage = 0;

	for( i = 0; i < MAXSTARNUM; i++) star_n[ i] = -1;

	for( i = 0; i < MAXDUSTNUM; i++) dust_n[ i] = -1;
	dust_count = 0;

	for( i = 0; i < MAXFLASHNUM; i++) flash_n[ i] = 0;

	for( i = 0; i < MAXSTAGE; i++) map_cache[ i * 64] = -1;

	current_state = STATE_DEFAULT;
	next_state = STATE_LOADING;

	set_fps( FPS);
}

//◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍

function main(){
	var d;

	if( current_state != next_state){
		current_state = next_state;
		state_count = state_end_count = 0;
		skt.reset();
	}

	if( state_count == 0 || current_mag != latest_mag || myorientation != latest_myorientation){
		skt.set_mag_and_orientation( current_mag, myorientation);
		skc.set_mag_and_orientation( current_mag, myorientation);
	}

	skt.pre();
	skc.pre();

	if( current_state == STATE_LOADING){
		process_loading();
	} else{
		process_stars();
		process_dust();
		process_flash();

		if( skt.start) process_touch_began();

		process_main();

		draw_main();
	}
/*
	skc.ctx.fillStyle = "rgba( 0, 1, 0.9, 0.3)";
	skc.ctx.fillRect( 0, REFH - 20, 100, 20);
	skc.ctx.fillStyle = "#ffffff";
	skc.ctx.font = "12pt 'Arial'";
	skc.ctx.textAlign = "left";
	skc.ctx.fillText( "b: " + acc_x, 5, REFH - 5);
*/
	skc.post();
	skt.post();

	if( current_state == STATE_GAME){
		if( 0 < last_tail_count) last_tail_count--;

		if( meteor_p_tail != meteor_p){
			//★しっぽが縮んでゆく。
			d = get_next_d( meteor_p_tail, meteor_p);
			meteor_p_tail += VP[ d];
			if( meteor_p_tail == meteor_p) last_tail_count = 19;
		}
	}

	if( 0 < state_end_count) state_end_count--;
	if( state_count < 1000 * 24 * 60 * 60 * FPS) state_count++; //★1000日でカンスト。
/*
	skc.ctx.fillStyle = "rgba( 0, 1, 0.9, 0.3)";
	skc.ctx.fillRect( 0, REFH - 20, 100, 20);
	skc.ctx.fillStyle = "#ffffff";
	skc.ctx.font = "12pt 'Arial'";
	skc.ctx.textAlign = "left";
	skc.ctx.fillText( "b: " + acc_x, 5, REFH - 5);
*/
}

//◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍

function process_loading(){
	var i, n;
	var t;

	if( state_count == 0){
		//★起動して最初。
		k_img_launch = li( "launch");
		init_count = 0;
	} 

	switch( init_count){
	case 0:
		//★ロゴ画像のロード完了を待っている間。
		if( 0 < skc.loaded_count){
			//★ロゴ画像のロードが完了した瞬間。他の全ての画像のロード開始。
			k_img_bg = li( "bg");
			k_img_title = li( "title");
			k_img_tilt = li( "tilt");
			k_img_sound = li( "sound");
			k_img_stars = li( "stars");
			k_img_menu = li( "menu");
			k_img_reset = li( "reset");
			k_img_how_to = li( "howto");
			k_img_ok = li( "ok");
			k_img_game = li( "game");
			k_img_grid = li( "grid");
			k_img_nums = li( "nums");
			k_img_fail = li( "fail");
			k_img_stage_focus = li( "stage_focus");
			k_img_lock = li( "lock");
			k_img_clear = li( "clear");
			k_img_conquer = li( "conquer");
			k_img_block = li( "block");
			k_img_sphere = li( "sphere");
			k_img_sphere_3 = li( "sphere_3");
			k_img_meteor = li( "meteor");
			k_img_core = li( "core");
			k_img_tail = li( "tail");
			k_img_tail_end = li( "tail_end");
			k_img_letters = li( "letters");
			k_img_flash = li( "flash");

			init_count++;
		}
		break;

	case 1:
		//★画像のロードが完了したかに関わらず、全ての音ファイルのロード完了を待っている間。
		n = 0; for( i = 0; i < AUDIONUM; i++) if( audioBase64[ i]) n++;
		if( n == AUDIONUM){
			//★音ファイルのロードが完了した瞬間。音のデータ変換を開始。
			k_aud_bgm_title = la( 0);
			k_aud_bgm_game = la( 1);
			k_aud_clear = la( 2);
			k_aud_conquer = la( 3);

			k_aud_comet = la( 4); for( i = 5; i <= 10; i++) la( i);

			k_aud_hit = la( 11); la( 12);

			k_aud_move = la( 13); for( i = 14; i <= 20; i++) la( i);

			k_aud_rewind = la( 21);
			k_aud_start = la( 22);

			init_count++;
		}
		break;

	case 2:
		//★画像のロードが完了と、1秒たつのを待っている間。
		n = AUDIONUM;
		if( skc.loaded_count == IMAGENUM && FPS <= state_count) init_count++;
		break;

	case 3:
		//★タッチ待ち中。
		break;

	case 4:
		n = AUDIONUM;

		load_storage();

		if( current_state == STATE_DEFAULT) next_state = STATE_TITLE;
		else resume_audio();

		function resume_audio(){
			t = 1;
			if( current_state < STATE_TITLE) t = 0
			else if( current_state == STATE_TITLE){
				if( state_count < FIRST_SILENCE) t = 0;
			} else if( current_state == STATE_MENU) t = 0.4;

			if( 0 < t){
				ska.set_volume( k_aud_bgm_game, t);
				gsw_play_audio( -1);
			}
		}

		document.addEventListener( "visibilitychange", function(){
			if( document.visibilityState === "hidden"){
				if( is_audio){
					ska.stop( k_aud_bgm_title);
					ska.stop( k_aud_bgm_game);
				}
			} else if( document.visibilityState === "visible"){
				resume_audio();
			}
		}, false);
	}

	if( init_count == 0){
		skc.fill_rect_color( 0, 0, REFW, REFH, 0x000000);
	} else{
		skc.fill_rect_color( 0, 0, REFW, REFH, 0x65dbef);
		skc.fill_rect_color( 0.05 * REFW, 0.05 * REFH, 0.9 * REFW, 0.9 * REFH, 0x5955e0);
		skc.draw_centered( k_img_launch, REFW / 2, REFH / 2);

		if( init_count < 3){
			t = state_count / FPS;
			if( 1 < t) t = 1;
			t *= ( skc.loaded_count + n + ska.loaded_count) / ( IMAGENUM + 2 * AUDIONUM);

			skc.fill_rect_color( 0.15 * REFW, 0.8 * REFH, t * 0.7 * REFW, 0.02 * REFH, 0xffffff);

			skc.ctx.strokeStyle = "#ffffff";
			skc.alpha( 1);
			skc.ctx.lineWidth = 2;
			skc.ctx.strokeRect( 0.15 * REFW, 0.8 * REFH, 0.7 * REFW, 0.02 * REFH);
		} else{
			//★タッチ待ち。点滅。
			if( state_count % 12 < 6)
				draw_string( 0.5 * REFW - 40, 0.8 * REFH, "GO !!", 3.0);
		}
	}

	function li( s){ return skc.load( "image/" + s + ".png");}
	function la( n){ return ska.load_base_64( audioBase64[ n]);}
}

//◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍

function load_storage(){
	var s;

	s = MYSTORAGE;

	current_state = undefined;
	if( "localStorage" in window){
		try{ current_state = localStorage.getItem( s + "current_state");} catch( e){}
		if( current_state){
			current_state = parseInt( current_state);

			is_audio = localStorage.getItem( s + "is_audio") == "true";
			is_tilt = localStorage.getItem( s + "is_tilt") == "true";

			game_stage = parseInt( localStorage.getItem( s + "game_stage"));
			solved_stage = parseInt( localStorage.getItem( s + "solved_stage"));

			if( current_state == STATE_MENU){
				menu_x = ( game_stage - 1) * MENUW;
				menu_vx = 0;
				just_cleared_stage = 0;
			}
		} else{
			current_state = STATE_DEFAULT;
			is_audio = true;
			is_tilt = true;
			game_stage = 0;
			solved_stage = 0;
		}

		next_state = current_state;
		state_count = state_end_count = 0;
	}
}

function save_storage(){
	var s;

	s = MYSTORAGE;

	if( "localStorage" in window) try{
		localStorage.setItem( s + "current_state", current_state);

		localStorage.setItem( s + "is_audio", is_audio);
		localStorage.setItem( s + "is_tilt", is_tilt);

		localStorage.setItem( s + "game_stage", game_stage);
		localStorage.setItem( s + "solved_stage", solved_stage);
	} catch( e){}
}

//◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍

function process_touch_began(){
	var a, b, i, p;
	var x, y;

	x = skt.x;
	y = skt.y;

	acc_x_std = acc_x;
	acc_y_std = acc_y;

	switch( current_state){
	case STATE_TITLE:
		if( REFH - 32 - 160 <= y){
			if( 32 <= x && x < 32 + 160){
				//★TILT ボタンがタッチされた。
				gsw_play_audio( k_aud_comet);
				is_tilt = !is_tilt;
				save_storage();
			} else if( 320 - 80 <= x && x < 320 + 80){
				//★HOW TO ボタンがタッチされた。
				gsw_play_audio( k_aud_comet);
				menu_x = 0;
				menu_vx = 0;
				next_state = STATE_HOW_TO;
			} else if( REFW - 32 - 160 <= x && x < REFW - 32){
				//★音の ON / OFF ボタンがタッチされた。
				is_audio = !is_audio;
				save_storage();
				if( is_audio){
					gsw_play_audio( -1);
					gsw_play_audio( k_aud_comet);
				} else ska.stop( k_aud_bgm_title);
			}
		} else if( y < 100){
			//★テスト用
			//webkit.messageHandlers.appstore.postMessage( 0);
			//myAndroid.myGooglePlay();
		} else if( y < 600){
			//★START ボタンがタッチされた。
			ska.stop( k_aud_bgm_title);
			gsw_play_audio( k_aud_comet);
			game_stage = 1;
			//game_stage = solved_stage = MAXSTAGE; //★全ステージクリアのデバグ用。
			next_state = STATE_WARP;
		}
		break;

	case STATE_HOW_TO:
		if( REFH - 32 - 160 <= y && REFW - 32 - 160 <= x && x < REFW - 32){
			//★OK ボタンがタッチされた。
			gsw_play_audio( k_aud_comet);
			next_state = STATE_TITLE;
		}
		break;

	case STATE_GAME:
		if( game_state != WAITING) break;

		/*if( y < BY - 30){//★デバグ用（画面上部をタッチすると、ステージクリア。）
			gsw_play_audio( k_aud_comet);
			game_stage++;
			if( game_stage <= MAXSTAGE){
				set_stage( game_stage);
			} else{
				next_state = STATE_TITLE;
			}
			break;
		}*/

		if( BY <= y && y < BY + 8 * GRIDW){
			if( BX <= x && x < BX + 8 * GRIDW){
				p = Math.floor( ( y - BY) / GRIDW) * 8 + Math.floor( ( x - BX) / GRIDW);
				if( map[ p] == EMPTY){
					set_heat_map( p);
					if( 0 < heat_map[ meteor_p]){
						//★流星が何も押さずに移動を開始。
						gsw_play_audio( k_aud_comet);
						meteor_p_tail = meteor_p;
						meteor_p = p;
						meteor_x = x;
						meteor_y = y;
						in_grab = true;
					}
				}
			}
			break;
		}

		if( BY + 8 * GRIDW + 30 < y){
			if( x < 320){
				//★rewind ボタンがタッチされた。
				if( game_state == WAITING && 0 < moves){
					next_state = STATE_REWIND;
				}
			} else{
				//★menu ボタンがタッチされた。
				gsw_play_audio( k_aud_comet);
				menu_x = ( game_stage - 1) * MENUW;
				menu_vx = 0;
				just_cleared_stage = 0;

				next_state = STATE_MENU;
			}
			break;
		}

		break;

	case STATE_MENU:
		if( in_dialogue){
			//★クリアした記録を消去？ YES / NO
			if( 480 <= y && y < 600){
				gsw_play_audio( k_aud_comet);
				if( x < 320){
					just_cleared_stage = 0;
					solved_stage = 0;
					menu_x = 0;
					menu_vx = 0;

					for( i = 0; i < MAXSTAGE; i++) map_cache[ i * 64] = -1;

					set_stage( 1);
					for( i = 0; i < 64; i++) map_cache[ i] = map[ i];
					moves_limit_cache[ 0] = moves_limit;

					save_storage();
				}
				in_dialogue = false;
			}
			break;
		}

		if( CENTER_Y - 612 / 4 <= y && y < CENTER_Y + 612 / 4){
			a = Math.floor( 2 * ( x - CENTER_X + 612 / 4) + menu_x);
			if( 0 <= a && a % MENUW < 612){
				a = 1 + Math.floor( a / MENUW);
				b = solved_stage + 1;
				if( MAXSTAGE < b) b--;
				if( 1 <= a && a <= b){
					focused_stage = a;
				}
			}
			break;
		}

		if( REFH - 32 - 160 <= y){
			if( x < 220){
				//★タイトル画面へ戻るボタンがタッチされた。
				ska.stop( k_aud_bgm_game);
				gsw_play_audio( k_aud_comet);
				next_state = STATE_TITLE;
			} else if( x < 420){
				//★記録を消すボタンがタッチされた。
				gsw_play_audio( k_aud_comet);
				in_dialogue = true;
			} else{
				//★音の ON / OFF ボタンがタッチされた。
				is_audio = !is_audio;
				save_storage();
				if( is_audio){
					gsw_play_audio( -1);
					gsw_play_audio( k_aud_comet);
				} else ska.stop( k_aud_bgm_game);
			}
			break;
		}

		break;

	case STATE_CONQUER:
		if( 6 * FPS <= state_count){
			//★全ステージクリア画面を6秒以上表示した後でタッチされた。
			ska.stop( k_aud_bgm_game);
			gsw_play_audio( k_aud_comet);
			next_state = STATE_TITLE;
		}
		break;
	}
}

//◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍

function process_main(){
	var a, b, i, j;
	var x, y;

	switch( current_state){
	case STATE_DEFAULT:
		next_state = STATE_TITLE;
		break;

	case STATE_TITLE:
		if( state_count == 0){
			save_storage();
		} else if( state_count == FIRST_SILENCE){
			ska.set_volume( k_aud_bgm_title, 1);
			gsw_play_audio( -1);
		}
		break;

	case STATE_HOW_TO:
		if( state_count == 0){
			menu_x = menu_vx = 0;
		}

		a = 1700 - REFH; b = 200;
		if( skt.on){
			if( skt.vy != 0){
				//★ドラッグ。
				menu_vx = Math.floor( -skt.vy);
				menu_x += menu_vx;
				if( menu_x < -b) menu_x = -b;
				else if( a + b <= menu_x) menu_x = a + b - 1;
			}
		} else{
			if( menu_vx != 0){
				//★慣性。
				menu_vx *= 0.9;
				if( -3 < menu_vx && menu_vx < 3) menu_vx = 0;
				else{
					menu_x += menu_vx;
					if( menu_x < -b){
						menu_x = -b;
						menu_vx = 0;
					} else if( a + b <= menu_x){
						menu_x = a + b - 1;
						menu_vx = 0;
					}
				}
			} else{
				//★ぴったりの位置まで引き戻す。
				if( menu_x < 0) menu_x -= menu_x / 7;
				else if( a < menu_x) menu_x += ( a - menu_x) / 7;
			}
		}
		break;

	case STATE_WARP:
		if( state_count == 0){
			gsw_play_audio( -1);
			gsw_play_audio( k_aud_start);

			set_stage( game_stage);
		} else if( FPS <= state_count){
			next_state = STATE_GAME;
		}
		break;

	case STATE_GAME:
		process_game();
		break;

	case STATE_REWIND: case STATE_FAIL:
		if( state_count == 0){
			if( current_state == STATE_REWIND) gsw_play_audio( k_aud_rewind);
			else gsw_play_audio( k_aud_rewind); //★FAIL の音をいただいていないので REWIND の音を流用。
			moving_p = -1;
		}

		if( current_state == STATE_FAIL && state_count < 0.5 * FPS) break;

		if( moving_p < 0){
			a = moves_record[ --moves];
			moving_p = a & 63;
			moving_d = Math.floor( a / 64) & 7;
			map[ moving_p] = Math.floor( a / 512) & 3;
			moving_off = Math.floor( a / 4096);
			if( 0 < ( a & 2048)){
				map[ moving_p + VP[ moving_d] * moving_off] = 0;
			}
			moving_off *= GRIDW;
		} else{
			if( moving_off == 0){
				if( 0 < moves){
					moving_p = -1;
				} else{
					next_state = STATE_GAME;
				}
			} else{
				moving_off -= GRIDW / 4;
			}
		}
		break;

	case STATE_MENU:
		process_menu();
		break;

	case STATE_CLEAR:
		if( state_count == 0){
			if( game_stage < MAXSTAGE) gsw_play_audio( k_aud_clear);
			else gsw_play_audio( k_aud_conquer);

			for( i = 0; i < 64; i++) map_cache[ ( game_stage - 1) * 64 + i] = map[ i];
			moves_limit_cache[ game_stage - 1] = moves_limit;
		}

		if( FPS <= state_count){
			if( solved_stage < game_stage) solved_stage = game_stage;
			if( game_stage < MAXSTAGE){
				menu_x = ( game_stage - 1) * MENUW;
				menu_vx = 0;
				just_cleared_stage = game_stage;
				next_state = STATE_MENU;
			} else{
				next_state = STATE_CONQUER;
			}
		}
	}
	if( ( current_state == STATE_CONQUER && 6 * FPS <= state_count) ||
		( current_state==STATE_TITLE && solved_stage == MAXSTAGE)
	){
		a = state_count % FPS;
		if( a == 0 || a == 3 || a == 12){
			a = Math.floor( 6 + Math.random() * 20);
			x = 20 + Math.random() * 300;
			y = 20 + Math.random() * 440;
			for( i = 0; i < 2; i++){
				for( j = 0; j < a; j++){
					add_dust( x, y, i * Math.PI + 2 * Math.PI * j / a, a / 4);
				}
				a = ( a + 1) / 2;
			}
		}
	}
}

function step_grab( x0, y0, vx, vy){
	var d, p, x, y;

	x = Math.floor( x0); if( vx < 0) x--; else if( 0 < vx) x++;
	y = Math.floor( y0); if( vy < 0) y--; else if( 0 < vy) y++;
	p = x + y * 8;

	if( x < 0 || 7 < x || y < 0 || 7 < y){
		in_grab = false;
	} else if( map[ p] == EMPTY){
		meteor_p = meteor_p_tail = p; //★この時、軌跡も消える。
	} else{
		if( vy < 0) d = 0;
		else if( 0 < vx) d = 2;
		else if( 0 < vy) d = 4;
		else d = 6;

		//★押す。
		gsw_play_audio( k_aud_move);
		moving_d = d;
		moving_count = 0;
		moving_p = p;
		moving_off = 0;
		moving_speed = 7;
		dust_count = Math.floor( FPS / 4);
		dust_center_d = d;
		game_state = MOVING;
		in_grab = false;
	}
}

function process_game(){
	var a, i, p, x, y;
	var t, dt, cx, cy, dx, dy, px, py, vx, vy;

	if( state_count == 0){
		//メニューから遷移してくる最後の1フレームで、
		//隣のステージをセットしてしまっている可能性があるので、
		//↓これが必要。
		set_stage( game_stage);

		ska.set_volume( k_aud_bgm_game, 1);
		game_state = WAITING;
		meteor_x = BX + 0.5 * GRIDW;
		meteor_y = BY + 0.5 * GRIDW;
		meteor_p = meteor_p_tail = 0;
		last_tail_count = 0;
		moving_p = -1;
		dust_count = 0;
		in_grab = false;
	}

	if( 0 < dust_count){
		for( i = 0; i < 5; i++) add_meteor_dust( ( dust_center_d * 0.25 - 0.12 + 0.24 * Math.random()) * Math.PI);
		dust_count--;
	}

	switch( game_state){
	case WAITING:
		if( skt.on){
			dx = ( skt.x - BX) / GRIDW;
			dy = ( skt.y - BY) / GRIDW;
			vx = skt.vx / GRIDW;
			vy = skt.vy / GRIDW;

			if( in_grab){
				if( vx != 0 || vy != 0){
					last_tail_count = 0;

					cx = dx - vx;
					cy = dy - vy;
					t = 0;
					while( t < 1 && in_grab){
						if( vx == 0) px = 1000000;
						else if( 0 < vx){ px = ( Math.ceil( cx) - cx) / vx; if( px == 0) px = 1 / vx;}
						else{ px = ( Math.floor( cx) - cx) / vx; if( px == 0) px = -1 / vx;}

						if( vy == 0) py = 1000000;
						else if( 0 < vy){ py = ( Math.ceil( cy) - cy) / vy; if( py == 0) py = 1 / vy;}
						else{ py = ( Math.floor( cy) - cy) / vy; if( py == 0) py = -1 / vy;}

						if( px < py) dt = px; else dt = py;
						t += dt;

						if( t <= 1){
							if( px < py){ step_grab( cx, cy, vx, 0); dt = px;}
							else{ step_grab( cx, cy, 0, vy); dt = py;}

							cx += dt * vx;
							cy += dt * vy;
						}
					}
				}
/*何だこれ
			} else{
				if( vx != 0 && vy != 0 && 0 <= dx && dx < 8 && 0 <= dy && dy < 8){
					p = Math.floor( dx) + Math.floor( dy) * 8;
					if( map[ p] == EMPTY){
						set_heat_map( p);
						if( 0 < heat_map[ meteor_p]){
							gsw_play_audio( k_aud_comet);
							meteor_p_tail = meteor_p;
							meteor_p = p;
							in_grab = true;
						}
					}
				}*/
			}
		} else{
			if( in_grab) in_grab = false;

			if( is_tilt){
				vx = ACCMAG * ( acc_x - acc_x_std);
				vy = ACCMAG * ( acc_y - acc_y_std);
				a = Math.floor( 100 * Math.sqrt( vx * vx + vy * vy));

				if( vy == 0){
					if( 0 < vx) t = 0.5 * Math.PI; else t = 1.5 * Math.PI;
				} else{
					t = Math.atan( -vx / vy);
					if( 0 < vy) t += Math.PI;
				}

				if( a < 5){
					//a = 0;
				} else if( a < 5 + 20){
					if( 5 + 20 * Math.random() < a){
						add_meteor_dust( t + ( -0.05 + 0.1 * Math.random()) * Math.PI);
					}
				} else{
					moving_d = Math.floor( t / Math.PI * 2.0 + 4.5) % 4 * 2;
					x = meteor_p % 8 + VX[ moving_d];
					y = Math.floor( meteor_p / 8) + VY[ moving_d];
					p = meteor_p + VP[ moving_d];
					if( x < 0 || 7 < x || y < 0 || 7 < y){
						//in_grab = false;
					} else if( map[ p] == EMPTY){
						for( i = 0; i < 5; i++){
							add_meteor_dust( ( moving_d / 4 - 0.12 + 0.24 * Math.random()) * Math.PI);
						}
					} else{
						//★押す。
						gsw_play_audio( k_aud_move);
						moving_count = 0;
						moving_p = p;
						moving_off = 0;
						moving_speed = 7;
						dust_count = Math.floor( FPS / 4);
						dust_center_d = moving_d;
						game_state = MOVING;
					}
				}
			}
		}
		break;

	case MOVING:
		if( moving_p < 0){
			if( !skt.on) game_state = WAITING;
		} else{
			moving_off += moving_speed;
			moving_speed += 1;
			x = moving_p % 8 * GRIDW + moving_off * VX[ moving_d];
			y = Math.floor( moving_p / 8) * GRIDW + moving_off * VY[ moving_d];
			if( x < 0 || 7 * GRIDW < x || y < 0 || 7 * GRIDW < y){
				//★領域外にいる。
				if( x < -2 * GRIDW || 9 * GRIDW < x || y < -2 * GRIDW || 9 * GRIDW <= y){
					//★領域外に消える。
					moves_record[ moves++] =
						moving_p + moving_d * 64 + map[ moving_p] * 512 +
						Math.floor( moving_off / GRIDW) * 4096
					;
					map[ moving_p] = EMPTY;
					game_state = WAITING;
				}
			} else{
				p = Math.floor( y / GRIDW) * 8 + Math.floor( x / GRIDW);
				if( moving_d == 2) x += GRIDW - 1;
				else if( moving_d == 4) y += GRIDW - 1;
				if( map[ Math.floor( y / GRIDW) * 8 + Math.floor( x / GRIDW)] != EMPTY){
					//★衝突した。
					gsw_play_audio( k_aud_hit);
					if( moving_d == 0) p += 8;
					else if( moving_d == 6) p++;
					if( p == moving_p){
						//★動かずに衝突した。
					} else{
						//★動いた後、衝突した。
						moves_record[ moves++] =
							moving_p + moving_d * 64 + map[ moving_p] * 512 + 2048 +
							Math.floor( ( p - moving_p) / VP[ moving_d]) * 4096
						;
						map[ p] = map[ moving_p];
						map[ moving_p] = EMPTY;
						game_state = WAITING;

						if( map[ p] == SPHERE){
							if( is_clear()){
								//★クリア。
								next_state = STATE_CLEAR;
							}
						}
					}
					moving_p = -1;
				}
			}
			if( game_state == WAITING && moves == moves_limit && next_state != STATE_CLEAR){
				//★手数になったのにクリアできなかった。
				next_state = STATE_FAIL;
			}
		}
	}
}

function process_menu(){
	var a, b, i, j;
	var x;

	if( state_count == 0){
		save_storage();
		ska.set_volume( k_aud_bgm_game, 0.4);
		focused_stage = 0;
		in_dialogue = false;

		if( 0 < moves) add_flash( 516 + 48 / 2, 48 + 64 / 2);
		arrange_flash();
	} else if( 0 < state_end_count){
		if( 2 * GRIDW < ( menu_x + GRIDW) % MENUW){
			//★横スライドしている間は、減らさないために足している？
			state_end_count++;
		} else if( state_end_count == 1){
			next_state = STATE_GAME;
		}
	}

	a = MENUW / 2;
	b = solved_stage;
	if( b == MAXSTAGE) b--;
	b *= MENUW;

	if( skt.on && !in_dialogue && state_end_count == 0){
		if( skt.vx != 0){
			//★ドラッグ。
			menu_vx = Math.floor( -2 * skt.vx);
			menu_x += menu_vx;
			if( menu_x < -a) menu_x = -a;
			else if( b + a <= menu_x) menu_x = b + a - 1;

			if( 10 < Math.abs( skt.x - skt.by)) focused_stage = 0;
		}
	} else{
		if( menu_vx != 0){
			//★慣性。
			menu_vx *= 0.9;
			if( -3 < menu_vx && menu_vx < 3) menu_vx = 0;
			else{
				menu_x += menu_vx;
				if( menu_x < -a){
					menu_x = -a;
					menu_vx = 0;
				} else if( b + a <= menu_x){
					menu_x = b + a - 1;
					menu_vx = 0;
				}
			}
		} else{
			//★ぴったりの位置まで。
			game_stage = 1 + Math.floor( ( a + menu_x) / MENUW);
			x = ( game_stage - 1) * MENUW - menu_x;
			if( x == -1) menu_x--;
			else if( x == 1) menu_x++;
			else{
				x = Math.floor( x / 2);
				if( x < -GRIDW) x = -GRIDW;
				else if( GRIDW < x) x = GRIDW;
				menu_x += x;
			}
		}
	}

	if( skt.end){
		if( 0 < focused_stage){
			//★そのステージで、ゲームスタート。
			gsw_play_audio( k_aud_comet);
			state_end_count = Math.floor( 0.3 * FPS - 1);

			game_stage = focused_stage;
			menu_vx = 0;
			if( menu_x < ( game_stage - 1 - 0.5) * MENUW) menu_x = Math.floor( ( game_stage - 1 - 0.5) * MENUW);
			else if( ( game_stage - 1 + 0.5) * MENUW <= menu_x) menu_x = Math.floor( ( game_stage - 1 + 0.5) * MENUW - 1);
			focused_stage = 0;

			set_stage( game_stage);
			arrange_flash();
			for( i = 0; i < 64; i++) map_cache[ ( game_stage - 1) * 64 + i] = map[ i];

			just_cleared_stage = 0;
		}
	}
}

//◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍

function process_stars(){
	var i;

	if( Math.random() * FPS < 5){
		for( i = 0; i < MAXSTARNUM; i++) if( star_n[ i] < 0){
			star_n[ i] = Math.floor( Math.random() * 16);
			star_d[ i] = Math.floor( Math.random() * 1000);
			star_z[ i] = 0;
			star_vz[ i] = 5 + Math.floor( Math.random() * 20);
			star_r[ i] = 0;
			star_vr[ i] = Math.floor( Math.random() * 100) - 50;
			if( star_vr[ i] < 0) star_vr[ i] -= 10; else star_vr[ i] += 10;
			break;
		}
	}

	for( i = 0; i < MAXSTARNUM; i++) if( 0 <= star_n[ i]){
		star_z[ i] += star_vz[ i];
		if( star_z[ i] < 1000){
			star_r[ i] = ( star_r[ i] + 1000 + star_vr[ i]) % 1000;
		} else{
			star_n[ i] = -1;
		}
	}
}

function draw_stars(){
	var i, n;
	var a, x, y;

	for( i = 0; i < MAXSTARNUM; i++){
		n = star_n[ i];
		if( 0 <= n){
			a = star_z[ i] * star_z[ i] / 1000000;
			x = 320 + 140 * ACCMAG * acc_x + 600 * Math.sin( star_d[ i] * 2 * Math.PI / 1000) * a;
			y = 480 + 140 * ACCMAG * acc_y - 600 * Math.cos( star_d[ i] * 2 * Math.PI / 1000) * a;

			skc.alpha( 0.7 * a);
			skc.draw_partially_centered_scaled_rotated(
				k_img_stars, x, y,
				n % 4 * 64, Math.floor( n / 4) * 64,
				64, 64, 2 * a, star_r[ i] * 2 * Math.PI / 1000
			);
		}
	}

	skc.alpha( 1);
}

//◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍

function add_dust( x, y, d, v){
	var i;

	for( i = 0; i < MAXDUSTNUM; i++){
		if( dust_n[ i] < 0){
			dust_n[ i] = 0;
			dust_x[ i] = x;
			dust_y[ i] = y;
			dust_d[ i] = d;
			dust_v[ i] = v;
			break;
		}
	}
}

function add_meteor_dust( t){
	add_dust(
		BX + ( meteor_p % 8 + 0.5) * GRIDW + 10 * Math.sin( t),
		BY + ( Math.floor( meteor_p / 8) + 0.5) * GRIDW - 10 * Math.cos( t),
		t, 5 + Math.random() * 5
	);
}

function process_dust(){
	var i;

	for( i = 0; i < MAXDUSTNUM; i++){
		if( 0 <= dust_n[ i]){
			if( ++dust_n[ i] < 20){
				dust_x[ i] += dust_v[ i] * Math.sin( dust_d[ i]);
				dust_y[ i] -= dust_v[ i] * Math.cos( dust_d[ i]);
			} else{
				dust_n[ i] = -1;
			}
		}
	}
}

function draw_dust(){
	var a, i;
	var t;

	for( i = 0; i < MAXDUSTNUM; i++){
		if( 0 <= dust_n[ i]){
			t = ( 20 - dust_n[ i]) / 20.0;
			skc.alpha( t);
			a = 11 + dust_n[ i] % 3;
			if( 11 < a) a += 2;

			skc.draw_partially_scaled(
				k_img_stars, dust_x[ i] - 16, dust_y[ i] - 16,
				a % 4 * 64, Math.floor( a / 4) * 64, 64, 64, 0.5
			);
		}
	}
	skc.alpha( 1);
}

//◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍

function add_flash( x, y){
	var i;

	for( i = 0; i < MAXFLASHNUM; i++){
		if( flash_n[ i] == 0){
			flash_n[ i] = 20;
			flash_x[ i] = x;
			flash_y[ i] = y;
			break;
		}
	}
}

function arrange_flash(){
	var i, j, p, q;

	p = 0; q = ( game_stage - 1) * 64;
	for( i = 0; i < 8; i++) for( j = 0; j < 8; j++){
		if( map[ p] != map_cache[ q]){
			add_flash( BX + ( j + 0.5) * GRIDW, BY + ( i + 0.5) * GRIDW);
		}
		p++; q++;
	}
}

function process_flash(){
	var i;

	for( i = 0; i < MAXFLASHNUM; i++) if( 0 < flash_n[ i]) flash_n[ i]--;
}

function draw_flash(){
	var i;

	for( i = 0; i < MAXFLASHNUM; i++) if( 0 < flash_n[ i]){
		skc.draw_centered_scaled( k_img_flash, flash_x[ i], flash_y[ i], 0.08 * flash_n[ i]);
	}
}

//◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍

function set_stage( n){
	var a, b, i, x, y;

	var s = [
		"1780 DATA 00,00,00,00,08,00,00,08,00,14,00,00, 1",//1
		"1790 DATA 00,00,50,00,00,00,00,10,02,10,00,00, 2",
		"1800 DATA 10,00,00,20,00,00,00,10,00,02,10,00, 2",
		"1810 DATA 00,10,02,20,22,00,00,00,00,18,08,00, 3",
		"1820 DATA 00,00,00,00,14,00,00,08,04,10,00,00, 3",//5
		"1830 DATA 10,00,02,00,28,00,00,00,20,28,00,00, 2",
		"1840 DATA 08,04,22,10,08,00,00,10,08,04,00,00, 2",
		"1850 DATA 00,42,00,20,04,00,00,10,28,00,00,00, 3",
		"1860 DATA 00,10,04,24,00,02,00,00,08,00,08,10, 3",
		"1870 DATA 00,10,00,14,00,22,00,00,04,28,00,00, 6",//10
		"1880 DATA 00,00,12,00,10,00,00,00,00,04,28,00, 5",
		"1890 DATA 00,02,00,20,0C,00,00,10,08,08,00,00, 4",
		"1900 DATA 00,00,20,00,0C,20,04,00,02,08,00,00, 5",
		"1910 DATA 00,04,00,20,02,10,00,00,00,18,08,00, 5",
		"1920 DATA 10,04,00,04,00,08,00,08,14,00,00,00, 5",//15
		"1930 DATA 00,18,00,20,08,00,00,24,00,10,00,00, 5",
		"1940 DATA 00,08,00,04,20,00,00,10,20,00,08,00, 4",
		"1950 DATA 00,10,04,00,14,00,04,08,00,08,00,00, 3",//18 (原作では4手。)
		"1960 DATA 00,14,00,00,30,00,00,00,00,28,04,00, 3",
		"1970 DATA 00,30,02,00,20,04,04,08,00,08,00,00, 4",//20
		"1980 DATA 00,00,00,02,12,00,00,08,10,20,00,00, 3",
		"1990 DATA 00,04,00,08,02,10,00,10,00,44,00,00, 5",
		"2000 DATA 00,00,00,04,10,00,00,08,10,20,00,00, 4",
		"2010 DATA 04,24,00,00,00,20,00,00,10,08,04,00, 3",//24 (原作では5手。)
		"2020 DATA 00,10,00,02,40,04,00,00,00,28,10,00, 5",//25
		"2030 DATA 00,08,00,00,14,20,00,00,38,00,00,00, 5",
		"2040 DATA 00,20,02,00,04,08,00,08,00,14,00,00, 4",
		"2050 DATA 00,04,04,20,08,00,00,10,10,10,00,00, 4",
		"2060 DATA 00,0C,00,00,08,00,00,20,08,00,00,20, 5",
		"2070 DATA 00,20,10,00,10,00,00,04,02,04,00,00, 5",//30
		"2080 DATA 08,00,00,00,04,10,00,00,1C,00,00,00, 5",
		"2090 DATA 00,10,00,0A,08,00,00,00,08,20,00,10, 4",
		"2100 DATA 00,08,20,04,00,00,00,00,00,10,10,20, 5",
		"2110 DATA 02,00,04,02,20,08,10,08,00,00,08,00, 4",//34 (原作では5手。)
		"2120 DATA 00,00,20,22,02,00,00,08,02,08,00,00, 4",//35
		"2130 DATA 00,00,00,00,00,00,20,04,08,10,20,04, 4",
		"2140 DATA 00,00,02,00,08,00,00,00,28,00,20,00, 5",
		"2150 DATA 00,00,04,22,10,00,00,38,00,00,00,00, 5"//38
	];

	for( i = 0; i < 64; i++) map[ i] = EMPTY;

	for( i = 0; i < 2; i++){
		for( y = 0; y < 6; y++){
			b = 10 + ( i * 6 + y) * 3;
			a = parseInt( "0x" + s[ n - 1].substring( b, b + 2));
			for( x = 0; x < 8; x++){
				if( 0 < ( a & 1)){
					map[ ( 1 + y) * 8 + x] = 1 + i;
				}
				a = Math.floor( a / 2);
			}
		}
	}

	moves_limit = parseInt( s[ n - 1].substring( 47, 48));
	moves = 0;
}

function is_clear(){
	var x, y, z;

	z = 0;
	for( y = 0; y < 8; y++){
		for( x = 0; x < 8; x++){
			if( map[ z] == SPHERE){
				if( x < 6){
					if( map[ z + 1] == SPHERE && map[ z + 2] == SPHERE){
						map[ z] = map[ z + 1] = map[ z + 2] = SPHERE3;
						return true;
					}
				}
				if( y < 6){
					if( map[ z + 8] == SPHERE && map[ z + 16] == SPHERE){
						map[ z] = map[ z + 8] = map[ z + 16] = SPHERE3;
						return true;
					}
				}
			}
			z++;
		}
	}
	return false;
}

function set_heat_map( p){
	var i, j, k, q;
	var f;

	for( i = 0; i < 64; i++) if( map[ i] == EMPTY) heat_map[ i] = 0; else heat_map[ i] = -1;

	heat_map[ p] = 1;

	for( i = 1; ; i++){
		f = true;
		for( j = 0; j < 64; j++){
			if( heat_map[ j] == i){
				for( k = 0; k < 8; k += 2){
					q = j + VP[ k];
					if( 0 <= q && q < 64 && !( j % 8 == 0 && k == 6) && !( j % 8 == 7 && k == 2)){
						if( heat_map[ q] == 0){
							heat_map[ q] = i + 1;
							f = false;
						}
					}
				}
			}
		}
		if( f) break;
	}
}

function get_next_d( p, p2){
	var d, i, q, vx, vy;

	//★まず、方向性を決定する。
	vx = p2 % 8 - p % 8;
	vy = Math.floor( p2 / 8) - Math.floor( p / 8);
	if( vx * vx < vy * vy){
		if( vy < 0) d = 0; else d = 4;
	} else{
		if( 0 < vx) d = 2; else d = 6;
	}

	for( i = 0; i < 4; i++){
		q = p + VP[ d];
		if( 0 <= q && q < 64 && !( p % 8 == 0 && d == 6) && !( p % 8 == 7 && d == 2)){
			if( heat_map[ q] == heat_map[ p] - 1) return d;
		}
		d = ( d + 2) % 8;
	}
	return -1; //★進むことができる方向がなかった。 (ゴールから検索を始めた場合など。)
}

//◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍

function draw_main(){
	var a, d, d0, i, j, n, p;
	var t, u, x, y, x0, y0;
	var f;
	var c;

	c = skc.ctx;
	skc.alpha( 1);
	skc.draw( k_img_bg, 0, 0);
	draw_stars();

	switch( current_state){
	case STATE_TITLE:
		skc.draw( k_img_title, 0, 0);

		//skc.alpha( 0.5);
		//draw_string( 150, 165, "web", 2);

		//skc.alpha( 0.3);
		//draw_string( 230, 165, "ver. 1.0", 1.5);

		skc.alpha( 1);
		x = 32; y = REFH - 32 - 160;
		skc.draw_partially( k_img_tilt, x - 20, y - 20, 0, 0, 200, 200);
		if( is_tilt){
			a = Math.floor( state_count / ( FPS / 5));
			if( 0 < ( a & 1)) a = 1 + Math.floor( a / 2) % 4; else a = 0;
		} else a = 0;
		skc.draw_partially( k_img_tilt, x + 80 - 40, y, 220 + a * 80, 20, 80, 140);

		x = REFW - 32 - 160;
		draw_button_sound( x, y);
		break;

	case STATE_HOW_TO:
		skc.alpha( 0.6);
		skc.fill_rect_color( 0, 0, REFW, REFH, 0x000000);
		skc.alpha( 1);

		skc.draw( k_img_how_to, 0, -menu_x);
		skc.draw( k_img_how_to, 0, -menu_x);

		skc.draw( k_img_ok, REFW - 32 - 160 - 20, REFH - 32 - 160 - 20);
		break;

	case STATE_WARP: case STATE_GAME: case STATE_REWIND:
	case STATE_CLEAR: case STATE_FAIL: case STATE_CONQUER:
		if( current_state == STATE_WARP){
			t = 1.0 * state_count / FPS;
			c.save();
			c.translate( CENTER_X, CENTER_Y);
			c.scale( t, t);
			c.rotate( ( 1 - t) * Math.PI);
			c.translate( -CENTER_X, -CENTER_Y);
			skc.alpha( t);
		} else if( current_state == STATE_CONQUER){
			c.save();
			if( state_count < FPS){
				c.translate( CENTER_X, CENTER_Y);
				t = state_count / FPS;
				t = 1 + 15 * t * t;
				c.scale( t, t);
				c.rotate( state_count * -0.5 * Math.PI / FPS);
				c.translate( -CENTER_X, -CENTER_Y);
				t = 1.0 - 1.0 * state_count / FPS;
			} else t = 0;
			skc.alpha( t);
		} else t = 1;

		skc.draw( k_img_grid, BX - 8, BY - 8);

		p = 0;
		for( i = 0; i < 8; i++){
			for( j = 0; j < 8; j++){
				n = map[ p];
				if( EMPTY < n){
					x = j * GRIDW;
					y = i * GRIDW;
					u = 1.0;
					if( p == moving_p){
						x += moving_off * VX[ moving_d];
						y += moving_off * VY[ moving_d];
						if( x < 0) u = 1 + x / 2.0 / GRIDW;
						else if( 7 * GRIDW < x) u = 1 - ( x - 7 * GRIDW) / 2.0 / GRIDW;
						else if( y < 0) u = 1 + y / 2.0 / GRIDW;
						else if( 7 * GRIDW < y) u = 1 - ( y - 7 * GRIDW) / 2.0 / GRIDW;
					}
					skc.alpha( t * u);
					draw_piece( n, BX + x, BY + y);
				}
				p++;
			}
		}
		skc.alpha( 1);

		if( current_state == STATE_GAME){
			//★流星のしっぽを描画。
			c.globalCompositeOperation = "lighter";

			skc.alpha( 0.8);
			p = meteor_p_tail;
			f = ( p == meteor_p);
			if( !f){
				x0 = BX + ( p % 8 + 0.5) * GRIDW;
				y0 = BY + ( Math.floor( p / 8) + 0.5) * GRIDW;
				d0 = get_next_d( p, meteor_p);
				while( !f){
					c.save();

					p += VP[ d0];
					x = BX + ( p % 8 + 0.5) * GRIDW;
					y = BY + ( Math.floor( p / 8) + 0.5) * GRIDW;
					d = get_next_d( p, meteor_p);

					f = ( p == meteor_p);
					if( d != d0 && !f){
						//★曲がり角はインコースに寄る。
						if( d == ( d0 + 2) % 8) a = d + 1; else a = ( d + 7) % 8;
						t = 20 * VX[ a];
						u = 20 * VY[ a];

						x += t;
						y += u;

						if( p == meteor_p_tail + VP[ d0]){
							//★しっぽの先はアウトコースに振られる。
							x0 -= t;
							y0 -= u;
						}
					}

					if( f){
						x = meteor_x;
						y = meteor_y;
					}
					c.translate( x, y);

					if( y == y0){
						if( x0 < x) t = 0.5 * Math.PI; else t = -0.5 * Math.PI;
					} else{
						t = Math.atan( ( x - x0) / ( y0 - y));
						if( y0 < y) t += Math.PI;
					}
					if( f) last_tail_d = t;
					c.rotate( t);

					c.scale(
						//★しっぽの先から遠いほど太くする。
						0.5 + ( heat_map[ meteor_p_tail] - heat_map[ p]) / 5.0,
						//★長さ方向の伸縮。
						Math.sqrt( ( y - y0) * ( y - y0) + ( x - x0) * ( x - x0)) / GRIDW
					);

					if( p == meteor_p_tail + VP[ d0]){
						skc.draw( k_img_tail_end, -32, -12);
					} else{
						skc.draw( k_img_tail, -32, -12);
					}

					c.restore();

					x0 = x;
					y0 = y;
					d0 = d;
				}
			}

			//★流星自体を描画。
			if( in_grab){
				meteor_x = skt.x;
				meteor_y = skt.y;
			} else{
				meteor_x = BX + ( meteor_p % 8 + 0.5) * GRIDW;
				meteor_y = BY + ( Math.floor( meteor_p / 8) + 0.5) * GRIDW;
			}
			skc.alpha( 1);
			skc.draw_centered_scaled_rotated(
				k_img_meteor,
				meteor_x, meteor_y, 1, -state_count * 0.02 * 2 * Math.PI
			);

			if( 0 < last_tail_count){
				//★しっぽが縮みきるのを描画。
				c.save();
				c.translate( meteor_x, meteor_y);
				c.rotate( last_tail_d);
				c.scale( 1, last_tail_count / 20);
				skc.draw( k_img_tail_end, -32, -12);
				c.restore();
			}

			c.globalCompositeOperation = "source-over";

			if( is_tilt) skc.draw(
				//★流星の目 (デバイスの傾きを表す) を描画。
				k_img_core,
				meteor_x + 30 * ACCMAG * ( acc_x - acc_x_std) - 14,
				meteor_y + 30 * ACCMAG * ( acc_y - acc_y_std) - 14
			);
		}

		if( current_state == STATE_CLEAR) draw_clear();

		if( current_state == STATE_WARP || current_state == STATE_CONQUER){
			skc.alpha( 1);
			c.restore();
		}

		if( current_state == STATE_CONQUER){
			//★全ステージクリアの表示を描画。
			if( state_count < FPS) t = 1.0 - 1.0 * state_count / FPS;
			else{
				c.save();
				c.translate( CENTER_X, CENTER_Y);
				if( state_count < 6 * FPS){
					t = 1.0 * ( state_count - FPS) / FPS / 5.0;
					t *= t;
				} else t = 1.0;
				c.scale( t, t);
				skc.alpha( t);
				skc.draw( k_img_conquer, -300, -300);
				c.restore();
				t = 0;
			}
			skc.alpha( t);
		}

		skc.draw( k_img_game, 0, 0);

		if( game_stage < 10) draw_digits( game_stage, 1, 216, 48);
		else draw_digits( game_stage, 2, 216 + 44, 48);

		draw_digits( moves_limit - moves, 1, 516, 48);

		draw_flash();

		if( current_state == STATE_CONQUER) skc.alpha( 1);

		if( current_state == STATE_FAIL) skc.draw( k_img_fail, -64, -42);

		break;

	case STATE_MENU:
		if( 0 < state_end_count) t = 1.0 - 0.5 * state_end_count / ( 0.3 * FPS);
		else if( state_count < 0.3 * FPS) t = 1.0 - 0.5 * state_count / ( 0.3 * FPS);
		else t = 0.5;
		c.save();
		c.translate( CENTER_X, CENTER_Y);
		c.scale( t, t);
		c.translate( -CENTER_X, -CENTER_Y);

		a = 1 + Math.floor( ( MENUW / 2 + menu_x) / MENUW);
		x = -menu_x + ( a - 1) * MENUW;
		if( 1 <= a - 1) draw_cached_map( a - 1, Math.floor( x - MENUW));
		draw_cached_map( a, Math.floor( x));
		if( a + 1 <= MAXSTAGE) draw_cached_map( a + 1, Math.floor( x + MENUW));

		c.restore();

		if( 0 < state_end_count) t = 1.0 * state_end_count / ( 0.3 * FPS);
		else if( state_count < 0.3 * FPS) t = 1.0 * state_count / ( 0.3 * FPS);
		else t = 1.0;
		skc.alpha( t);
		skc.draw( k_img_menu, 0, 0);
		draw_button_sound( REFW - 32 - 160, REFH - 32 - 160);
		skc.alpha( 1);

		if( in_dialogue) skc.draw( k_img_reset, 10, 320);

		break;
	}

	draw_dust();
}

function draw_piece( n, x, y){
	if( n == BLOCK) skc.draw( k_img_block, x + 2, y + 2);
	else if( n == SPHERE) skc.draw( k_img_sphere, x - 20, y - 20);
	else skc.draw( k_img_sphere_3, x - 20, y - 20);
}

function draw_string( x, y, s, m){
	var a, d, i;

	d = 0;
	for( i = 0; i < s.length; i++){
		a = s.charCodeAt( i) - 32;
		skc.draw_partially_scaled( k_img_letters, x + m * d, y - m * 16, a % 16 * 64, Math.floor( a / 16) * 100, 64, 96, m / 8);
		if( " i".indexOf( s.charAt( i)) < 0) d += 8; else d += 4;
	}
}

function draw_button_sound( x, y){
	skc.draw_partially( k_img_sound, x - 20, y - 20, 0, 0, 200, 200);
	if( is_audio){
		skc.draw_partially( k_img_sound, x, y - 10 * Math.sin( Math.PI * ( state_count % 12) / 12), 420, 20, 160, 160);
	} else{
		skc.draw_partially( k_img_sound, x, y, 220, 20, 160, 160);
	}
}

function draw_cached_map( n, dx){
	var i, j, m;
	var c;

	c = skc.ctx;
	c.save();
	c.translate( dx, 0);

	skc.draw( k_img_grid, BX - 8, BY - 8);

	if( n <= solved_stage + 1){
		if( map_cache[ ( n - 1) * 64] < 0){
			set_stage( n);
			for( i = 0; i < 64; i++) map_cache[ ( n - 1) * 64 + i] = map[ i];
			moves_limit_cache[ n - 1] = moves_limit;
		}

		for( i = 0; i < 8; i++){
			for( j = 0; j < 8; j++){
				m = map_cache[ ( n - 1) * 64 + i * 8 + j];
				if( EMPTY < m) draw_piece( m, BX + j * GRIDW, BY + i * GRIDW);
			}
		}

		if( n == focused_stage) skc.draw( k_img_stage_focus, BX - 30, BY - 30);

		skc.draw_partially( k_img_game, 0, 0, 0, 0, REFW, BY);
		draw_digits( moves_limit_cache[ n - 1], 1, 516, 48);
	} else{
		skc.draw_partially( k_img_game, 0, 0, 0, 0, 320, BY);
		skc.draw( k_img_lock, 98, CENTER_Y - 286);
	}

	if( n < 10) draw_digits( n, 1, 216, 48);
	else draw_digits( n, 2, 216 + 44, 48);

	if( n == game_stage) draw_flash();

	if( n == just_cleared_stage) draw_clear();

	c.restore();
}

function draw_clear(){
	if( state_count % 12 < 6) skc.draw( k_img_clear, 320 - 342, CENTER_Y - 122);
}

function draw_digits( n, m, x, y){
	var a, b, i;

	skc.draw_partially( k_img_nums, x, y, 8 + n % 10 * 64, 8, 48, 64);
	a = 10;
	for( i = 1; i < m; i++){
		b = Math.floor( n / a);
		if( 0 < b){
			skc.draw_partially( k_img_nums, x - i * 44, y, 8 + b % 10 * 64, 8, 48, 64);
			a *= 10;
		} else break;
	}
}
