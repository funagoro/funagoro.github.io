//ガワネイティブに組込む時は、requiresUserActionForMediaPlayback = false が効いているようなら、最初のタッチ画面をスキップ
//mypadding 調整

var BUILD_BROWSER = 0, BUILD_IOS = 1, BUILD_ANDROID = 2;
var build = BUILD_BROWSER;
//var build = BUILD_IOS;
//var build = BUILD_ANDROID;

var MYSTORAGE = "gsw_";

var FPS = 24;

//●==========●==========●==========●==========●==========●==========●
//★skeleton_2.js から参照されるもの。

var REFW = 320, REFH = 460;
var MAXWIDTH = 640;
var mypadding = 30;
var myorientation = 0;

var MAXTOUCH = 1;
var CAN_PINCH = false;

var IMAGENUM = 26;
var AUDIONUM = 23;

//var dpr = window.devicePixelRatio; //★retina 対応。2017年時点のマシンには負担が大きすぎ。
var dpr = 1;

function touchEventHook(){
	var v;

init_acc();

	if( initCount == 4){
		initCount++;

		//init_acc();

		if( isAudio){
			if( currentState == MENU) v = 0.4; else v = 1;
			setAudioVolume( kAudBGMGame, v);
			gswPlayAudio( -1);
		}
	}
}

//●==========●==========●==========●==========●==========●==========●

var BX = 8;
var BY = 78;
var GRIDW = 38;
var CENTERX = ( BX + 4 * GRIDW);
var CENTERY = ( BY + 4 * GRIDW);
var MENUW = 370;
var MAXSTAGE = 38;
var MAXMOVES = 9; //★全ステージ中で最大の手数。

var VX = [ 0, 1, 1, 1, 0, -1, -1, -1];
var VY = [ -1, -1, 0, 1, 1, 1, 0, -1];
var VP = [ -8, -7, 1, 9, 8, 7, -1, -9];

var EMPTY = 0, BLOCK = 1, SPHERE = 2, SPHERE3 = 3;

//●==========●==========●==========●==========●==========●==========●

var kImgLoading;
var kImgBG
var kImgTitle, kImgTilt, kImgSound, kImgStars;
var kImgMenu, kImgReset, kImgHowTo, kImgOK;
var kImgGame, kImgGrid, kImgNums, kImgFail;
var kImgStageFocus, kImgLock, kImgClear, kImgClearAll;
var kImgBlock, kImgSphere, kImgSphere3;
var kImgMeteor, kImgCore, kImgTail, kImgTailEnd;
var kImgLetters;

var kAudBGMTitle, kAudBGMGame;
var kAudClear, kAudClearAll;
var kAudComet; //★1〜7
var kAudHit;  //★1〜2
var kAudMove;  //★1〜8
var kAudRewind, kAudStart;

var audioBase64 = new Array( AUDIONUM);

//●==========●==========●==========●==========●==========●==========●

var DEFAULT = 0, TITLE = 1, HOWTO = 2, MENU = 3;
var GAME_START = 4, GAME = 5, REWIND = 6, FAIL = 7;
var CLEAR = 8, CLEAR_ALL = 9;

var FIRST_SILENCE = 3 * FPS;

var WAITING = 0, MOVING = 1;

//●==========●==========●==========●==========●==========●==========●

var initCount;

var currentState, nextState, stateCount, stateEndCount;
var inGameState;
var isAudio, isTilt;

var map = new Int32Array( 2 * 64);

var gameStage, gameStageSolved, gameStageJustCleared;
var moves, movesLimit, movesRecord = new Int32Array( MAXMOVES);

var meteorP, meteorPTail;
var movingD, movingCount, movingP, movingOff, movingSpeed;
var menuX, menuVX;
var inDialogue;

//●==========●==========●==========●==========●==========●==========●

var ACCMAG = 0.3;
var accXStd, accYStd;

var mapCache = new Int32Array( MAXSTAGE * 64);
var movesLimitCache = new Int32Array( MAXSTAGE);

//●==========●==========●==========●==========●==========●==========●

var inGrab = false;
var gameStageFocused;

//●==========●==========●==========●==========●==========●==========●

var MAXSTARNUM = 100;
var starN = new Int32Array( MAXSTARNUM);
var starD = new Int32Array( MAXSTARNUM);
var starZ = new Int32Array( MAXSTARNUM), starVZ = new Int32Array( MAXSTARNUM);
var starR = new Int32Array( MAXSTARNUM), starVR = new Int32Array( MAXSTARNUM);

var MAXDUSTNUM = 100;
var dustCount, dustCenterD;
var dustN = new Int32Array( MAXDUSTNUM);
var dustX = new Float32Array( MAXDUSTNUM), dustY = new Float32Array( MAXDUSTNUM);
var dustD = new Float32Array( MAXDUSTNUM), dustV = new Float32Array( MAXDUSTNUM);

//●==========●==========●==========●==========●==========●==========●

function onMyorientation(){ myorientation = ( myorientation + 90) % 360;}
//function onMyorientation(){ init_acc();}

function gswPlayAudio( n){
	if( isAudio){
		if( n < 2){
			//★BGM を再生。
			if( currentState == TITLE) playAudioLoop( kAudBGMTitle);
			else playAudioLoop( kAudBGMGame);
		} else{
			//★効果音を再生。
			if( n == kAudComet) playAudio( n + Math.floor( Math.random() * 7));
			else if( n == kAudHit) playAudio( n + Math.floor( Math.random() * 2));
			else if( n == kAudMove) playAudio( n + Math.floor( Math.random() * 8));
			else playAudio( n);
		}
	}
}

//●==========●==========●==========●==========●==========●==========●

function myonload(){
	var i;

	if( build == BUILD_BROWSER){
		if( screen.orientation) screen.orientation.lock( 'portrait').catch( function(){});
		//★Chrome で確認。
	} else if( build == BUILD_IOS){
		MAXWIDTH = -1;
		if ( 0 < navigator.userAgent.indexOf( "iPhone")){ myorientation = 0; mypadding = 0;}
	} else if( build == BUILD_ANDROID){
		MAXWIDTH = -1;
		mypadding = 0;
	}

	skeleton( document.getElementById( 'canvas1'));

	initCount = 0;

	gameStageFocused = 0;

	for( i = 0; i < MAXSTARNUM; i++) starN[ i] = -1;

	for( i = 0; i < MAXDUSTNUM; i++) dustN[ i] = -1;
	dustCount = 0;

	for( i = 0; i < MAXSTAGE; i++) mapCache[ i * 64] = -1;

	setFPS( FPS);
}

