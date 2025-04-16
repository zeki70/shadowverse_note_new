var CLIENT_ID = PropertiesService.getScriptProperties().getProperty("CLIENT_ID");
var CLIENT_SECRET = PropertiesService.getScriptProperties().getProperty('CLIENT_SECRET');

/**
 * OAuth2サービスの取得
 */
function getService() {
  return OAuth2.createService('Twitter')
    .setAuthorizationBaseUrl('https://twitter.com/i/oauth2/authorize')
    .setTokenUrl('https://api.twitter.com/2/oauth2/token')
    .setClientId(CLIENT_ID)
    .setClientSecret(CLIENT_SECRET)
    .setCallbackFunction('authCallback')
    .setPropertyStore(PropertiesService.getUserProperties())
    .setScope('tweet.write offline.access')
    .setTokenHeaders({
      Authorization: 'Basic ' + Utilities.base64Encode(CLIENT_ID + ':' + CLIENT_SECRET)
    });
}

/**
 * 認証コールバック関数
 */
function authCallback(request) {
  var service = getService();
  var isAuthorized = service.handleCallback(request);
  if (isAuthorized) {
    return HtmlService.createHtmlOutput('認証が完了しました。');
  } else {
    return HtmlService.createHtmlOutput('認証に失敗しました。');
  }
}

/**
 * ツイートを投稿する関数
 */
function postTweet(text) {
  var service = getService();
  if (!service.hasAccess()) {
    var authorizationUrl = service.getAuthorizationUrl();
    Logger.log('以下のURLにアクセスして認証を行ってください：\n' + authorizationUrl);
    return;
  }

  var url = 'https://api.twitter.com/2/tweets';
  var payload = {
    text: text
  };

  var response = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    headers: {
      Authorization: 'Bearer ' + service.getAccessToken()
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });

  Logger.log(response.getContentText());
}

check_limit(article_ID_list){
    var limit_list = cache.get("limit");
    var last_article_ID_list = caches.get("article_ID_list");
    var date = new Date();
    var today = date.getDate();
    if(limit_list == null){
        limit_list = [today, 17]; // 初期化
    }
    if(limit_list[0] != today){
        limit_list[0] = today;
        limit_list[1] = 17;
    }
    if(limit_list[1] == 0){
        cache.put("limit", limit_list, 21600); // 6時間キャッシュ
        caches.put("article_ID_list", article_ID_list, 21600); // 6時間キャッシュ
        return true;
    }
    for(i in article_ID_list){
        if(limit_list[1] == 0){
            cache.put("limit", limit_list, 21600); // 6時間キャッシュ
            caches.put("article_ID_list", article_ID_list, 21600); // 6時間キャッシュ
            return true;
        }
        if (last_article_ID_list.includes(article_ID_list[i])){
            continue
        } else {
            postTweet(`https://note.com/${article_ID_list[i][0]}/n/${article_ID_list[i][1]}`);
            last_article_ID_list.push(article_ID_list[i]);
            if (last_article_ID_list.lenghth > 50 * HASHTAG_LIST.length){
                last_article_ID_list.shift();
            }
            caches.put("article_ID_list", last_article_ID_list, 21600); // 6時間キャッシュ
            limit_list[1] -= 1;
        }
    }
    cache.put("limit", limit_list, 21600); // 6時間キャッシュ
}