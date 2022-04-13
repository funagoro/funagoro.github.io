

//◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍
//★下記の外部の変数を参照します。(外部での宣言が必要です。)

//REFW, REFH
//MAXWIDTH //★-1 にすると、サイズ制限しない。
//mypadding, myorientation //★mypadding を -1 にすると、伸縮なしで REFW・REFH どおりのサイズで固定。

//IMAGENUM, AUDIONUM

//touch_event_hook() ★これは無くてもよい。

//◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍

var current_mag, target_mag, latest_mag;
var latest_myorientation;

var fps_copy;
var timer_id;
var latest_timer = 0;

//◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍

function skeleton(){
	set_target_mag();
	current_mag = target_mag;
	latest_mag = 0;
	latest_myorientation = -1;
}

//◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍

function set_target_mag(){
	var w, h, t, u;

	if( mypadding < 0) t = 1;
	else{
		w = document.documentElement.clientWidth;
		//h = document.documentElement.clientHeight;
		h = window.innerHeight;
		if( myorientation % 180 == 90){ t = w; w = h; h = t;}

		t = 2 * mypadding;

		u = 64 + t;
		if( w < u) w = u;
		if( h < u) h = u;

		if( 0 <= MAXWIDTH){
			u = MAXWIDTH + t;
			if( u < w) w = u;
		}

		if( ( h - t) / ( w - t) < REFH / REFW) t = ( h - t) / REFH;
		else t = ( w - t) / REFW;
	}
	target_mag = t;
}

function set_fps( n){
	fps_copy = n;
	timer_id = requestAnimationFrame( on_timer);
}

function on_timer(){
	var t;
	var d;

	timer_id = requestAnimationFrame( on_timer);
	d = Date.now();
	if( Math.floor( d * fps_copy / 1000) == Math.floor( latest_timer * fps_copy / 1000)) return;
	latest_timer = d;

	set_target_mag();
	current_mag = target_mag; //★この行をコメントアウトすると、じわじわ伸縮するようになる。

	t = target_mag - current_mag;
	if( t != 0){
		if( -0.01 < t && t < 0.01) current_mag = target_mag;
		else current_mag += 0.1 * t;
	}

	main();

	latest_mag = current_mag;
	latest_myorientation = myorientation;
}
