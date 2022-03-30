var express = require('express');
const { createClient } = require('@supabase/supabase-js');
var request = require('request');
var app = express();
const cron = require('node-cron');
require('dotenv').config();


const TwitterApi = require('twitter-api-v2').default;
const twitterClient = new TwitterApi({
  clientId: process.env.TWITTER_CLIENT_ID,
  clientSecret: process.env.TWITTER_CLIENT_SECRET,
});


const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_API_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);


const callbackURL = process.env.CALLBACK_URL;



app.get('/auth', async function(req, res){
  const { url, codeVerifier, state } = twitterClient.generateOAuth2AuthLink(
    callbackURL,
    { scope: ['tweet.read', 'tweet.write', 'users.read', 'offline.access'] }
  );

  await supabase
  .from('access_token')
  .delete()
  .match({ id: "1" });

  const { data, error } = await supabase
  .from('access_token')
  .insert([
    { id: '1', code_verifier: codeVerifier }
  ]);

  res.redirect(url);
});

app.get('/callback', async function(req, res) {
  const { state, code } = req.query;

  const response_supabase = await supabase
  .from('access_token')
  .select()
  .match({id: '1'});

  console.log(response_supabase.data[0]);
  var code_verifier = response_supabase.data[0].code_verifier;


  const {
    client: loggedClient,
    accessToken,
    refreshToken,
  } = await twitterClient.loginWithOAuth2({
    code,
    codeVerifier : code_verifier,
    redirectUri: callbackURL,
  });

  await supabase
  .from('access_token')
  .update({ access_token: accessToken, refresh_token: refreshToken })
  .match({ id: '1' });

  const { data } = await loggedClient.v2.me(); // start using the client if you want

  
  res.send("Done");
});


app.get('/refresh_token', async function(req, res) {

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


  res.send("Done");
});

app.listen(process.env.PORT);