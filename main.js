// ===========================
// 設定
// ===========================

// ハッシュタグリスト（仮置き）
const HASHTAG_LIST = ['Shadowverse', 'シャドバ', 'シャドウバース', '2pick'];

// ミュートハッシュタグリスト（タイトル、ハッシュタグ、作者名に対して）
const MUTE_HSSHTAG_LIST = ['シャドウバースエボルヴ', 'Shadowverse_EVOLVE'];

const MUTE_USER_LIST = []

// Twitter API設定（OAuth2 Bearer Token）
const BEARER_TOKEN = PropertiesService.getScriptProperties().getProperty("YOUR_BEARER_TOKEN");

const Article_ID_list = new Set(); // 記事IDを格納するセット
// ===========================
// メイン処理
// ===========================

function scrapeHtml(hashtag) {
  var url = 'https://note.com/hashtag/' + hashtag; // スクレイピングしたいURLを指定
  
  // HTMLコンテンツを取得
  var response = UrlFetchApp.fetch(url);
  var html = response.getContentText();
  
  // 取得したHTMLをログに表示（確認用）
  Logger.log(html);

  // 結果をA列の最初の空いているセルに表示
  return html;
}

function extractArticleIds(html) {
  
  // 正規表現で /<ユーザーID>/n/<記事ID> の形から記事IDだけを抜き出す
  const regex = /\/[^\/]+\/n\/(n[0-9a-z]+)/g;
  let match;
  const articleIds = [];

  while ((match = regex.exec(html)) !== null) {
    articleIds.push(match[1]); // 1番目のキャプチャグループ（記事ID）を追加
  }
  
  Logger.log(articleIds);
  var sheet = SpreadsheetApp.openById(Spreadsheet_ID).getSheetByName("シート1");  // シートを直接指定
  sheet.appendRow(articleIds);
}

function get_article_ID() {// 記事IDを取得する関数
    for (i in HASHTAG_LIST) {
        var hashtag = HASHTAG_LIST[i];
        var html_list = scrapeHtml(hashtag);
        check_article_ID(html_list);
    }
}

function check_article_ID(list) {// 記事IDをチェックしミュートリストに無かったら送信用リストに追加する
    for (i in list){
        var article_elements = list[i];
        if (MUTE_USER_LIST.includes(article_elements[0])){
            continue
        }
        var hashtag_url = `https://note.com/api/v3/notes/${article_elements[1]}`;
        let jsonArticleInfo = UrlFetchApp.fetch(hashtag_url, {'method':'get'});
        var parsedData = JSON.parse(jsonArticleInfo);
        var hashtags = parsedData.data.hashtag_notes;
        if (MUTE_HSSHTAG_LIST.includes(hashtags)){
            continue
        }
        Article_ID_list.add(article_elements[1]);
    }
}
function makeCache() {
    const cache = CacheService.getScriptCache();
    return {
      get: function(key) {
        return JSON.parse(cache.get(key));
      },
      put: function(key, value, sec) {
        //リファレンスよりcache.putの3つ目の引数は省略可。
        //デフォルトでは10分間（600秒）保存される。最大値は6時間（21600秒）
        cache.put(key, JSON.stringify(value), (sec === undefined) ? 600 : sec);
        return value;
      }
    };
  }