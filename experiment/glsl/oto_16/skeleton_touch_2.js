
//★ skeleton_touch_2.js

//★ 前バージョンとの違い。
//★ can_ios_audio_start 追加。
//★ touchstart や mousedown 等を消して、pointerdown 等だけにした。

//★ 必要なグローバル変数。
//★ REFW, REFH
//★ CAN_PINCH
//★ touch_event_hook() ★ ← グローバル関数。無くても大丈夫。

'use strict';

class skeleton_touch{

constructor( c){
	this.mag;
	this.orientation;

	this.NOID = -1, this.MOUSEID = -2, this.PINCHMOUSEID = -3;

	this.ids = new Array( MAXTOUCH);

	this.xs = new Array( MAXTOUCH), this.ys = new Array( MAXTOUCH);
	this.bxs = new Array( MAXTOUCH), this.bys = new Array( MAXTOUCH);
	this.vxs = new Array( MAXTOUCH), this.vys = new Array( MAXTOUCH);

	this.ins = new Array( MAXTOUCH);
	this.starts = new Array( MAXTOUCH);
	this.ends = new Array( MAXTOUCH);
	this.outs = new Array( MAXTOUCH);

	this.ons = new Array( MAXTOUCH);
	this.latest_touch = 0;
	this.latest_mouse = 0;

	this.index;
	this.num;
	this.on;
	this.start;
	this.end;
	this.x, this.y;
	this.vx, this.vy;
	this.bx, this.by;

	this.can_ios_audio_start;

	this.ret_x, this.ret_y;

	//◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍

	let f;

	this.reset();

	f = false;

	c.addEventListener( "pointerover", eve_touch_in.bind( this), f);
	c.addEventListener( "pointerdown", eve_touch_start.bind( this), f);
	c.addEventListener( "pointermove", eve_touch_move.bind( this), f);
	c.addEventListener( "pointerup", eve_touch_end.bind( this), f);
	c.addEventListener( "pointerleave", eve_touch_out.bind( this), f);

	if( CAN_PINCH){
		let that = this;

		document.addEventListener( "keydown", function( e){
			let i;

			if( e.key == "Shift"){
				for( i = 0; i < MAXTOUCH; i++){
					if( that.ids[ i] == that.MOUSEID){
						that.my_touch_in.bind( that)(
							that.PINCHMOUSEID,
							that.mag * ( REFW - that.xs[ i]),
							that.mag * ( REFH - that.ys[ i])
						);
						break;
					}
				}
			}
		});

		document.addEventListener( "keyup", function( e){
			let i;

			if( e.key == "Shift"){
				for( i = 0; i < MAXTOUCH; i++){
					if( that.ids[ i] == that.PINCHMOUSEID){
						that.my_touch_out.bind( that)( that.PINCHMOUSEID);
						break;
					}
				}
			}
		});
	}

//◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍

	function eve_touch_in( e){
		let x, y;

		e.preventDefault();
		//e.stopPropagation();

		const r = e.target.getBoundingClientRect();
		x = r.left;
		y = r.top;

		x = e.clientX - x;
		y = e.clientY - y;
		if( e.pointerType == "mouse"){
			this.my_touch_in.bind( this)( this.MOUSEID, x, y);
			if( CAN_PINCH && e.shiftKey){
				this.my_touch_in.bind( this)( this.PINCHMOUSEID, this.mag * REFW - x, this.mag * REFH - y);
			}
		} else this.my_touch_in.bind( this)( e.pointerId, x, y);

		//return false;
	}

	function eve_touch_start( e){
		let x, y;

		e.preventDefault();
		//e.stopPropagation();

		//★ 複数同時タッチの touchstart で生成した AudioContext は音が出ない。
		//★ ここに来た時点では、複数同時タッチであることを判定する手段がないし、
		//★ 生成した AudioContext から音が出ているか判定する手段もないので、
		//★ 確実に音を出すためには、やはり、touchstart ではなく touchend で AudioContext を生成するしかない。
		//if( typeof touch_event_hook == "function") touch_event_hook( e);

		const r = e.target.getBoundingClientRect();
		x = r.left;
		y = r.top;

		x = e.clientX - x;
		y = e.clientY - y;
		if( e.pointerType == "mouse"){
			this.my_touch_start.bind( this)( this.MOUSEID, x, y);
			if( CAN_PINCH && e.shiftKey){
				this.my_touch_start.bind( this)( this.PINCHMOUSEID, this.mag * REFW - x, this.mag * REFH - y);
			}
		} else this.my_touch_start.bind( this)( e.pointerId, x, y);

		//return false;
	}

	function eve_touch_move( e){
		let x, y;

		e.preventDefault();
		//e.stopPropagation();

		const r = e.target.getBoundingClientRect();
		x = r.left;
		y = r.top;

		x = e.clientX - x;
		y = e.clientY - y;
		if( e.pointerType == "mouse"){
			this.my_touch_moved.bind( this)( this.MOUSEID, x, y);
			if( CAN_PINCH && e.shiftKey){
			this.my_touch_moved.bind( this)( this.PINCHMOUSEID, this.mag * REFW - x, this.mag * REFH - y);
			}
		} else this.my_touch_moved.bind( this)( e.pointerId, x, y);

		//return false;
	}

	function eve_touch_end( e){
		let i;
		let t;

		e.preventDefault();
		//e.stopPropagation();

		//★ iOS でダブルタップして指を離さなかった時、
		//★ 指で隠れている部分を見る窓が出て、
		//★ そのまま canvas の中にドラッグして指を離した場合、
		//★ this.num が 0 でここに来る。その場合、再生開始できない。
		if( typeof touch_event_hook == "function"){
			if( this.num != 1) this.can_ios_audio_start = false;
			touch_event_hook( e);
		}

		if( e.touches && e.touches.length == 0){
			//★ 不正なトラッキングが残っていたら消す。
			// (タッチデバイスなのに、MOUSEID が残ってしまう場合があるから。)
			// (canvas 外でダブルタップして、ルーペ機能が出た時に？
			// window.touches が undefined になって、タッチデバイスなのに MOUSEID が残る？)
			for( i = 0; i < e.changedTouches.length; i++){
				t = e.changedTouches[ i];
				this.my_touch_ended.bind( this)( t.identifier);
			}
			for( i = 0; i < MAXTOUCH; i++) if( this.ids[ i] != this.NOID && !this.ends[ i]) this.ids[ i] = this.NOID;
			return;//★抜ける。
		}

		if( e.pointerType == "mouse"){
			this.my_touch_ended.bind( this)( this.MOUSEID);
			if( CAN_PINCH && e.shiftKey) this.my_touch_ended( this.PINCHMOUSEID);
		} else this.my_touch_ended.bind( this)( e.pointerId);

		//return false;
	}

	function eve_touch_out( e){

		e.preventDefault();
		//e.stopPropagation();

		if( e.pointerType == "mouse"){
			this.my_touch_out.bind( this)( this.MOUSEID);
			if( CAN_PINCH && e.shiftKey) this.my_touch_out.bind( this)( this.PINCHMOUSEID);
		} else this.my_touch_out.bind( this)( e.pointerId);

		//return false;
	}

}

//◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍

adjust_coordinates( x0, y0){
	let x, y;

	x = x0 / this.mag;
	y = y0 / this.mag;

	switch( this.orientation){
	case 0:
		this.ret_x = x;
		this.ret_y = y;
		break;

	case 90:
		this.ret_x = y;
		this.ret_y = REFH - x;
		break;

	case 180:
		this.ret_x = REFW - x;
		this.ret_y = REFH - y;
		break;

	case 270:
		this.ret_x = REFW - y;
		this.ret_y = x;
		break;
	}
}

my_touch_in( n, x, y){
	let i;

	this.adjust_coordinates.bind( this)( x, y);

	for( i = 0; i < MAXTOUCH; i++) if( this.ids[ i] == this.NOID){
		this.ids[ i] = n;

		this.xs[ i] = this.bxs[ i] = this.ret_x;
		this.ys[ i] = this.bys[ i] = this.ret_y;
		this.vxs[ i] = this.vys[ i] = 0;

		this.ins[ i] = true;
		this.starts[ i] = false;
		this.ends[ i] = false;
		this.outs[ i] = false;
		break;
	}
}

my_touch_start( n, x, y){
	this.adjust_coordinates.bind( this)( x, y);
	this.my_touch_start_direct( n, this.ret_x, this.ret_y);
}

my_touch_start_direct( n, x, y){
	let i;

	for( i = 0; i < MAXTOUCH; i++) if( this.ids[ i] == n) break;

	if( i == MAXTOUCH) for( i = 0; i < MAXTOUCH; i++) if( this.ids[ i] == this.NOID) break;

	if( i < MAXTOUCH){
		this.ids[ i] = n;

		this.xs[ i] = this.bxs[ i] = x;
		this.ys[ i] = this.bys[ i] = y;
		this.vxs[ i] = this.vys[ i] = 0;

		if( n != this.MOUSEID && n != this.PINCHMOUSEID) this.ins[ i] = true;
		this.starts[ i] = true;
		this.ends[ i] = false;
		this.outs[ i] = false;
	}
}

my_touch_moved( n, x, y){
	this.adjust_coordinates.bind( this)( x, y);
	this.my_touch_moved_direct( n, this.ret_x, this.ret_y);
}

my_touch_moved_direct( n, x, y){
	let i;

	if( x < 0 || REFW <= x || y < 0 || REFH <= y){ this.my_touch_out.bind( this)( n); return;}

	for( i = 0; i < MAXTOUCH; i++) if( this.ids[ i] == n) break;

	if( i == MAXTOUCH && n == this.MOUSEID) for( i = 0; i < MAXTOUCH; i++) if( this.ids[ i] == this.NOID){
		this.ids[ i] = n;

		this.xs[ i] = this.bxs[ i] = x;
		this.ys[ i] = this.bys[ i] = y;

		this.ins[ i] = true;
		this.starts[ i] = false;
		this.ends[ i] = false;
		this.outs[ i] = false;

		break;
	}

	if( i < MAXTOUCH){
		this.vxs[ i] += x - this.xs[ i];
		this.vys[ i] += y - this.ys[ i];

		this.xs[ i] = x;
		this.ys[ i] = y;
	}
}

my_touch_ended( n){
	let i;

	for( i = 0; i < MAXTOUCH; i++) if( this.ids[ i] == n){
		this.ends[ i] = true;
		break;
	}
}

my_touch_out( n){
	let i;

	for( i = 0; i < MAXTOUCH; i++) if( this.ids[ i] == n){
		this.outs[ i] = true;
		break;
	}
}

//◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍

reset(){
	let i;

	this.start = this.on = false;

	for( i = 0; i < MAXTOUCH; i++) this.ids[ i] = this.NOID;
}

set_mag_and_orientation( m, o){ this.mag = m; this.orientation = o;}

pre(){
	let i;

	for( i = 0; i < MAXTOUCH; i++) if( this.ids[ i] != this.NOID){
		if( this.ins[ i]) this.ons[ i] = false;
		if( this.starts[ i]) this.ons[ i] = true;
	}

	this.start = this.end = false;
	if( this.on){
		i = this.index;
		if( this.ids[ i] == this.NOID || this.ends[ i] || this.outs[ i]){
			//★ on の終わり。
			this.end = true;
			this.on = false;
		} else{
			//★ on を継続。
			if( this.x != this.xs[ i] || this.y != this.ys[ i]) this.can_ios_audio_start = false;

			this.x = this.xs[ i];
			this.y = this.ys[ i];

			this.vx = this.vxs[ i];
			this.vy = this.vys[ i];
		}
	} else{
		for( i = 0; i < MAXTOUCH; i++) if( this.ids[ i] != this.NOID && this.starts[ i]){
			//★ on の始まり。
			this.index = i;
			this.start = this.on = true;
			this.x = this.bx = this.xs[ i];
			this.y = this.by = this.ys[ i];
			this.vx = this.vy = 0;
			break;
		}
	}

	this.num = 0;
	for( i = 0; i < MAXTOUCH; i++) if( this.ids[ i] != this.NOID && this.ons[ i]) this.num++;

	if( this.num == 0) this.can_ios_audio_start = true;
	else if( 1 < this.num) this.can_ios_audio_start = false;
}

post(){
	let i;

	for( i = 0; i < MAXTOUCH; i++) if( this.ids[ i] != this.NOID){
		this.ins[ i] = false;
		this.starts[ i] = false;
		this.vxs[ i] = this.vys[ i] = 0;

		if( this.outs[ i]) this.ids[ i] = this.NOID;
		else if( this.ends[ i]){
			if( this.ids[ i] == this.MOUSEID || this.ids[ i] == this.PINCHMOUSEID){
				//★マウスはアップしても要素の中であれば追跡を続ける。
				this.ons[ i] = false;
				this.ends[ i] = false;
			} else{
				this.ids[ i] = this.NOID;
			}
		}
	}
}

}
