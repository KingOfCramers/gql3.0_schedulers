import dotenv from "dotenv";
import path from "path";
console.log(process.env.NODE_ENV);
dotenv.config({
  path: path.resolve(__dirname, "..", `.${process.env.NODE_ENV}.env`),
});

import { connect } from "./mongodb/connect";
import { configureRedis } from "./redis";
import { setupQueue } from "./queue";
import { logger } from "./loggers/winston";

const runServer = async () => {
  try {
    await connect();
    console.log(`Connected to MongoDB at ${process.env.MONGODB_URI}.`);
  } catch (err) {
    logger.error(`Could not connect to MongoDB.`);
    throw err;
  }

  try {
    await configureRedis(); // Hoisted
    console.log(
      `Connected to Redis at url ${process.env.REDIS_URL}, cache flushed.`
    );
  } catch (err) {
    logger.error("Could not connect to Redis.");
    throw err;
  }

  try {
    await setupQueue();
    console.log(`Queue successfully established.`);
  } catch (err) {
    logger.error(`Could not setup queue.`);
    throw err;
  }
};

runServer()
  .then(() => console.log("Setup successful."))
  .catch((err) => {
    logger.error("Something went wrong. ", err);
    process.exit(1);
  });
