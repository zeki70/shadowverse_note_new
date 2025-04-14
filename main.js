// ===========================
// 設定
// ===========================

// ハッシュタグリスト（仮置き）
const HASHTAG_LIST = ['Shadowverse', 'シャドバ', 'シャドウバース', '2pick'];

// ミュートハッシュタグリスト（タイトル、ハッシュタグ、作者名に対して）
const MUTE_HSSHTAG_LIST = ['シャドウバースエボルヴ', 'Shadowverse_EVOLVE'];

// Twitter API設定（OAuth2 Bearer Token）
const BEARER_TOKEN = PropertiesService.getScriptProperties().getProperty("YOUR_BEARER_TOKEN");

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
