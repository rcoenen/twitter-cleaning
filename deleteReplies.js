const { twitter, treshold, sleep } = require('./config');
const { ApiResponseError } = require('twitter-api-v2');

const deleteReplies = async () => {
  const user = await twitter.v2.me();
  const replies = await twitter.v2.userTimeline(user.data.id, { 
    'tweet.fields': 'created_at', 
    'exclude': 'retweets' 
  });

  let deletedCount = 0;

  for await (const reply of replies) {
    try {
      if (reply.in_reply_to_status_id && Date.parse(reply.created_at) <= treshold) {
        console.log(`Deleting reply ${reply.id}`);

        await twitter.v1.deleteTweet(reply.id_str);
        deletedCount++;
      }
    } catch (error) {
      if (error instanceof ApiResponseError && error.rateLimitError && error.rateLimit) {
        console.log('Rate limit hit, waiting for the timer reset (this can take up to 15 minutes)');
        await sleep(error.rateLimit.reset);
        continue;
      }

      throw error;
    }
  }

  console.log(`Deleted ${deletedCount} replies`);
}

deleteReplies().catch((e) => console.log(e));
