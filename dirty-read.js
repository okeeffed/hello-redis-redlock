const Client = require("ioredis");

const redis = new Client();

function range(start, end) {
  return Array(end - start + 1)
    .fill()
    .map((_, idx) => start + idx);
}

async function main() {
  console.log("Starting...");
  await redis.del("doc");

  // Initialise so that we have a base case to compare against
  let database = {
    data: {
      1: 1,
    },
  };
  await redis.set("doc", JSON.stringify(database));

  // Set an array from 1 - 100, we want an object that contains keys 1 - 100 with the value 1
  const valuesToSet = range(1, 100);

  const allPromises = valuesToSet.map(
    (value) =>
      new Promise(async (resolve, reject) => {
        try {
          // Read 'doc' from Redis
          const docState = await redis.get("doc");

          const doc1 = JSON.parse(docState);
          const newDoc = {
            data: {
              ...doc1.data,
              [value]: 1,
            },
          };

          console.log("Setting value", JSON.stringify(newDoc));
          await redis.set("doc", JSON.stringify(newDoc));

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
