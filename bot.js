const { createClient } = require('@supabase/supabase-js');
const cron = require('node-cron');

require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_API_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const TwitterApi = require('twitter-api-v2').default;
const twitterClient = new TwitterApi({
  clientId: process.env.TWITTER_CLIENT_ID,
  clientSecret: process.env.TWITTER_CLIENT_SECRET,
});


const TelegramBot = require('node-telegram-bot-api');
const token = process.env.TELEGRAM_TOKEN;

const bot = new TelegramBot(token, {polling: true});

bot.on('message', async (msg) => {
  if (msg.text.toString().toLowerCase().includes("refresh_token")) {

  console.log(msg);
      const { data, error } = await supabase
      .from('access_token')
      .select()
      .match({id: '1'})

      var refreshToken = data[0].refresh_token;

      const {
        client: refreshedClient,
        accessToken,
        refreshToken: newRefreshToken,
      } = await twitterClient.refreshOAuth2Token(refreshToken);

      await supabase
      .from('access_token')
      .update({ access_token: accessToken, refresh_token: newRefreshToken })
      .match({ id: '1' });

      bot.sendMessage(msg.chat.id, "Nurdin Refresh Token Done");

  } else if(msg.text.toString().toLowerCase().includes("auth")) {
    var callbackLink = process.env.CALLBACK_URL;
    bot.sendMessage(msg.chat.id, "Please Auth Again : " + callbackLink);
  }

});

