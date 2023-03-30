const {
  SQSClient,
  ReceiveMessageCommand,
  DeleteMessageCommand,
} = require("@aws-sdk/client-sqs");

module.exports = async function* reserveJob(queueURL, options) {
  const region = queueURL.match(/sqs\.(?<region>([a-z0-9-]+))/i).groups?.region;
  if (!region)
    throw new Error(
      "Invalid queue URL, no region found. https://sqs.(region).amazonaws..."
    );

  const sqsClient = new SQSClient({
    region,
  });

  const defaultOptions = {
    MaxNumberOfMessages: 10,
    WaitTimeSeconds: 20,
  };

  while (true) {
    try {
      const command = new ReceiveMessageCommand({
        QueueUrl: queueURL,
        ...defaultOptions,
        ...options,
      });

      const { Messages } = await sqsClient.send(command);
      const messageHandles = Messages.map((message) => message.ReceiptHandle);

      yield [
        Messages,
        async function messagesHandled() {
          return Promise.all(
            messageHandles.map((messageHandle) => {
              const deleteCommand = new DeleteMessageCommand({
                QueueUrl: queueURL,
                ReceiptHandle: messageHandle,
              });
              return sqsClient.send(deleteCommand);
            })
          );
        },
      ];
    } catch (err) {
      console.error(err);
    }
  }
};
