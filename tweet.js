const { createClient } = require('@supabase/supabase-js');
const cron = require('node-cron');

require('dotenv').config();

var request = require('request');

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
const task = cron.schedule('0 */1 * * *', async function() {
  try {
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

    console.log(accessToken);

    request({
      url: 'https://icanhazdadjoke.com/',
      headers: {
        'Accept': 'application/json'
      }
    }, async function(error, response, body) {
        if (!error && response.statusCode == 200) {
            var responseObj = JSON.parse(body);
            const { data : dataTweet } = await refreshedClient.v2.tweet(
              responseObj.joke
            );
            bot.sendMessage(process.env.MSG_ID_TELE, "Nurdin Update Tweet : " + responseObj.joke);
        }
    });
  }
  catch (e) {
    bot.sendMessage(process.env.MSG_ID_TELE, "Nurdin Has Error Tweet : " + e.toString());
    var callbackLink = process.env.CALLBACK_URL;
    bot.sendMessage(process.env.MSG_ID_TELE, "Please Auth Again : " + callbackLink);
  }
});

task.start();