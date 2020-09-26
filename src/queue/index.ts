import Bull from "bull";

import { setupProducers } from "./producers";
import { setupListeners } from "./listeners";
import { setupConsumers } from "./consumers";
import { askQuestion } from "../util";

// Import different jobs
import { house, senate } from "./jobs";

export interface Committee {
  title: string;
  link: string;
  date?: Date;
  time?: Date;
  text?: string;
  location?: string;
}

export const setupQueue = async () => {
  // Create an instance of the Bull queue: https://github.com/OptimalBits/bull
  try {
    var queue = new Bull("myQueue", {
      redis: {
        port: parseInt(process.env.REDIS_PORT as string),
        host: process.env.REDIS_URL,
        password: process.env.REDIS_PASSWORD,
      },
    });
  } catch (err) {
    console.error("Could not create queue.");
    throw err;
  }

  // Creates jobs by attaching them to queue. If in "scrape" mode, will set jobs w/out restrictions and will run immediately
  try {
    await setupProducers(queue, [...senate, ...house]);
  } catch (err) {
    console.error("Could not setup producers.");
    throw err;
  }

  // Set up listeners. These listeners will accept and process the strings supplied through REDIS by the consumers.
  try {
    await setupListeners(queue);
  } catch (err) {
    console.error("Could not setup listeners");
    throw err;
  }

  // If in development, prompt for running scrapers. Otherwise, run them automatically.
  process.env.NODE_ENV === "development" && (await askQuestion("Run scraper?"));

  try {
    setupConsumers(queue);
  } catch (err) {
    console.log("Could not run consumers");
  }
};
