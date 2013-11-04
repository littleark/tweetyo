var sys = require('sys');
var oauth = require('oauth');

var request = require('request'),
    qs = require('querystring');

var io = require('socket.io');
 
var express = require("express");

var app = express(),
    http = require('http'),
    server = http.createServer(app),
    io = require('socket.io').listen(server);

var twitterConsumerKey = "qk7nDq7uww8LUcDGg05IFw";
var twitterConsumerSecret = "jK6BuF7ewhsLi4uQhkK3eUU5qqkdsBefGucg3ajgAI";

var host="http://tweetyo.eu01.aws.af.cm";

var oa = new oauth.OAuth(
  "https://api.twitter.com/oauth/request_token",
  "https://api.twitter.com/oauth/access_token",
  twitterConsumerKey,
  twitterConsumerSecret,
  "1.0",
  host+"/auth/twitter/callback",
  "HMAC-SHA1"
);

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
  app.use(express.logger());
  app.use( express.cookieParser() );
  app.use( express.session( { secret: 'broken heater' } ) );
});

app.use(express.static(__dirname + '/www'))

app.get("/health",function (req, res) {
    res.send('1');
});

app.get("/tweets",function (req, res) {
  res.sendfile(__dirname + '/www/tweets.html');
});

app.get('/auth/twitter', function(req, res){

  oa.getOAuthRequestToken(function(error, oauth_token, oauth_token_secret, results){
    
    if (error) {
      console.log(error);
      res.send("OAuth Request Token Error");
    }
    else {
      req.session.oauth = {};
      req.session.oauth.token = oauth_token;
      console.log('oauth.token: ' + req.session.oauth.token);
      req.session.oauth.token_secret = oauth_token_secret;
      console.log('oauth.token_secret: ' + req.session.oauth.token_secret);
      res.redirect('https://twitter.com/oauth/authenticate?oauth_token='+oauth_token);
    }

  });
});

app.get('/auth/twitter/callback', function(req, res, next){

  if (req.session.oauth) {
    
    req.session.oauth.verifier = req.query.oauth_verifier;
    var oauth = req.session.oauth;

    oa.getOAuthAccessToken(
      oauth.token,
      oauth.token_secret,oauth.verifier, 
      function(error, oauth_access_token, oauth_access_token_secret, results){
        if (error){
          console.log(error);
          res.send("OAuth Access Token Error")
        } else {
          req.session.oauth.access_token = oauth_access_token;
          req.session.oauth.access_token_secret = oauth_access_token_secret;
          console.log(results);
          //res.send("worked. nice one.");

          var params={
            delimeted:"length",
            track:"london"
          };

          var twitter_req=request.post({
            url: "https://stream.twitter.com/1.1/statuses/filter.json?"+qs.stringify(params),
            oauth:{
              consumer_key: twitterConsumerKey,
              consumer_secret: twitterConsumerSecret,
              token: oauth_access_token,
              token_secret: oauth_access_token_secret
            },
            headers:{ 
              "User-Agent": 'TweetYo',
              "Connection": 'Keep-Alive'
            },
            encoding:'utf8',
            //proxy:PROXY, //using request as it makes easy to work with proxies
            json:true
          },function(e,r,data) {
            if(e) {
              console.log("errore",e);
            }
            console.log(r);
          });

          twitter_req.on("data",function(data) {

            try {
              var t = JSON.parse(data.toString('utf8')),
                  tweet={
                    d:t.created_at,
                    t:t.text,
                    u:t.user.screen_name
                  };

              io.sockets.emit("tweet",tweet);

            } catch(e) {
              console.log("parsing error",data,e);
              return; //go on
            }

          });

          res.redirect(host+"/tweets.html");

        }
      }
    );

  } else {
    next(new Error("Probably something went wrong..."))
  }
});

//STARTING THE WEB SOCKET WITH SOCKET.IO
io = require('socket.io').listen(server,{origins:'*:*',log:false});
io.sockets.on('connection', function (socket) {
  
  console.log("user connected","connections:",io.sockets.clients().length)

  io.sockets.emit('open', { status: 'connected'});
  
  socket.on('disconnect', function () {
    console.log("user disconnected","connections:",io.sockets.clients().length)
    io.sockets.emit('user disconnected');
  });

});

server.listen(parseInt(process.env.VMC_APP_PORT || 1337));
console.log("listening on port ",parseInt(process.env.VMC_APP_PORT || 1337));