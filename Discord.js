function postToDiscord(text) {
    
    var WEBHOOK_URL = PropertiesService.getScriptProperties().getProperty("WEBHOOK_URL");
    const webhookUrl = `https://discord.com/api/webhooks/${WEBHOOK_URL}`;
    const messageContent = text;
  
    const payload = {
      content: messageContent
    };
  
    const options = {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload)
    };
  
    UrlFetchApp.fetch(webhookUrl, options);
  }
  
  function sendNewArticlesToDiscord(article_ID_list) {
    const cache = makeCache();
    let last_article_ID_list = cache.get("discord_article_ID_list");
  
    if (!last_article_ID_list) {
      last_article_ID_list = [];
    }
  
    for (const article of article_ID_list) {
      const alreadySent = last_article_ID_list.some(
        id => id[0] === article[0] && id[1] === article[1]
      );
  
      if (alreadySent) continue;
  
      var url = `https://note.com/${article[0]}/n/${article[1]}`;
      var text = `${article[2]}｜${article[3]}\n${url}`;
      postToDiscord(text);
  
      last_article_ID_list.push(article);
  
      if (last_article_ID_list.length > 300) {
        last_article_ID_list.shift();
      }
  
      Utilities.sleep(1000); // レート制限対策
      cache.put("discord_article_ID_list", last_article_ID_list, 21600);
    }
  
    cache.put("discord_article_ID_list", last_article_ID_list, 21600);
  }
  
  function main(){
    get_article_ID();
    sendNewArticlesToDiscord(Article_ID_list);
  }