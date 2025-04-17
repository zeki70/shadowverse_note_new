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
  