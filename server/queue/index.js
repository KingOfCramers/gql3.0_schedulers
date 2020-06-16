import Bull from "bull";

import { logger } from "../loggers/winston";

import { setupProducers } from "./producers";
import { setupListeners } from "./listeners";

// Different job types
import jobs from "./jobs/jobs";
import unlimited from "./jobs/unlimited";

//console.log(unlimited.map((x) => x.phaseOne));

export const setupQueue = async () => {
  try {
    var queue = new Bull("myQueue", {
      redis: {
        port: process.env.REDIS_PORT,
        host: process.env.REDIS_URL,
        password: process.env.REDIS_PASSWORD,
      },
    });
    logger.info("Created new queue.");
  } catch (err) {
    logger.error("Could not create queue.");
    throw err;
  }

  try {
    await setupProducers(
      queue,
      process.env.SCRAPE === "true" ? unlimited : jobs
    );
  } catch (err) {
    logger.error("Could not setup producers.");
    throw err;
  }

  // Setup consumers elsewhere for scalability

  try {
    await setupListeners(queue);
  } catch (err) {
    logger.error("Could not setup listeners");
    throw err;
  }
};
