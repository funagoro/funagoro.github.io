
const STATIC_CACHE_KEY = 'cache-key';

var ORIGIN = location.protocol + '//' + 
            location.hostname + 
            (location.port ? ':' + location.port : '');

/*************************************************************************
 * インストール時の処理
*************************************************************************/
self.addEventListener('install', event => {

  //ワーカーをアクティブ状態に切り替える
  event.waitUntil(self.skipWaiting());

  //キャッシュするリソースをダウンロードする
  event.waitUntil(
    //マニュフェストファイルから、キャッシュ対象のリソースURLを取得
    load_manifest()
      //キャッシュ対象のリソースをダウンロードし、キャッシュストレージに保存する
      .then((list) => download_files(list))
  );
});

/*************************************************************************
 * マニュフェストファイルの読み込み
 * @description マニュフェストの :CACHEセクションに書かれているリソースURLを抽出
*************************************************************************/
function load_manifest() {

  return fetch(ORIGIN + "/" + MANIFEST_URL)
  .then(response => response.text())
  //マニュフェストから、キャッシュするURLのリストを取得する
  .then(content => {

    //マニュフェストファイルの中身を解析して、
    //キャッシュセクションに書かれているファイルリストを取り出す
    content = content.replace(
      new RegExp(
        "(NETWORK|FALLBACK):" +
        "((?!(NETWORK|FALLBACK|CACHE):)[\\w\\W]*)",
        "gi"
        ),
        ""
    );
    content = content.replace(
      new RegExp( "#[^\\r\\n]*(\\r\\n?|\\n)", "g" ),
        ""
    );
    content = content.replace(
      new RegExp( "CACHE MANIFEST\\s*|\\s*$", "g" ),
        ""
    );
    content = content.replace(
      new RegExp( "[\\r\\n]+", "g" ),
        "#"
    );

    //キャッシュ対象のURLを、リストで返す
    var fileList = content.split("#");
    //マニュフェスト変更チェックの為に、マニュフェストファイルもキャッシュしておく
    fileList.push(MANIFEST_URL);
     
    return fileList.map(function(url) {
      return ORIGIN + "/" + (url == "/" ? "": url);
    }).slice(1, fileList.length);
  });
}

/*************************************************************************
 * キャッシュ対象のリソースをダウンロードして、キャッシュストレージに保存する
 * @param {Array} cache_urls キャッシュするリソースのURLリスト
*************************************************************************/
function download_files(cache_urls) {

  return caches.open(STATIC_CACHE_KEY).then((cache) => {
    return Promise.all(
      cache_urls.map(url => {
        return fetch(new Request(url, { cache: 'no-cache', mode: 'no-cors' }))
         .then((response) => {
           return cache.put(url, response);
         });
      })
    );
  });
}

/*************************************************************************
 * fetchイベント発生時の処理 
 * @description ブラウザからのリクエストが、キャッシュ済みのリソースであれば、
 *              キャッシュストレージの内容でレスポンスを返します。
*************************************************************************/
self.addEventListener('fetch', function(event) {

  //マニュフェストファイルに対するリクエストの場合、変更チェックを行い、
  //マニュフェストに変更がある場合、リソースの再キャッシュを行う
  if (event.request.url == ORIGIN + "/" + MANIFEST_URL) {
    check_manifest();
  }
  
  //キャッシュ済みのリソースであれば、キャッシュストレージの内容でレスポンスを返します。
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});

/*************************************************************************
 * マニュフェストファイルの変更チェック
 * @description マニュフェストファイルに差異があれば、リソースを再ダウンロード＆再キャッシュする
*************************************************************************/
function check_manifest() {

  //キャッシュされているマニュフェストを格納する変数
  var cacheManifest = "";

  //キャッシュからマニュフェストファイルを取得する
  caches.match(new Request(ORIGIN + "/" + MANIFEST_URL))
    .then((response) => {
      if (response == null || typeof response === "undefined") {
        return "";
      }
      return response.text();
    })
    //最新版のマニュフェストファイルを Webサーバから取得する
    .then(content => {
      cacheManifest = content;
      return fetch(ORIGIN + "/" + MANIFEST_URL);
    })
    .then(response => response.text())
    //マニュフェストファイルに差異があれば、リソースを再キャッシュ
    .then(content => {
      if (content != cacheManifest) {
        console.log("マニュフェストファイルに変更があった為、リソースを再キャッシュします");
        //現在のキャッシュをクリア
        return caches.delete(STATIC_CACHE_KEY);
      } else {
        //変更がない場合h、処理を中断する為に、例外をスローする
        throw "NoChanged";
      }
    })
    .then(() => {
      return load_manifest()
        .then((list) => download_files(list));
    }).catch(err => {
      if (err === "NoChanged") return;
      throw err;
    });
}
