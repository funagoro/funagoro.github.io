
const KEY = "nez_3";

self.addEventListener( "install", e => {
	e.waitUntil(
		caches.open( KEY).then( c => {
			return c.addAll( [
				"./favicon.ico",
				"./glsl.css",
				"./bg.png",

				"./nez_3.html",
				"./bon_12.png",

				"./nez_3_1_glb_b64.js",
				"./nez_3_2_glb_b64.js",

				"./skeleton_touch.js",

				"./three_130_min.js",
				"./three_gltf_loader.js"
			]);
		})
	);
});

self.addEventListener( "activate", e => {});

self.addEventListener( "fetch", e => {
	e.respondWith(
		caches.match( e.request).then( function( c_res){
			return c_res || fetch( e.request).then( function( f_res){
				return caches.open( KEY).then( function( c){
					c.put( e.request, f_res.clone());
					return f_res;
				});
			});
		})
	);
});
