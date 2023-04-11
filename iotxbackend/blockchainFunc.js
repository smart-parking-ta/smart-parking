const abi = require("./abi.json");
const Web3 = require("web3");
const web3 = new Web3(
  "https://polygon-mumbai.g.alchemy.com/v2/qwI6nWN1DdnpMQ_3ZOxe0thDR3NHsLBD"
);
require("dotenv").config();

const contractAddress = process.env.CONTRACT_ADDRESS;
const accountAddress = process.env.ACCOUNT_ADDRESS;
const privateKey = process.env.PRIVATE_KEY;

const contract = new web3.eth.Contract(abi, contractAddress);

const addOrder = async (user_id, order_id, time_enter, status = 0) => {
  //ngga ada parameter price karena dari fungsi blockchain itu udah add 4000
  const tx = {
    from: accountAddress,
    to: contractAddress,
    gas: 150000,
    data: contract.methods
      .addOrder(user_id, order_id, time_enter, status)
      .encodeABI(),
  };

  const signature = await web3.eth.accounts.signTransaction(tx, privateKey);

  web3.eth
    .sendSignedTransaction(signature.rawTransaction)
    .on("receipt", async (receipt) => {
      console.log(receipt);
    });
};

const userRegister = async (user_id, plat_number) => {
  const tx = {
    from: accountAddress,
    to: contractAddress,
    gas: 150000,
    data: contract.methods.userRegister(user_id, plat_number).encodeABI(),
  };

  const signature = await web3.eth.accounts.signTransaction(tx, privateKey);

  web3.eth
    .sendSignedTransaction(signature.rawTransaction)
    .on("receipt", async (receipt) => {
      console.log(receipt);
    });
};

const insertExit = async (order_id, time_exit, price, status = 1) => {
  const tx = {
    from: accountAddress,
    to: contractAddress,
    gas: 150000,
    data: contract.methods
      .insertExit(order_id, time_exit, price, status)
      .encodeABI(),
  };

  const signature = await web3.eth.accounts.signTransaction(tx, privateKey);

  web3.eth
    .sendSignedTransaction(signature.rawTransaction)
    .on("receipt", async (receipt) => {
      console.log(receipt);
    });
};

module.exports = { addOrder, userRegister, insertExit };