//onpagehide = function(){
//	stopAudio( kAudBGMTitle);
//	stopAudio( kAudBGMGame);
//};

//●==========●==========●==========●==========●==========●==========●

function main(){
	var i, n;
	var t;

	if( initCount == 5){
		resetTouches();

		initCount = -1;
	}

	if( initCount < 0){
		//★通常ループ。
		if( currentState != nextState){
			currentState = nextState;
			stateCount = stateEndCount = 0;
			resetTouches();
			if( currentState == TITLE || currentState == MENU) saveStorage();
		}

		processStars();

		processDust();

		if( touch) processTouchBegan();

		processMain();

		drawMain();

	} else if( loadedCount < 1){
		//★起動して最初、表示なし。
		if( initCount == 0){
			kImgLoading = li( "loading");
			initCount++;
		}
	} else{
		//★ロード中の画面。
		if( initCount == 1){
			kImgBG = li( "bg");
			kImgTitle = li( "title");
			kImgTilt = li( "tilt");
			kImgSound = li( "sound");
			kImgStars = li( "stars");
			kImgMenu = li( "menu");
			kImgReset = li( "reset");
			kImgHowTo = li( "howto");
			kImgOK = li( "ok");
			kImgGame = li( "game");
			kImgGrid = li( "grid");
			kImgNums = li( "nums");
			kImgFail = li( "fail");
			kImgStageFocus = li( "stage_focus");
			kImgLock = li( "lock");
			kImgClear = li( "clear");
			kImgClearAll = li( "clear_all");
			kImgBlock = li( "block");
			kImgSphere = li( "sphere");
			kImgSphere3 = li( "sphere_3");
			kImgMeteor = li( "meteor");
			kImgCore = li( "core");
			kImgTail = li( "tail");
			kImgTailEnd = li( "tail_end");
			kImgLetters = li( "letters");

			initCount++;
			stateCount = 0;
		}

		n = 0; for( i = 0; i < AUDIONUM; i++) if( audioBase64[ i]) n++;

		if( initCount == 2 && n == AUDIONUM){
			kAudBGMTitle = loadAudioBase64( 0);
			kAudBGMGame = loadAudioBase64( 1);
			kAudClear = loadAudioBase64( 2);
			kAudClearAll = loadAudioBase64( 3);

			kAudComet = loadAudioBase64( 4);
			loadAudioBase64( 5);
			loadAudioBase64( 6);
			loadAudioBase64( 7);
			loadAudioBase64( 8);
			loadAudioBase64( 9);
			loadAudioBase64( 10);

			kAudHit = loadAudioBase64( 11);
			loadAudioBase64( 12);

			kAudMove = loadAudioBase64( 13);
			loadAudioBase64( 14);
			loadAudioBase64( 15);
			loadAudioBase64( 16);
			loadAudioBase64( 17);
			loadAudioBase64( 18);
			loadAudioBase64( 19);
			loadAudioBase64( 20);

			kAudRewind = loadAudioBase64( 21);
			kAudStart = loadAudioBase64( 22);

			initCount++;
		}

		gswDrawImage( kImgLoading, 0, 0);

		t = ( n + loadedCount) / ( IMAGENUM + 2 * AUDIONUM);
		if( t < 1){
			t *= stateCount / 2 / FPS;
			if( 1 < t) t = 1;

			ctx.fillStyle = "#ffffff";
			ctx.fillRect( 0.15 * REFW, 0.8 * REFH, t * 0.7 * REFW, 0.02 * REFH);

			ctx.strokeStyle = "#ffffff";
			ctx.globalAlpha = 1.0;
			ctx.lineWidth = 2;
			ctx.strokeRect( 0.15 * REFW, 0.8 * REFH, 0.7 * REFW, 0.02 * REFH);
		} else{
			if( initCount == 3){
				initCount++;

				loadStorage();

				document.addEventListener( "visibilitychange", function(){
					if( document.visibilityState === "hidden"){
						//try{ localStorage.setItem( "milk_test" + 1, localStorage.getItem( "milk_test1") + " h");} catch( e){};
						if( isAudio){
							//processor_node.disconnect( ska.ac.destination);
							stopAudio( kAudBGMTitle);
							stopAudio( kAudBGMGame);
						}
					} else if( document.visibilityState === "visible"){
						//try{ localStorage.setItem( "milk_test" + 1, localStorage.getItem( "milk_test1") + " v");} catch( e){};
						if( isAudio){
							//processor_node.connect( ska.ac.destination);
							if( currentState == MENU) t = 0.4; else t = 1;
							setAudioVolume( kAudBGMGame, t);
							gswPlayAudio( -1);
						}
					}
				}, false);
			}

			//★initCount が 4 の時ずっと、点滅。
			if( stateCount % 6 < 4) drawString( 0.5 * REFW - 30, 0.8 * REFH, "GO !!", 4);
		}
	}

	if( 0 < stateEndCount) stateEndCount--;
	if( stateCount < 1000 * 24 * 60 * 60 * FPS) stateCount++; //★1000日でカンスト。

	function li( s){ return loadImage( "image/" + s + ".png");}

	ctx.fillStyle = "rgba( 0, 1, 0.9, 0.3)";
	ctx.fillRect( 0, REFH - 20, 100, 20);
	ctx.fillStyle = "#ffffff";
	ctx.font = "12pt 'Arial'";
	ctx.textAlign = "left";
	ctx.fillText( accX, 5, REFH - 5);
}

//●==========●==========●==========●==========●==========●==========●

function loadStorage(){
	var s;

	s = MYSTORAGE;

	currentState = undefined;
	if( "localStorage" in window){
		try{ currentState = localStorage.getItem( s + "currentState");} catch( e){}
		if( currentState){
			currentState = parseInt( currentState);

			nextState = currentState;
			stateCount = stateEndCount = 0;

			isAudio = localStorage.getItem( s + "isAudio") == "true";
			isTilt = localStorage.getItem( s + "isTilt") == "true";

			gameStage = parseInt( localStorage.getItem( s + "gameStage"));
			gameStageSolved = parseInt( localStorage.getItem( s + "gameStageSolved"));

			if( currentState == MENU){
				menuX = ( gameStage - 1) * MENUW;
				menuVX = 0;
				gameStageJustCleared = 0;
			}
		} else{
			currentState = DEFAULT;
			nextState = TITLE;
			isAudio = true;
			isTilt = true;
			gameStageSolved = 0;
		}
	}
}

