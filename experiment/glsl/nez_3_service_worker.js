
const KEY = "nez_3";

self.addEventListener( "install", (event) => {
	event.waitUntil(
		caches.open( KEY).then( cache => {
			return cache.addAll( [
				"./nez_3.html",

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

self.addEventListener( "activate", (event) => {});

self.addEventListener( "fetch", (event) => {
	event.respondWith(
		caches.match( event.request).then( function( cache_res){
			return cache_res || fetch( event.request).then( function( response){
				return caches.open( KEY).then( function( cache){
					cache.put( event.request, response.clone());
					return response;
				});
			});
		})
	);
});
