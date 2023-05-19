const cron = require("node-cron");

//schedule tasks to be run on the server.
cron.schedule("*/10 * * * * *", function () {
  console.log("running a task every minute");
});