function saveStorage(){
	var s;

	s = MYSTORAGE;

	if( "localStorage" in window) try{
		localStorage.setItem( s + "currentState", currentState);

		localStorage.setItem( s + "isAudio", isAudio);
		localStorage.setItem( s + "isTilt", isTilt);

		localStorage.setItem( s + "gameStage", gameStage);
		localStorage.setItem( s + "gameStageSolved", gameStageSolved);
	} catch( e){}
}

//●==========●==========●==========●==========●==========●==========●

function processTouchBegan(){
	var a, b, i, p;
	var x, y;

	x = touch_x;
	y = touch_y;

	accXStd = accX;
	accYStd = accY;

	switch( currentState){
	case TITLE:
		if( 460 - 16 - 80 <= y){
			if( 16 <= x && x < 16 + 80){
				//★TILT ボタンがタッチされた。
				gswPlayAudio( kAudComet);
				isTilt = !isTilt;
			} else if( 160 - 40 <= x && x < 160 + 40){
				//★HOW TO ボタンがタッチされた。
				gswPlayAudio( kAudComet);
				menuX = 0;
				menuVX = 0;
				nextState = HOWTO;
			} else if( 320 - 16 - 80 <= x && x < 320 - 16){
				//★音の ON / OFF ボタンがタッチされた。
				isAudio = !isAudio;
				if( isAudio){
					gswPlayAudio( -1);
					gswPlayAudio( kAudComet);
				} else stopAudio( kAudBGMTitle);
			}
		} else if( y < 300){
			//★START ボタンがタッチされた。
			stopAudio( kAudBGMTitle);
			gswPlayAudio( kAudComet);
			gameStage = 1;
			//gameStage = gameStageSolved = MAXSTAGE; //★全ステージクリアのデバグ用。
			nextState = GAME_START;
		}
		break;

	case HOWTO:
		if( 460 - 16 - 80 <= y && 320 - 16 - 80 <= x && x < 320 - 16){
			//★OK ボタンがタッチされた。
			gswPlayAudio( kAudComet);
			nextState = TITLE;
		}
		break;

	case GAME:
		if( inGameState == WAITING){
			/*if( y < BY - 15){//★デバグ用（画面上部をタッチすると、ステージクリア。）
				gswPlayAudio( kAudComet);
				gameStage++;
				if( gameStage <= MAXSTAGE){
					setStage( gameStage);
				} else{
					nextState = TITLE;
				}
			} else */if( BY <= y && y < BY + 8 * GRIDW){
				if( BX <= x && x < BX + 8 * GRIDW){
					p = Math.floor( ( y - BY) / GRIDW) * 8 + Math.floor( ( x - BX) / GRIDW);
					if( map[ p] == EMPTY){// && p != meteorP){
						setTrack( p);
						if( 0 < map[ 64 + meteorP]){
							//★彗星が何も押さずに移動を開始。
							gswPlayAudio( kAudComet);
							meteorPTail = meteorP;
							meteorP = p;
							inGrab = true;
						}
					}
				}
			} else if( BY + 8 * GRIDW + 15 < y){
				if( x < 160){
					//★rewind ボタンがタッチされた。
					if( inGameState == WAITING && 0 < moves){
						nextState = REWIND;
					}
				} else{
					//★menu ボタンがタッチされた。
					gswPlayAudio( kAudComet);
					menuX = ( gameStage - 1) * MENUW;
					menuVX = 0;
					gameStageJustCleared = 0;
					nextState = MENU;
				}
			}
		}
		break;

	case MENU:
		if( inDialogue){
			//★クリアした記録を消去？ YES / NO
			if( 240 <= y && y < 300){
				gswPlayAudio( kAudComet);
				if( x < 160){
					gameStageJustCleared = 0;
					gameStageSolved = 0;
					menuX = 0;
					menuVX = 0;

					for( i = 0; i < MAXSTAGE; i++) mapCache[ i * 64] = -1;

					setStage( 1);
					for( i = 0; i < 64; i++) mapCache[ i] = map[ i];
					movesLimitCache[ 0] = movesLimit;

					saveStorage();
				}
				inDialogue = false;
			}
		} else{
			if( CENTERY - 306 / 4 <= y && y < CENTERY + 306 / 4){
				a = Math.floor( 2 * ( x - CENTERX + 306 / 4) + menuX);
				if( 0 <= a && a % MENUW < 306){
					a = 1 + Math.floor( a / MENUW);
					b = gameStageSolved + 1;
					if( MAXSTAGE < b) b--;
					if( 1 <= a && a <= b){
						gameStageFocused = a;
					}
				}
			} else if( 460 - 16 - 80 <= y){
				if( x < 110){
					//★タイトル画面へ戻るボタンがタッチされた。
					stopAudio( kAudBGMGame);
					gswPlayAudio( kAudComet);
					nextState = TITLE;
				} else if( x < 210){
					//★記録を消すボタンがタッチされた。
					gswPlayAudio( kAudComet);
					inDialogue = true;
				} else{
					//★音の ON / OFF ボタンがタッチされた。
					isAudio = !isAudio;
					if( isAudio){
						gswPlayAudio( -1);
						gswPlayAudio( kAudComet);
					} else stopAudio( kAudBGMGame);
				}
			}
		}
		break;

	case CLEAR_ALL:
		if( 6 * FPS <= stateCount){
			//★全ステージクリア画面を6秒以上表示した後でタッチされた。
			stopAudio( kAudBGMGame);
			gswPlayAudio( kAudComet);
			nextState = TITLE;
		}
		break;
	}
}

//●==========●==========●==========●==========●==========●==========●

