const { twitter, treshold, sleep } = require('./config');
const { ApiResponseError } = require('twitter-api-v2');

const deleteRetweets = async () => {
  const user = await twitter.v2.me();
  const retweets = await twitter.v2.userTimeline(user.data.id, { 'tweet.fields': 'created_at', 'exclude': 'tweets' });

  for await (const retweet of retweets) {
    try {
      if (Date.parse(retweet.created_at) <= treshold) {
        console.log(`Deleting retweet ${retweet.id}`);

        await twitter.v1.deleteTweet(retweet.id);
      }
    } catch (error) {
      if (error instanceof ApiResponseError && error.rateLimitError && error.rateLimit) {
        console.log('Rate limit hit, waiting for the timer reset (this can take up to 15 minutes)');
        await sleep(error.rateLimit.reset);
        continue
      }

      throw error;
    }
  }
}

deleteRetweets().catch((e) => console.log(e));
