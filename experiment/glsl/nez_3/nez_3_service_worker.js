
const SW_KEY = "nez_3";

self.addEventListener( "install", e => e.waitUntil(
	caches.open( SW_KEY).then( c => c.addAll( [
		"favicon.ico",
		"glsl.css",
		"bg.png",

		"nez_3_t.jpg",
		"nez_3.html",
		"rotate.png",

		"nez_3_1_glb_b64.js",
		"nez_3_2_glb_b64.js",

		"skeleton_touch_3.js",

		"three_130_min.js",
		"three_gltf_loader.js"
	]))
));

self.addEventListener( "activate", e => {});

self.addEventListener( "fetch", e => e.respondWith(
	caches.match( e.request).then( c_res => {
		if( c_res) return c_res;

		return fetch( e.request.clone()).then( f_res => {
			if( !f_res || f_res.status != 200 || f_res.type != "basic") return f_res;

			caches.open( SW_KEY).then( c => c.put( e.request, f_res.clone()));
			return f_res;
		});
	})
));