function processMain(){
	var a, b, i, j;
	var x, y;

	switch( currentState){
	case DEFAULT:
		nextState = TITLE;
		break;

	case TITLE:
		if( stateCount == 0){
			//a
		} else if( stateCount == FIRST_SILENCE){
			setAudioVolume( kAudBGMTitle, 1.0);
			gswPlayAudio( -1);
		}
		break;

	case HOWTO:
		if( stateCount == 0){
			menuX = menuVX = 0;
		}

		a = 850 - 460; b = 100;
		if( touching){
			if( touch_vy != 0){
				//★ドラッグ。
				menuVX = Math.floor( -touch_vy);
				menuX += menuVX;
				if( menuX < -b) menuX = -b;
				else if( a + b <= menuX) menuX = a + b - 1;
			}
		} else{
			if( menuVX != 0){
				//★慣性。
				menuVX *= 0.9;
				if( -3 < menuVX && menuVX < 3) menuVX = 0;
				else{
					menuX += menuVX;
					if( menuX < -b){
						menuX = -b;
						menuVX = 0;
					} else if( a + b <= menuX){
						menuX = a + b - 1;
						menuVX = 0;
					}
				}
			} else{
				//★ぴったりの位置まで。
				if( menuX < 0) menuX /= 2;
				else if( a < menuX) menuX += ( a - menuX) / 2;
			}
		}
		break;

	case GAME_START:
		if( stateCount == 0){
			gswPlayAudio( -1);
			gswPlayAudio( kAudStart);

			setStage( gameStage);
		} else if( FPS <= stateCount){
			nextState = GAME;
		}
		break;

	case GAME:
		processGame();
		break;

	case REWIND: case FAIL:
		if( stateCount == 0){
			if( currentState == REWIND) gswPlayAudio( kAudRewind);
			else gswPlayAudio( kAudRewind);  //★FAIL の音をいただいていないので REWIND の音を流用。
			movingP = -1;
		}

		if( movingP < 0){
			a = movesRecord[ --moves];
			movingP = a & 63;
			movingD = Math.floor( a / 64) & 7;
			map[ movingP] = Math.floor( a / 512) & 3;
			movingOff = Math.floor( a / 4096);
			if( 0 < ( a & 2048)){
				map[ movingP + VP[ movingD] * movingOff] = 0;
			}
			movingOff *= GRIDW;
		} else{
			if( movingOff == 0){
				if( 0 < moves){
					movingP = -1;
				} else{
					nextState = GAME;
				}
			} else{
				movingOff -= GRIDW / 2;
			}
		}
		break;

	case MENU:
		processMenu();
		break;

	case CLEAR:
		if( stateCount == 0){
			if( gameStage < MAXSTAGE) gswPlayAudio( kAudClear);
			else gswPlayAudio( kAudClearAll);

			for( i = 0; i < 64; i++) mapCache[ ( gameStage - 1) * 64 + i] = map[ i];
			movesLimitCache[ gameStage - 1] = movesLimit;
		}

		if( FPS <= stateCount){
			if( gameStageSolved < gameStage) gameStageSolved = gameStage;
			if( gameStage < MAXSTAGE){
				menuX = ( gameStage - 1) * MENUW;
				menuVX = 0;
				gameStageJustCleared = gameStage;
				nextState = MENU;
			} else{
				nextState = CLEAR_ALL;
			}
		}
	}
	if( ( currentState == CLEAR_ALL && 6 * FPS <= stateCount) ||
		( currentState==TITLE && gameStageSolved == MAXSTAGE)
	){
		a = stateCount % FPS;
		if( a == 0 || a == 3 || a == 12){
			a = Math.floor( 6 + Math.random() * 20);
			x = 20 + Math.random() * 300;
			y = 20 + Math.random() * 440;
			for( i = 0; i < 2; i++){
				for( j = 0; j < a; j++){
				addDust( x, y, i * Math.PI + 2 * Math.PI * j / a, a / 4);
				}
				a = ( a + 1) / 2;
			}
		}
	}
}

function stepGrab( x0, y0, vx, vy){
	var d, p, x, y;

	x = Math.floor( x0); if( vx < 0) x--; else if( 0 < vx) x++;
	y = Math.floor( y0); if( vy < 0) y--; else if( 0 < vy) y++;
	p = x + y * 8;

	if( x < 0 || 7 < x || y < 0 || 7 < y){
		inGrab = false;
	} else if( map[ p] == EMPTY){
		meteorP = meteorPTail = p;
	} else{
		if( vy < 0) d = 0;
		else if( 0 < vx) d = 2;
		else if( 0 < vy) d = 4;
		else d = 6;

		//★押す。
		gswPlayAudio( kAudMove);
		movingD = d;
		movingCount = 0;
		movingP = p;
		movingOff = 0;
		movingSpeed = 7;
		dustCount = Math.floor( FPS / 4);
		dustCenterD = d;
		inGameState = MOVING;
		inGrab = false;
	}
}

