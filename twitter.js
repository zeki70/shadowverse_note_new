const cache = makeCache();
// スクリプトプロパティなどから取得してもOK
const CONSUMER_KEY = PropertiesService.getScriptProperties().getProperty("CONSUMER_KEY");
const CONSUMER_SECRET = PropertiesService.getScriptProperties().getProperty("CONSUMER_SECRET");
const ACCESS_TOKEN = PropertiesService.getScriptProperties().getProperty("ACCESS_TOKEN");
const ACCESS_TOKEN_SECRET = PropertiesService.getScriptProperties().getProperty("ACCESS_TOKEN_SECRET");

/**
 * ツイートを投稿する関数
 */
function postTweet(text) {
  const tweetText = "これはOAuth1.0aを使ったテスト投稿です";

  const url = "https://api.twitter.com/1.1/statuses/update.json";
  const params = {
    status: tweetText
  };

  const options = {
    method: "post",
    muteHttpExceptions: true,
    payload: params,
    headers: createOAuthHeader(url, params, "POST")
  };

  const response = UrlFetchApp.fetch(url, options);
  Logger.log(response.getContentText());
}

/**
 * OAuth 1.0a ヘッダー作成関数
 */
function createOAuthHeader(url, params, method) {
  const oauthParams = {
    oauth_consumer_key: CONSUMER_KEY,
    oauth_nonce: Utilities.getUuid().replace(/-/g, ''),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: Math.floor(new Date().getTime() / 1000),
    oauth_token: ACCESS_TOKEN,
    oauth_version: "1.0"
  };

  const allParams = Object.assign({}, params, oauthParams);
  const sortedKeys = Object.keys(allParams).sort();
  const paramString = sortedKeys.map(k => encodeURIComponent(k) + "=" + encodeURIComponent(allParams[k])).join("&");

  const baseString = [
    method.toUpperCase(),
    encodeURIComponent(url),
    encodeURIComponent(paramString)
  ].join("&");

  const signingKey = encodeURIComponent(CONSUMER_SECRET) + "&" + encodeURIComponent(ACCESS_TOKEN_SECRET);
  const signature = Utilities.computeHmacSha1Signature(baseString, signingKey);
  const signatureBase64 = Utilities.base64Encode(signature);

  oauthParams.oauth_signature = signatureBase64;

  const authHeader = "OAuth " + Object.keys(oauthParams).map(k => {
    return encodeURIComponent(k) + '="' + encodeURIComponent(oauthParams[k]) + '"';
  }).join(", ");

  return {
    Authorization: authHeader
  };
}

function check_limit(article_ID_list) {
    var limit_list = cache.get("limit");
    var last_article_ID_list = cache.get("article_ID_list"); // 統一
    var date = new Date();
    var today = date.getDate();

    if (limit_list == null) {
        limit_list = [today, 17];
    }

    if (limit_list[0] != today) {
        limit_list[0] = today;
        limit_list[1] = 17;
    }

    if (!last_article_ID_list) {
        last_article_ID_list = [];
    }

    if (limit_list[1] == 0) {
        cache.put("limit", limit_list, 21600);
        cache.put("article_ID_list", article_ID_list, 21600);
        return true;
    }

    for (const article of article_ID_list) {
        if (limit_list[1] == 0) {
            break;
        }

        if (last_article_ID_list.some(id => id[0] === article[0] && id[1] === article[1])) {
            continue;
        }

        postTweet(`${article[2]}｜${article[3]}\nhttps://note.com/${article[0]}/n/${article[1]}`); 
        last_article_ID_list.push(article);

        if (last_article_ID_list.length > 50 * HASHTAG_LIST.length) {
            last_article_ID_list.shift();
        }

        limit_list[1] -= 1;
    }

    cache.put("limit", limit_list, 21600);
    cache.put("article_ID_list", last_article_ID_list, 21600);
}

function main(){
    get_article_ID();
    check_limit(Article_ID_list);
}
