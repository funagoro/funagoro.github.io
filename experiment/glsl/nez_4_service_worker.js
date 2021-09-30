
const KEY = "nez_4";

self.addEventListener( "install", e => e.waitUntil(
	caches.open( KEY).then( c => c.addAll( [
		"favicon.ico",
		"glsl.css",
		"bg.png",

		"nez_4.html",
		"nez_3.png",

		"nez_4_1_glb_b64.js",
		"nez_4_2_glb_b64.js",

		"skeleton_touch.js",

		"three_130_min.js",
		"three_gltf_loader.js",

		"liquidfun_min.js"
	]))
));

self.addEventListener( "activate", e => {});

self.addEventListener( "fetch", e => e.respondWith(
	caches.match( e.request).then( c_res => {
		if( c_res) return c_res;
		fetch( e.request).then( f_res => caches.open( KEY).then( c => {
			c.put( e.request, f_res.clone());
			return f_res;
		}));
	})
));