function processGame(){
	var a, i, p, x, y;
	var t, dt, cx, cy, dx, dy, px, py, vx, vy;

	if( stateCount == 0){
		setAudioVolume( kAudBGMGame, 1.0);
		inGameState = WAITING;
		meteorP = meteorPTail = 0;
		movingP = -1;
		dustCount = 0;
		inGrab = false;
	}

	if( 0 < dustCount){
		for( i = 0; i < 5; i++) addMeteorDust( ( dustCenterD * 0.25 - 0.12 + 0.24 * Math.random()) * Math.PI);
		dustCount--;
	}

	switch( inGameState){
	case WAITING:
		if( touching){
			dx = ( touch_x - BX) / GRIDW;
			dy = ( touch_y - BY) / GRIDW;
			vx = touch_vx / GRIDW;
			vy = touch_vy / GRIDW;

			if( inGrab){
				if( vx != 0 || vy != 0){
					cx = dx - vx;
					cy = dy - vy;
					t = 0;
					while( t < 1 && inGrab){
						if( vx == 0) px = 1000000;
						else if( 0 < vx){ px = ( Math.ceil( cx) - cx) / vx; if( px == 0) px = 1 / vx;}
						else{ px = ( Math.floor( cx) - cx) / vx; if( px == 0) px = -1 / vx;}

						if( vy == 0) py = 1000000;
						else if( 0 < vy){ py = ( Math.ceil( cy) - cy) / vy; if( py == 0) py = 1 / vy;}
						else{ py = ( Math.floor( cy) - cy) / vy; if( py == 0) py = -1 / vy;}

						if( px < py) dt = px; else dt = py;
						t += dt;

						if( t <= 1){
							if( px < py){ stepGrab( cx, cy, vx, 0); dt = px;}
							else{ stepGrab( cx, cy, 0, vy); dt = py;}

							cx += dt * vx;
							cy += dt * vy;
						}
					}
				}
			} else{
				if( vx != 0 && vy != 0 && 0 <= dx && dx < 8 && 0 <= dy && dy < 8){
					p = Math.floor( dx) + Math.floor( dy) * 8;
					if( map[ p] == EMPTY){
						setTrack( p);
						if( 0 < map[ 64 + meteorP]){
							gswPlayAudio( kAudComet);
							meteorPTail = meteorP;
							meteorP = p;
							inGrab = true;
						}
					}
				}
			}
		} else{
			if( inGrab) inGrab = false;

			if( isTilt){
				vx = ACCMAG * ( accX - accXStd);
				vy = ACCMAG * ( accY - accYStd);
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
						addMeteorDust( t + ( -0.05 + 0.1 * Math.random()) * Math.PI);
					}
				} else{
					movingD = Math.floor( t / Math.PI * 2.0 + 4.5) % 4 * 2;
					x = meteorP % 8 + VX[ movingD];
					y = Math.floor( meteorP / 8) + VY[ movingD];
					p = meteorP + VP[ movingD];
					if( x < 0 || 7 < x || y < 0 || 7 < y){
						//inGrab = false;
					} else if( map[ p] == EMPTY){
						for( i = 0; i < 5; i++){
							addMeteorDust( ( movingD / 4 - 0.12 + 0.24 * Math.random()) * Math.PI);
						}
					} else{
						//★押す。
						gswPlayAudio( kAudMove);
						movingCount = 0;
						movingP = p;
						movingOff = 0;
						movingSpeed = 7;
						dustCount = Math.floor( FPS / 4);
						dustCenterD = movingD;
						inGameState = MOVING;
					}
				}
			}
		}
		break;

	case MOVING:
		if( movingP < 0){
			if( !touching) inGameState = WAITING;
		} else{
			movingOff += movingSpeed;
			movingSpeed += 1;
			x = movingP % 8 * GRIDW + movingOff * VX[ movingD];
			y = Math.floor( movingP / 8) * GRIDW + movingOff * VY[ movingD];
			if( x < 0 || 7 * GRIDW < x || y < 0 || 7 * GRIDW < y){
				//★領域外にいる。
				if( x < -2 * GRIDW || 9 * GRIDW < x || y < -2 * GRIDW || 9 * GRIDW <= y){
					//★領域外に消える。
					movesRecord[ moves++] =
						movingP + movingD * 64 + map[ movingP] * 512 +
						Math.floor( movingOff / GRIDW) * 4096
					;
					map[ movingP] = EMPTY;
					inGameState = WAITING;
				}
			} else{
				p = Math.floor( y / GRIDW) * 8 + Math.floor( x / GRIDW);
				if( movingD == 2) x += GRIDW - 1;
				else if( movingD == 4) y += GRIDW - 1;
				if( map[ Math.floor( y / GRIDW) * 8 + Math.floor( x / GRIDW)] != EMPTY){
					//★衝突した。
					gswPlayAudio( kAudHit);
					if( movingD == 0) p += 8;
					else if( movingD == 6) p++;
					if( p == movingP){
						//★動かずに衝突した。
					} else{
						//★動いた後、衝突した。
						movesRecord[ moves++] =
							movingP + movingD * 64 + map[ movingP] * 512 + 2048 +
							Math.floor( ( p - movingP) / VP[ movingD]) * 4096
						;
						map[ p] = map[ movingP];
						map[ movingP] = EMPTY;
						inGameState = WAITING;

						if( map[ p] == SPHERE){
							if( isClear()){
								//★クリア。
								nextState = CLEAR;
							}
						}
					}
					movingP = -1;
				}
			}
			if( inGameState == WAITING && moves == movesLimit && nextState != CLEAR){
				//★手数になったのにクリアできなかった。
				nextState = FAIL;
			}
		}
	}

	if( meteorPTail != meteorP){
		meteorPTail += VP[ getNextD( meteorPTail, meteorP)];
	}
}

function processMenu(){
	var a, b, i, x;

	if( stateCount == 0){
		setAudioVolume( kAudBGMGame, 0.4);
		gameStageFocused = 0;
		inDialogue = false;
	} else if( 0 < stateEndCount){
		if( 2 * GRIDW < ( menuX + GRIDW) % MENUW) stateEndCount++;
		else if( stateEndCount == 1){
			nextState = GAME;
		}
	}

	a = MENUW / 2;
	b = gameStageSolved;
	if( b == MAXSTAGE) b--;
	b *= MENUW;

	if( touching && !inDialogue && stateEndCount == 0){
		if( touch_vx != 0){
			//★ドラッグ。
			menuVX = Math.floor( -2 * touch_vx);
			menuX += menuVX;
			if( menuX < -a) menuX = -a;
			else if( b + a <= menuX) menuX = b + a - 1;

			if( 10 < Math.abs( touch_x - touch_by)) gameStageFocused = 0;
		}
	} else{
		if( menuVX != 0){
			//★慣性。
			menuVX *= 0.9;
			if( -3 < menuVX && menuVX < 3) menuVX = 0;
			else{
				menuX += menuVX;
				if( menuX < -a){
					menuX = -a;
					menuVX = 0;
				} else if( b + a <= menuX){
					menuX = b + a - 1;
					menuVX = 0;
				}
			}
		} else{
			//★ぴったりの位置まで。
			gameStage = 1 + Math.floor( ( a + menuX) / MENUW);
			x = ( gameStage - 1) * MENUW - menuX;
			if( x == -1) menuX--;
			else if( x == 1) menuX++;
			else{
				x = Math.floor( x / 2);
				if( x < -GRIDW) x = -GRIDW;
				else if( GRIDW < x) x = GRIDW;
				menuX += x;
			}
		}
	}

	if( touch_end){
		if( 0 < gameStageFocused){
			gswPlayAudio( kAudComet);
			stateEndCount = Math.floor( 0.3 * FPS - 1);
			gameStage = gameStageFocused;
			menuVX = 0;
			if( menuX < ( gameStage - 1.5) * MENUW) menuX = Math.floor( ( gameStage - 1.5) * MENUW);
			else if( ( gameStage - 0.5) * MENUW <= menuX) menuX = Math.floor( ( gameStage - 0.5) * MENUW - 1);
			gameStageFocused = 0;

			setStage( gameStage);
			for( i = 0; i < 64; i++) mapCache[ ( gameStage - 1) * 64 + i] = map[ i];
			movesLimitCache[ gameStage - 1] = movesLimit;
			gameStageJustCleared = 0;
		}
	}
}

//●==========●==========●==========●==========●==========●==========●

