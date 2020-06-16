
//◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍
//★下記の外部の変数を参照します。(外部での宣言が必要です。)

//REFW, REFH
//MAXWIDTH //★-1 にすると、サイズ制限しない。

//IMAGENUM

//DPR

//◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍

class skeleton_canvas{

constructor( c){
	this.can;
	this.ctx;

	this.mag, this.orientation;

	this.count, this.loaded_count; //★int
	this.img = new Array( IMAGENUM); //★array of image
	this.try_count = new Array( IMAGENUM); //★array of int

	//◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍

	this.can = c;
	this.ctx = c.getContext( "2d");

	this.mag = 0;
	this.orientation = 0;

	this.count = this.loaded_count = 0;
}

set_mag_and_orientation( m, o){
	var t, w, h;

	this.mag = m;
	this.orientation = o;

	w = Math.floor( m * REFW);
	h = Math.floor( m * REFH);
	if( o % 180 == 90){ t = w; w = h; h = t;}

	this.can.width = DPR * w;
	this.can.height = DPR * h;
	this.can.style.width = w + 'px';
	this.can.style.height = h + 'px';
}

pre(){
	var m;

	m = DPR * this.mag;

	this.ctx.save();
	this.ctx.translate( this.can.width / 2, this.can.height / 2);
	this.ctx.scale( m, m);
	this.ctx.rotate( this.orientation * 2 * Math.PI / 360);
	this.ctx.translate( -REFW / 2, -REFH / 2);
}

post(){
	this.ctx.restore();
}

load( s){
	var n;
	var that;

	n = this.count++;

	this.img[ n] = new Image();

	that = this;

	this.img[ n].onerror = function(){
		that.try_count[ n]++;
		console.log( "err img " + n + " (" + that.try_count[ n] + ")");
		if( that.try_count[ n] < 5) setTimeout( ld, 500);
	};

	this.img[ n].onload = function(){ that.loaded_count++;};

	this.try_count[ n] = 0;

	var that = this;
	ld();

	return n;

	function ld(){
		that.img[ n].src = s;
	}
}

blend( s){ this.ctx.globalCompositeOperation = s;}

alpha( v){ this.ctx.globalAlpha = v;}

draw( n, x, y){
	var i = this.img[ n];

	if( !i.complete) return;

	this.ctx.drawImage( i, x, y);
}

draw_scaled( n, x, y, s){
	var w, h;
	var i = this.img[ n];

	if( !i.complete) return;

	w = i.naturalWidth;
	h = i.naturalHeight;

	this.ctx.drawImage( i, x, y, s * w, s * h);
}

draw_part_to_part( n, x, y, w, h, sx, sy, sw, sh){
	this.ctx.drawImage( this.img[ n], sx, sy, sw, sh, x, y, w, h);
}

draw_mirrored( n, x, y){
	var w, h;
	var i = this.img[ n];
	var c;

	if( !i.complete) return;

	w = i.naturalWidth;
	h = i.naturalHeight;

	c = this.ctx;
	c.save();
	c.translate( x + w / 2, y + h / 2);
	c.transform( -1, 0, 0, 1, 1, 1);
	c.drawImage( i, -w / 2, -h / 2);
	c.restore();
}

draw_mirrored_centered( n, x, y){ this.draw_mirrored_centered_scaled_rotated( n, x, y, 1, 0);}
draw_mirrored_centered_scaled( n, x, y, s){ this.draw_mirrored_centered_scaled_rotated( n, x, y, s, 0);}
draw_mirrored_centered_scaled_rotated( n, x, y, s, r){
	var w, h;
	var i = this.img[ n];
	var c;

	if( !i.complete) return;

	w = i.naturalWidth;
	h = i.naturalHeight;

	c = this.ctx;
	c.save();
	c.translate( x, y);
	c.transform( -1, 0, 0, 1, 1, 1);
	c.scale( s, s);
	c.rotate( r);
	c.drawImage( i, -w / 2, -h / 2);
	c.restore();
}

draw_centered( n, x, y){ this.draw_centered_scaled_rotated( n, x, y, 1, 0);}
draw_centered_scaled( n, x, y, s){ this.draw_centered_scaled_rotated( n, x, y, s, 0);}
draw_centered_rotated( n, x, y, r){ this.draw_centered_scaled_rotated( n, x, y, 1, r);}
draw_centered_scaled_rotated( n, x, y, s, r){
	var i = this.img[ n];
	var c;

	if( ! i.complete) return;

	c = this.ctx;
	c.save();
	c.translate( x, y);
	c.scale( s, s);
	c.rotate( r);
	c.drawImage( i, -i.naturalWidth / 2, -i.naturalHeight / 2);
	c.restore();
}

draw_partially( n, x, y, sx, sy, sw, sh){ this.draw_partially_scaled( n, x, y, sx, sy, sw, sh, 1.0);}
draw_partially_scaled( n, x, y, sx, sy, sw, sh, s){
	var i = this.img[ n];

	if( !i.complete) return;

	this.ctx.drawImage( i, sx, sy, sw, sh, x, y, s * sw, s * sh);
}
/*
drawImagePartiallyCentered( n, x, y, sx, sy, sw, sh){
  drawImagePartiallyCenteredScaledRotated( n, x, y, sx, sy, sw, sh, 1, 0);
}
drawImagePartiallyCenteredScaled( n, x, y, sx, sy, sw, sh, s){
  drawImagePartiallyCenteredScaledRotated( n, x, y, sx, sy, sw, sh, s, 0);
}
*/
draw_partially_centered_scaled_rotated( n, x, y, sx, sy, sw, sh, s, r){
	var i = this.img[ n];
	var c;

	if( !i.complete) return;

	c = this.ctx;
	c.save();
	c.translate( x, y);
	c.rotate( r);
	c.scale( s, s);
	c.drawImage( i, sx, sy, sw, sh, -sw / 2, -sh / 2, sw, sh);
	c.restore();
}

draw_tinted_partially( n, x, y, sx, sy, sw, sh, c){
	this.draw_tinted_partially_scaled( n, x, y, sx, sy, sw, sh, 1, c);
}
draw_tinted_partially_scaled( n, x, y, sx, sy, sw, sh, m, c){
	var w, h;
	var can2;
	var ctx2;

	if( !this.img[ n].complete) return;

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
	ctx2.drawImage( this.img[ n], sx, sy, sw, sh, 0, 0, w, h);
	this.ctx.drawImage( can2, 0, 0, w, h, x, y, w, h);
}/*
drawTintedImagePartiallyCenteredScaled( n, x, y, sx, sy, sw, sh, s, c){
  drawTintedImagePartiallyCenteredScaledRotated( n, x, y, sx, sy, sw, sh, s, 0, c);
}
drawTintedImagePartiallyCenteredScaledRotated( n, x, y, sx, sy, sw, sh, s, r, c){
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

drawTintedImageCenteredScaled( n, x, y, s, c){
  drawTintedImageCenteredScaledRotated( n, x, y, s, 0, c);
}
drawTintedImageCenteredScaledRotated( n, x, y, s, r, c){
  var sw, sh;

  sw = img[ n].naturalWidth;
  sh = img[ n].naturalHeight;

  if( !img[ n].complete) return;

  drawTintedImagePartiallyCenteredScaledRotated( n, x, y, 0, 0, sw, sh, s, r, c);
}

//◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍
*/
set_fill_color( c){
	this.ctx.fillStyle = "#" + ( "00000" + c.toString( 16)).substr( -6);
}

set_draw_color( c){
	this.ctx.strokeStyle = "#" + ( "00000" + c.toString( 16)).substr( -6);
}

fill_rect_color( x, y, w, h, c){
	this.set_fill_color( c);
	this.ctx.fillRect( x, y, w, h);
}

draw_round_rect( x, y, w, h, r){ this.prr( x, y, w, h, r); this.ctx.closePath(); this.ctx.stroke();}
fill_round_rect( x, y, w, h, r){ this.prr( x, y, w, h, r); this.ctx.fill();}
prr( x, y, w, h, r){
	this.ctx.beginPath();
	this.ctx.arc( x + w - r, y + r, r, 0, 1.5 * Math.PI, true);
	this.ctx.arc( x + r, y + r, r, 1.5 * Math.PI, Math.PI, true);
	this.ctx.arc( x + r, y + h - r, r, Math.PI, 0.5 * Math.PI, true);
	this.ctx.arc( x + w - r, y + h - r, r, 0.5 * Math.PI, 0, true);
}

fill_circle( x, y, r){
	this.ctx.beginPath();
	this.ctx.arc( x, y, r, 0, 2 * Math.PI, true);
	this.ctx.fill();
}

draw_circle( x, y, r){
	this.ctx.beginPath();
	this.ctx.arc( x, y, r, 0, 2 * Math.PI, true);
	this.ctx.closePath();
	this.ctx.stroke();
}
/*
fillOval( x, y, rw, rh){
  ctx.save();
  ctx.translate( x, y);
  ctx.scale( 1, rh / rw);
  ctx.beginPath();
  ctx.arc( 0, 0, rw, 0, 2 * Math.PI, true);
  ctx.fill();
  ctx.restore();
}
*/
draw_line( x, y, x2, y2){
	var c = this.ctx;

	c.beginPath();
	c.moveTo( x, y);
	c.lineTo( x2, y2);
	c.stroke();
}
/*
drawLineColorWidth( x0, y0, x, y, c, w){
  ctx.strokeStyle = "#" + ( "00000" + c.toString( 16)).substr( -6);
  ctx.lineWidth = w;
  ctx.beginPath();
  ctx.moveTo( x0, y0);
  ctx.lineTo( x, y);
  ctx.stroke();
}

drawStringSizeColor( x, y, s, p, c){
  ctx.fillStyle = "#" + ( "00000" + c.toString( 16)).substr( -6);
  ctx.font = "" + p + "pt 'Arial'";
  ctx.textAlign = "left";
  ctx.fillText( s, x, y);
}
*/
}
