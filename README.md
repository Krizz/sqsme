# sqsme
Simple AWS SQS standard queue message receiver based on a generator


```
  const sqs = require("sqsme");
  (async () => {
    for await (const [messages, done] of sqs(
      `https://sqs...`
    )) {
      console.log(messages);
      await done();
    }
  })();
```