function processStars(){
	var i;

	if( Math.random() * FPS < 5){
		for( i = 0; i < MAXSTARNUM; i++){
			if( starN[ i] < 0){
				starN[ i] = Math.floor( Math.random() * 16);
				starD[ i] = Math.floor( Math.random() * 1000);
				starZ[ i] = 0;
				starVZ[ i] = 5 + Math.floor( Math.random() * 20);
				starR[ i] = 0;
				starVR[ i] = Math.floor( Math.random() * 100);
				if( starVR[ i] < 50) starVR[ i] -= 60; else starVR[ i] -= 40;
				break;
			}
		}
	}

	for( i = 0; i < MAXSTARNUM; i++){
		if( 0 <= starN[ i]){
			starZ[ i] += starVZ[ i];
			if( starZ[ i] < 1000){
				starR[ i] = ( starR[ i] + 1000 + starVR[ i]) % 1000;
			} else{
				starN[ i] = -1;
			}
		}
	}
}

function drawStars(){
	var i;
	var a, x, y;

	for( i = 0; i < MAXSTARNUM; i++){
		if( 0 <= starN[ i]){
			a = starZ[ i] * starZ[ i] / 1000000;
			x = 160 + 70 * ACCMAG * accX + 300 * Math.sin( starD[ i] * 2 * Math.PI / 1000) * a;
			y = 240 + 70 * ACCMAG * accY - 300 * Math.cos( starD[ i] * 2 * Math.PI / 1000) * a;

			ctx.save();
			ctx.translate( x, y);
			ctx.scale( 2 * a, 2 * a);
			ctx.rotate( starR[ i] * 2 * Math.PI / 1000);
			ctx.globalAlpha = 0.7 * a;
			gswDrawImagePartially(
				kImgStars,
				-16, -16,
				( starN[ i] % 4) * 32, Math.floor( starN[ i] / 4) * 32,
				32, 32
			);
			ctx.restore();
		}
	}
	ctx.globalAlpha = 1;
}

//●==========●==========●==========●==========●==========●==========●

function addDust( x, y, d, v){
	var i;

	for( i = 0; i < MAXDUSTNUM; i++){
		if( dustN[ i] < 0){
			dustN[ i] = 0;
			dustX[ i] = x;
			dustY[ i] = y;
			dustD[ i] = d;
			dustV[ i] = v;
			break;
		}
	}
}

function addMeteorDust( t){
	addDust(
		BX + ( meteorP % 8 + 0.5) * GRIDW + 10 * Math.sin( t),
		BY + ( Math.floor( meteorP / 8) + 0.5) * GRIDW - 10 * Math.cos( t),
		t, 5 + Math.random() * 5
	);
}

function processDust(){
	var i;

	for( i = 0; i < MAXDUSTNUM; i++){
		if( 0 <= dustN[ i]){
			if( ++dustN[ i] < 20){
				dustX[ i] += dustV[ i] * Math.sin( dustD[ i]);
				dustY[ i] -= dustV[ i] * Math.cos( dustD[ i]);
			} else{
				dustN[ i] = -1;
			}
		}
	}
}

function drawDust(){
	var a, i;
	var t;

	for( i = 0; i < MAXDUSTNUM; i++){
		if( 0 <= dustN[ i]){
			ctx.save();

			ctx.translate( dustX[ i], dustY[ i]);
			ctx.scale( 0.25, 0.25);
			t = ( 20 - dustN[ i]) / 20.0;
			ctx.globalAlpha = t;
			a = 11 + dustN[ i] % 3;
			if( 11 < a) a += 2;

			gswDrawImagePartially( kImgStars, -16, -16, a % 4 * 32, Math.floor( a / 4) * 32, 32, 32);

			ctx.restore();
		}
	}
	ctx.globalAlpha = 1.0;
}

//●==========●==========●==========●==========●==========●==========●

function setStage( n){
	var i, x, y;
	var a;

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
			a = parseInt( "0x" + s[ n - 1].substring( 10 + ( i * 6 + y) * 3, 10 + ( i * 6 + y) * 3 + 2));
			for( x = 0; x < 8; x++){
				if( 0 < ( a & 1)){
					map[ ( 1 + y) * 8 + x] = 1 + i;
				}
				a = Math.floor( a / 2);
			}
		}
	}

	movesLimit = parseInt( s[ n - 1].substring( 47, 48));
	moves = 0;
}

