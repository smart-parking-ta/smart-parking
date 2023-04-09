const { Pool } = require("pg");
require("dotenv").config();

// create a new pool of connections
// const pool = new Pool({
//   user: process.env.DB_USER,
//   host: process.env.INSTANCE_UNIX_SOCKET,
//   database: process.env.DB_NAME,
//   password: process.env.DB_PASS,
//   port: process.env.PORT_DB, // default PostgreSQL port
// });

//for development
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASS,
  port: process.env.PORT_DB, // default PostgreSQL port
});

/*FOR TESTING -----------(start here)
execute a simple query
pool.query("SELECT NOW()", (err, res) => {
  if (err) {
    console.error(err);
  } else {
    console.log(`PostgreSQL connected: ${res.rows[0].now}`);
  }
});

// close the pool of connections
pool.end();
----------------end here */

module.exports = { pool };
