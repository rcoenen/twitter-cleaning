const { twitter, treshold, sleep } = require('./config');
const { ApiResponseError } = require('twitter-api-v2');

const deleteReplies = async () => {
  const user = await twitter.v2.me();
  const replies = await twitter.v2.userTimeline(user.data.id, { 
    'tweet.fields': 'created_at,in_reply_to_user_id', 
    'exclude': 'retweets' 
  });

  let deletedCount = 0;

  for await (const tweet of replies) {
    try {
      if (tweet.in_reply_to_user_id && Date.parse(tweet.created_at) <= treshold) {
        console.log(`Deleting reply ${tweet.id}`);

        await twitter.v1.deleteTweet(tweet.id_str);
        deletedCount++;
      }
    } catch (error) {
      if (error instanceof ApiResponseError && error.rateLimitError && error.rateLimit) {
        console.log('Rate limit hit, waiting for the timer reset (this can take up to 15 minutes)');
        await sleep(error.rateLimit.reset);
        continue;
      }

      console.error(`Failed to delete reply ${tweet.id}: ${error.message}`);
    }
  }

  console.log(`Deleted ${deletedCount} replies`);
}

deleteReplies().catch((e) => console.log(e));