function isClear(){
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

function setTrack( p){
	var i, j, k, n, q;

	for( i = 0; i < 64; i++) if( map[ i] == EMPTY) map[ 64 + i] = 0; else map[ 64 + i] = -1;

	map[ 64 + p] = 1;

	for( i = 1; ; i++){
		n = 0;
		for( j = 0; j < 64; j++){
			if( map[ 64 + j] == i){
				for( k = 0; k < 8; k += 2){
					q = j + VP[ k];
					if( 0 <= q && q < 64 && !( j % 8 == 0 && 4 < k) && !( j % 8 == 7 && ( 0 < k && k < 4))){
						if( map[ 64 + q] == 0){
							map[ 64 + q] = i + 1;
							n++;
						}
					}
				}
			}
		}
		if( n == 0) break;
	}
}

function getNextD( p, p2){
	var d, i, q, vx, vy;

	vx = p2 % 8 - p % 8;
	vy = Math.floor( p2 / 8) - Math.floor( p / 8);
	if( vx * vx < vy * vy){
		if( vy < 0) d = 0; else d = 4;
	} else{
		if( 0 < vx) d = 2; else d = 6;
	}
	for( i = 0; i < 4; i++){
		q = p + VP[ d];
		if( 0 <= q && q < 64 && !( p % 8 == 0 && 4 < i) && !( p % 8 == 7 && ( 0 < d && d < 4))){
			if( map[ 64 + q] == map[ 64 + p] - 1) return d;
		}
		d = ( d + 2) % 8;
	}
	return -1;  //★進むことができる方向がなかった。 (ゴールから検索を始めた場合など。)
}

//●==========●==========●==========●==========●==========●==========●

function drawMain(){
	var a, d, d0, i, j, p;
	var x, y, x0, y0;
	var t, t2;

	ctx.globalAlpha = 1.0;
	gswDrawImage( kImgBG, 0, 0);
	drawStars();

	switch( currentState){
	case TITLE:
		gswDrawImage( kImgTitle, 0, 0);

		//ctx.globalAlpha = 0.5;
		//drawString( 150, 165, "web", 2);

		//ctx.globalAlpha = 0.3;
		//drawString( 230, 165, "ver. 1.0", 1.5);

		ctx.globalAlpha = 1.0;
		x = 16; y = 460 - 16 - 80;
		gswDrawImagePartially( kImgTilt, x - 10, y - 10, 0, 0, 100, 100);
		if( isTilt){
			a = Math.floor( stateCount / ( FPS / 5));
			if( 0 < ( a & 1)) a = 1 + Math.floor( a / 2) % 4; else a = 0;
		} else a = 0;
		gswDrawImagePartially( kImgTilt, x + 40 - 20, y, 110 + a * 40, 10, 40, 70);

		x = 320 - 16 - 80;
		drawButtonSound( x, y);
		break;

	case HOWTO:
		ctx.fillStyle = "#000000";
		ctx.globalAlpha = 0.5;
		ctx.fillRect( -32, -21, 320 + 64, 460 + 42);
		ctx.globalAlpha = 1.0;

		gswDrawImage( kImgHowTo, 0, -menuX);
		gswDrawImage( kImgHowTo, 0, -menuX);

		gswDrawImage( kImgOK, 320 - 16 - 80 - 10, 460 - 16 - 80 - 10);
		break;

	case GAME_START: case GAME: case REWIND: case CLEAR: case FAIL: case CLEAR_ALL:
		if( currentState == GAME_START){
			t = 1.0 * stateCount / FPS;
			ctx.save();
			ctx.translate( CENTERX, CENTERY);
			ctx.scale( t, t);
			ctx.rotate( ( 1 - t) * Math.PI);
			ctx.translate( -CENTERX, -CENTERY);
			ctx.globalAlpha = t;
		} else if( currentState == CLEAR_ALL){
			ctx.save();
			if( stateCount < FPS){
				ctx.translate( CENTERX, CENTERY);
				t = stateCount / FPS;
				t = 1 + 15 * t * t;
				ctx.scale( t, t);
				ctx.rotate( stateCount * -0.5 * Math.PI / FPS);
				ctx.translate( -CENTERX, -CENTERY);
				t = 1.0 - 1.0 * stateCount / FPS;
			} else t = 0;
			ctx.globalAlpha = t;
		} else t = 1;

		gswDrawImage( kImgGrid, BX - 4, BY - 4);

		p = 0;
		for( i = 0; i < 8; i++){
			for( j = 0; j < 8; j++){
				x = j * GRIDW;
				y = i * GRIDW;
				t2 = 1.0;
				if( p == movingP){
					x += movingOff * VX[ movingD];
					y += movingOff * VY[ movingD];
					if( x < 0) t2 = 1 + x / 2.0 / GRIDW;
					else if( 7 * GRIDW < x) t2 = 1 - ( x - 7 * GRIDW) / 2.0 / GRIDW;
					else if( y < 0) t2 = 1 + y / 2.0 / GRIDW;
					else if( 7 * GRIDW < y) t2 = 1 - ( y - 7 * GRIDW) / 2.0 / GRIDW;
				}
				ctx.globalAlpha = t * t2;
				x += BX;
				y += BY;
				switch( map[ i * 8 + j]){
				case BLOCK:
					gswDrawImage( kImgBlock, x + 1, y + 1);
					break;
				case SPHERE:
					gswDrawImage( kImgSphere, x - 10, y - 10);
					break;
				case SPHERE3:
					gswDrawImage( kImgSphere3, x - 10, y - 10);
					break;
				}
				p++;
			}
		}
		ctx.globalAlpha = 1.0;

		if( currentState == GAME){//★流星を描画。
			ctx.globalCompositeOperation = 'lighter';
			ctx.globalAlpha = 0.8;
			if( meteorPTail != meteorP){
				p = meteorPTail;
				x0 = p % 8 * GRIDW;
				y0 = Math.floor( p / 8) * GRIDW;
				d0 = getNextD( p, meteorP);
				while( p != meteorP){
					p += VP[ d0];
					x = p % 8 * GRIDW;
					y = Math.floor( p / 8) * GRIDW;
					d = getNextD( p, meteorP);
					if( d != d0 && p != meteorP){
						//★曲がり角はインコースに寄る。
						if( d == ( d0 + 2) % 8) a = d + 1;
						else a = ( d + 7) % 8;
						x += 10 * VX[ a];
						y += 10 * VY[ a];
					}
					ctx.save();
					ctx.translate( BX + 19 + x, BY + 19 + y);
					if( y == y0){
						if( x0 < x) t = 0.5 * Math.PI;
						else t = 1.5 * Math.PI;
					} else{
						t = Math.atan( 1.0 * ( x - x0) / ( y0 - y));
						if( y0 < y) t += Math.PI;
					}
					ctx.rotate( t);
					t = Math.sqrt( ( y - y0) * ( y - y0) + ( x - x0) * ( x - x0)) / 38;
					ctx.scale( t, t);
					t = 1.0 + ( map[ 64 + meteorPTail] - map[ 64 + p]) / 9.0;
					ctx.scale( t, 1);
					if( p == meteorPTail + VP[ d0]) gswDrawImage( kImgTailEnd, -16, -6);
					else gswDrawImage( kImgTail, -16, -6);
					ctx.restore();

					x0 = x;
					y0 = y;
					d0 = d;
				}
			}
			ctx.globalAlpha = 1.0;

			if( inGrab){
				x = touch_x;
				y = touch_y;
			} else{
				x = BX + ( meteorP % 8 + 0.5) * GRIDW;
				y = BY + ( Math.floor( meteorP / 8) + 0.5) * GRIDW;
			}
			drawImageCenteredScaledRotated( kImgMeteor, x, y, 0.5, -stateCount * 0.02 * 2 * Math.PI);
			ctx.globalCompositeOperation = 'source-over';

			if( isTilt){
				gswDrawImage(
					kImgCore,
					x + 15 * ACCMAG * ( accX - accXStd) - 7,
					y + 15 * ACCMAG * ( accY - accYStd) - 7
				);
			}
		}

		if( currentState == CLEAR) drawClear();

		if( currentState == GAME_START || currentState == CLEAR_ALL){
			ctx.globalAlpha = 1;
			ctx.restore();
		}

		if( currentState == CLEAR_ALL){
			if( stateCount < FPS) t = 1.0 - 1.0 * stateCount / FPS;
			else{
				ctx.save();
				ctx.translate( CENTERX, CENTERY);
				if( stateCount < 6 * FPS){
					t = 1.0 * ( stateCount - FPS) / FPS / 5.0;
					t *= t;
				} else t = 1.0;
				ctx.scale( t, t);
				ctx.globalAlpha = t;
				gswDrawImage( kImgClearAll, -150, -150);
				ctx.restore();
				t = 0;
			}
			ctx.globalAlpha = t;
		}

		gswDrawImage( kImgGame, 0, 0);

		if( gameStage < 10) drawDigits( gameStage, 1, 108, 24);
		else drawDigits( gameStage, 2, 108 + 22, 24);
		drawDigits( movesLimit - moves, 1, 258, 24);

		if( currentState == CLEAR_ALL) ctx.globalAlpha = 1.0;

		if( currentState == FAIL) gswDrawImage( kImgFail, -32, -21);

		break;

	case MENU:
		if( 0 < stateEndCount) t = 1.0 - 0.5 * stateEndCount / ( 0.3 * FPS);
		else if( stateCount < 0.3 * FPS) t = 1.0 - 0.5 * stateCount / ( 0.3 * FPS);
		else t = 0.5;
		ctx.save();
		ctx.translate( CENTERX, CENTERY);
		ctx.scale( t, t);
		ctx.translate( -CENTERX, -CENTERY);

		a = 1 + Math.floor( ( MENUW / 2 + menuX) / MENUW);
		x = -menuX + ( a - 1) * MENUW;
		if( 1 <= a - 1) drawMapCache( a - 1, Math.floor( x - MENUW));
		drawMapCache( a, Math.floor( x));
		if( a + 1 <= MAXSTAGE) drawMapCache( a + 1, Math.floor( x + MENUW));

		ctx.restore();

		if( 0 < stateEndCount) t = 1.0 * stateEndCount / ( 0.3 * FPS);
		else if( stateCount < 0.3 * FPS) t = 1.0 * stateCount / ( 0.3 * FPS);
		else t = 1.0;
		ctx.globalAlpha = t;
		gswDrawImage( kImgMenu, 0, 0);
		drawButtonSound( 320 - 16 - 80, 460 - 16 - 80);
		ctx.globalAlpha = 1.0;

		if( inDialogue){
			gswDrawImage( kImgReset, 5, 160);
		}
		break;
	}

	drawDust();
/*
	ctx.fillStyle = "#ffffff";
	ctx.font = "12pt 'Arial'";
	ctx.textAlign = "left";
	//ctx.fillText( DeviceMotionEvent, 5, REFH - 5);
	ctx.fillText( "abc", 5, REFH - 5);
*/
}

function drawString( x, y, s, m){
	var a, d, i;

	d = 0;
	for( i = 0; i < s.length; i++){
		ctx.save();
		ctx.translate( x + d * m, y - 8 * m);
		ctx.scale( m / 8, m / 8);
		a = s.charCodeAt( i) - 32;
		gswDrawImagePartially( kImgLetters, 0, 0, a % 16 * 32, Math.floor( a / 16) * 50, 32, 48);
		if( " i".indexOf( s.charAt( i)) < 0) d += 4; else d += 2;
		ctx.restore();
	}
}

function drawButtonSound( x, y){
	gswDrawImagePartially( kImgSound, x - 10, y - 10, 0, 0, 100, 100);
	if( isAudio){
		gswDrawImagePartially( kImgSound, x, y - 5 * Math.sin( Math.PI * ( stateCount % 8) / 8), 210, 10, 80, 80);
	} else{
		gswDrawImagePartially( kImgSound, x, y, 110, 10, 80, 80);
	}
}

function drawMapCache( n, dx){
	var i, j, x, y;

	ctx.save();
	ctx.translate( dx, 0);

	gswDrawImage( kImgGrid, BX - 4, BY - 4);

	if( n <= gameStageSolved + 1){
		if( mapCache[ ( n - 1) * 64] < 0){
			setStage( n);
			for( i = 0; i < 64; i++) mapCache[ ( n - 1) * 64 + i] = map[ i];
			movesLimitCache[ n - 1] = movesLimit;
		}

		for( i = 0; i < 8; i++){
			for( j = 0; j < 8; j++){
				x = BX + 1 + j * GRIDW;
				y = BY + 1 + i * GRIDW;
				switch( mapCache[ ( n - 1) * 64 + i * 8 + j]){
				case BLOCK:
					gswDrawImage( kImgBlock, x + 1, y + 1);
					break;
				case SPHERE:
					gswDrawImage( kImgSphere, x - 10, y - 10);
					break;
				case SPHERE3:
					gswDrawImage( kImgSphere3, x - 10, y - 10);
					break;
				}
			}
		}

		if( n == gameStageFocused) gswDrawImage( kImgStageFocus, BX - 15, BY - 15);

		gswDrawImagePartially( kImgGame, 0, 0, 0, 0, 320, BY);
		drawDigits( movesLimitCache[ n - 1], 1, 258, 24);
	} else{
		gswDrawImagePartially( kImgGame, 0, 0, 0, 0, 160, BY);
		gswDrawImage( kImgLock, 49, BY + 4 * GRIDW - 143);
	}

	if( n < 10) drawDigits( n, 1, 108, 24);
	else drawDigits( n, 2, 108 + 22, 24);

	if( n == gameStageJustCleared) drawClear();

	ctx.restore();
}

function drawClear(){
	if( stateCount % 8 < 4) gswDrawImage( kImgClear, 160 - 171, BY + 4 * GRIDW - 61);
}

function drawDigits( n, m, x, y){
	var a, b, i;

	gswDrawImagePartially( kImgNums, x, y, 4 + n % 10 * 32, 4, 24, 32);
	a = 10;
	for( i = 1; i < m; i++){
		b = Math.floor( n / a);
		if( 0 < b){
			gswDrawImagePartially( kImgNums, x - i * 22, y, 4 + b % 10 * 32, 4, 24, 32);
			a *= 10;
		} else break;
	}
}

//●==========●==========●==========●==========●==========●==========●

function gswDrawImage( n, x, y){ drawImageScaled( n, x, y, 0.5);}
function gswDrawImagePartially( n, x, y, sx, sy, w, h){
	drawImagePartiallyScaled( n, x, y, 2 * sx, 2 * sy, 2 * w, 2 * h, 0.5);
}
