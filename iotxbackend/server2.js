const axios = require("axios");
function callAPI() {
  axios
    .post("http://localhost:8080/login", {
      phone_number: "62123457890",
    })
    .then((response) => {
      // Handle the response data
      const data = response.data;
      console.log(data);
    })
    .catch((error) => {
      // Handle the error
      console.log(error);
    });
}
callAPI();
