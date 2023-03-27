const { Pool } = require("pg");
require("dotenv").config();

// create a new pool of connections
const pool = new Pool({
  user: process.env.USER,
  host: process.env.HOST,
  database: process.env.DATABASE_NAME,
  password: process.env.PASSWORD,
  port: process.env.PORT, // default PostgreSQL port
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

//fungsi untuk otentikasi user berdasarkan plat_number mereka
async function authenticateUser(plat_number) {
  try {
    if (!plat_number) {
      throw new Error("plat_number is required");
    }
    if (typeof plat_number !== "string") {
      throw new Error("plat_number must be a string");
    }
    const query = `SELECT * FROM parkingUsers WHERE plat_number = '${plat_number}'`;
    const querySuccess = await pool.query(query, (err, result) => {
      if (err) {
        throw new Error("Internal Server Error");
      } else {
        try {
          if (result.rows.length > 0) {
            // console.log("login success");
            return "login success";
          } else {
            throw new Error("login failed");
          }
        } catch (err) {
          console.error(err.message);
          return err;
        }
      }
    });
    console.log("DISINI", querySuccess);
    return "login success";
  } catch (err) {
    console.error(err.message);
    return "login failed";
  }
}

console.log("ITS HERE", authenticateUser("DK1234A"));

module.exports = { authenticateUser };
