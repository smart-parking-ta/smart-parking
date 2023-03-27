const express = require("express");
const bodyParser = require("body-parser");
const { authenticateUser } = require("./connectDB");

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.post("/send-data", (req, res) => {
  const data = req.body;

  // Do something with the data here

  //   console.log(data.plat_number);

  try {
    // authenticateUser(data.plat_number);
    console.log(authenticateUser(data.plat_number));
  } catch (err) {
    console.log(err);
    res.send("failed to receive data");
  }
});

app.listen(3000, () => {
  console.log("Server started on port 3000");
});
