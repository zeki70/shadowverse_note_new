const cache = makeCache();
// スクリプトプロパティなどから取得してもOK
const CONSUMER_KEY = PropertiesService.getScriptProperties().getProperty("CONSUMER_KEY");
const CONSUMER_SECRET = PropertiesService.getScriptProperties().getProperty("CONSUMER_SECRET");
const ACCESS_TOKEN = PropertiesService.getScriptProperties().getProperty("ACCESS_TOKEN");
const ACCESS_TOKEN_SECRET = PropertiesService.getScriptProperties().getProperty("ACCESS_TOKEN_SECRET");
const CLIENT_ID = PropertiesService.getScriptProperties().getProperty("CLIENT_ID");
const CLIENT_SECRET = PropertiesService.getScriptProperties().getProperty('CLIENT_SECRET');
const endpoint2 = "https://api.twitter.com/2/tweets";

function postTweet(text){

  let service = getService();
  if (service.hasAccess()) {   
    let message = {
      text: text
    }

    const headers = {
      Authorization: 'Bearer ' + service.getAccessToken()
    }
    const response = UrlFetchApp.fetch(endpoint2, {
      method: "post",
      headers,
      muteHttpExceptions: true,
      payload: JSON.stringify(message),
      contentType: "application/json"
    });

    const result = JSON.parse(response.getContentText());

    Logger.log(JSON.stringify(result, null, 2));
    
  } else {
    Logger.log("Not Authorized");
    return null;
  }
}


function getService() {//認証
  pkceChallengeVerifier();
  const userProps = PropertiesService.getUserProperties();
  const scriptProps = PropertiesService.getScriptProperties();
  const clientId = scriptProps.getProperty('CLIENT_ID');
  const clientSecret = scriptProps.getProperty('CLIENT_SECRET');

  return OAuth2.createService('twitter')
    .setAuthorizationBaseUrl('https://twitter.com/i/oauth2/authorize')
    .setTokenUrl('https://api.twitter.com/2/oauth2/token?code_verifier=' + userProps.getProperty("code_verifier"))
    .setClientId(clientId)
    .setClientSecret(clientSecret)
    .setCallbackFunction('authCallback')
    .setPropertyStore(userProps)
    .setScope('users.read tweet.read tweet.write offline.access')
    .setParam('response_type', 'code')
    .setParam('code_challenge_method', 'S256')
    .setParam('code_challenge', userProps.getProperty("code_challenge"))
    .setTokenHeaders({
      'Authorization': 'Basic ' + Utilities.base64Encode(clientId + ':' + clientSecret),
      'Content-Type': 'application/x-www-form-urlencoded'
    })
}

function authCallback(request) {
  const service = getService();
  const authorized = service.handleCallback(request);
  if (authorized) {
    return HtmlService.createHtmlOutput('Success!');
  } else {
    return HtmlService.createHtmlOutput('Denied.');
  }
}

function pkceChallengeVerifier() {
  var userProps = PropertiesService.getUserProperties();
  if (!userProps.getProperty("code_verifier")) {
    var verifier = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";

    for (var i = 0; i < 128; i++) {
      verifier += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    var sha256Hash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, verifier)

    var challenge = Utilities.base64Encode(sha256Hash)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')
    userProps.setProperty("code_verifier", verifier)
    userProps.setProperty("code_challenge", challenge)
  }
}

function logRedirectUri() {
  var service = getService();
  Logger.log(service.getRedirectUri());
}


function first() {//初回認証
  const service = getService();
  if (service.hasAccess()) {
    Logger.log("Already authorized");
  } else {
    const authorizationUrl = service.getAuthorizationUrl();
    Logger.log('Open the following URL and re-run the script: %s', authorizationUrl);
  }
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
