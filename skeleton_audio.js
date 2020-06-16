
//◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍
//★下記の外部の変数を参照します。(外部での宣言が必要です。)

//AUDIONUM

//◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍

class skeleton_audio{

constructor( ){
	this.ac;
	this.did_ios_start;
	this.count, this.loaded_count; //★int
	this.ab = new Array( AUDIONUM); //★array of AudioBuffer
	this.abs_node = new Array( AUDIONUM); //★array of AudioBufferSourceNode
	this.gain_node = new Array( AUDIONUM);
	this.try_count = new Int32Array( AUDIONUM);
	this.pitch = new Float32Array( AUDIONUM);

//◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍

	var i;

	this.did_ios_start = false;
	this.ac = new( window.AudioContext || window.webkitAudioContext);
	this.count = this.loaded_count = 0;

	for( i = 0; i < AUDIONUM; i++){
		this.gain_node[ i] = this.ac.createGain();
		this.gain_node[ i].gain.value = 1.0;
		this.gain_node[ i].connect( this.ac.destination);
	}
}

load_base_64( a){
	var j, l, n;
	var s;
	var b;

	n = this.count++;

	s = atob( a);
	l = s.length;
	b = new Uint8Array( l);
	for( j = 0; j < l; j++) b[ j] = s.charCodeAt( j);

	var that = this;
	this.ac.decodeAudioData(
		b.buffer,
		function( buf){
			that.ab[ n] = buf;
			that.loaded_count++;
		},
		function(){ console.log( "err dec snd " + n);}
	);

	this.pitch[ n] = 1.0;

	return n;
}

load( s){
	var a;
	var n;
	var r;
	var res;

	n = this.count++;

	r = new XMLHttpRequest();

	r.onreadystatechange = function(){
		a = r.readyState;
		//console.log( "snd " + n + " : rs " + a);
		if( a == 4){ //★4 は完了を表す。 (成功でも失敗でも。)
			a = r.status;
			res = r.response;
			//console.log( "snd " + n + " : status " + a);
			if( ( a == 0 || a == 200) && res){ //★0 はオフライン、200 は成功を表す。
				//console.log( "snd " + n + " : res " + res);
				this.ac.decodeAudioData(
					res,
					function onSuccess( buf){
						this.ab[ n] = buf; //★that 方式にしなくていいのか。
						this.loaded_count++; //★that 方式にしなくていいのか。
					},
					function onFailure(){ console.log( "err dec snd " + n);}
				);
			} else{
				this.try_count[ n]++;
				console.log( "err snd " + n + " (" + this.try_count[ n] + ")");
				if( this.try_count[ n] < 5) setTimeout( lda, 500);
			}
		}
	};

	this.try_count[ n] = 0;
	this.pitch[ n] = 1.0;

	lda();

	return n;

	function lda(){
		try{
			r.open( "GET", s, true);
			r.responseType = "arraybuffer";
			r.send();
		} catch( e){}
	}
}

set_pitch( n, v){
	this.pitch[ n] = v;
}

set_volume( n, v){
	this.gain_node[ n].gain.value = v;
}

play( n){
	if( !this.ac || !this.ab[ n]) return;

	if( this.abs_node[ n]) this.abs_node[ n].stop( 0);

	this.abs_node[ n] = this.ac.createBufferSource();
	this.abs_node[ n].buffer = this.ab[ n];
	this.abs_node[ n].playbackRate.value = this.pitch[ n];
	//this.abs_node[ n].connect( this.ac.destination);
	this.abs_node[ n].connect( this.gain_node[ n]);
	this.abs_node[ n].start( 0);
}

play_loop( n){
	if( !this.ac || !this.ab[ n]) return;

	if( this.abs_node[ n]) this.abs_node[ n].stop( 0);

	this.abs_node[ n] = this.ac.createBufferSource();
	this.abs_node[ n].buffer = this.ab[ n];
	this.abs_node[ n].loop = true;
	//this.abs_node[ n].connect( this.ac.destination);
	this.abs_node[ n].connect( this.gain_node[ n]);
	this.abs_node[ n].start( 0);
}

stop( n){
	if( !this.ac || !this.ab[ n]) return;

	if( this.abs_node[ n]){
		this.abs_node[ n].stop( 0);
		this.abs_node[ n] = undefined;
	}
}

start_ios(){
	//★iOS 対応。
	this.did_ios_start = true;
	this.ac.createBufferSource().start( 0);
}

}
