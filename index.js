const Client = require("ioredis");
const Redlock = require("redlock");
// const Automerge = require("automerge");

const redis = new Client();

const redlock = new Redlock(
  // You should have one client for each independent  node
  // or cluster.
  [redis],
  {
    // The expected clock drift; for more details see:
    // http://redis.io/topics/distlock
    driftFactor: 0.01, // multiplied by lock ttl to determine drift time

    // The max number of times Redlock will attempt to lock a resource
    // before erroring.
    retryCount: 10,

    // the time in ms between attempts
    retryDelay: 100, // time in ms

    // the max time in ms randomly added to retries
    // to improve performance under high contention
    // see https://www.awsarchitectureblog.com/2015/03/backoff.html
    retryJitter: 200, // time in ms

    // The minimum remaining time on a lock before an extension is automatically
    // attempted with the `using` API.
    automaticExtensionThreshold: 500, // time in ms
  }
);

redlock.on("error", (error) => {
  // Ignore cases where a resource is explicitly marked as locked on a client.
  if (error instanceof ResourceLockedError) {
    console.log(error);
    return;
  }

  // Log all other errors.
  console.error(error);
});

function range(start, end) {
  return Array(end - start + 1)
    .fill()
    .map((_, idx) => start + idx);
}

async function main() {
  console.log("Starting...");
  await redis.del("doc");

  const valuesToSet = range(1, 100);

  const allPromises = valuesToSet.map(
    (value) =>
      new Promise(async (resolve, reject) => {
        try {
          // Acquire a lock.
          let lock = await redlock.acquire(["a"], 5000);

          const docState = await redis.get("doc");

          if (docState) {
            const doc1 = JSON.parse(docState);
            const newDoc = {
              data: {
                ...doc1.data,
                [value]: 1,
              },
            };

            // Do something...
            // ioredis supports all Redis commands:
            console.log("Setting value", JSON.stringify(newDoc));
            await redis.set("doc", JSON.stringify(newDoc));
          } else {
            let newDoc = {
              data: {
                [value]: 1,
              },
            };

            console.log("newDoc", newDoc);

            // Do something...
            // ioredis supports all Redis commands:
            console.log("Setting value", JSON.stringify(newDoc));
            await redis.set("doc", JSON.stringify(newDoc));
          }

          // Release the lock.
          await lock.unlock();
          resolve(value);
        } catch (err) {
          console.error("Error when trying to set:", value);
          console.error(err);
          reject(err);
        }
      })
  );

  const res = await Promise.all(allPromises);
  console.log("res", res);

  const endResult = await redis.get("doc");
  console.log("value", endResult);

  // Check how many keys exist in the object - we want 100
  console.log(Object.keys(JSON.parse(endResult).data).length);

  await redis.del("doc");

  console.log("Completed");
  process.exit(0);
}

main();
