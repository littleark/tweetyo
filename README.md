tweetyo
=======
Due to time limitation and because I've already published something very similar (http://www.seaoftweets.com), I've only implemented the Option 2, regarding the 3-legs authorization.

###app.js###
1. 3-legs authorization
2. open the stream of tweets with Streaming API
3. web socket init
4. web socket emitting tweets as they come

###index.html###
1. button to Twitter authorization page

###tweets.html###
1. open the websocket connection and collect tweets


Note
-------
I'm not sure how much the 3-legs authorization makes sense in this case.
Everytime a user connects to the website, he will reset the current permanent connection to twitter, blocking the flow to restart a new connection. I don't see how having the app authorized by the user helps in the final goal of this app.

We want more users to see the same permament stream of tweets, the hardcoded way is probably the best solution in this case as it makes possible to create a permanent stream of tweets without interruptions.