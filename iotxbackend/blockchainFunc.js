const abi = require("./abi.json");
const Web3 = require("web3");
const web3 = new Web3(window.ethereum);
require("dotenv").config();

const contractAddress = "0x01E42785E82bf8E037B0a3DB01EC0d47281fdCce";
const accountAddress = process.env.ACCOUNT_ADDRESS;
const privateKey = process.env.PRIVATE_KEY;

const contract = new web3.eth.Contract(abi, contractAddress);

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

const topUpBalance = async (user_id, amount) => {
  const tx = {
    from: accountAddress,
    to: contractAddress,
    gas: 150000,
    data: contract.methods.topUpBalance(user_id, amount).encodeABI(),
  };

  const signature = await web3.eth.accounts.signTransaction(tx, privateKey);

  web3.eth
    .sendSignedTransaction(signature.rawTransaction)
    .on("receipt", async (receipt) => {
      console.log(receipt);
    });
};

const addOrder = async (user_id, order_id, time_enter) => {
  //ngga ada parameter price karena dari fungsi blockchain itu udah add 4000
  const tx = {
    from: accountAddress,
    to: contractAddress,
    gas: 150000,
    data: contract.methods.addOrder(user_id, order_id, time_enter).encodeABI(),
  };

  const signature = await web3.eth.accounts.signTransaction(tx, privateKey);

  web3.eth
    .sendSignedTransaction(signature.rawTransaction)
    .on("receipt", async (receipt) => {
      console.log(receipt);
    });
};

const insertExit = async (order_id, time_exit, price) => {
  const tx = {
    from: accountAddress,
    to: contractAddress,
    gas: 150000,
    data: contract.methods.insertExit(order_id, time_exit, price).encodeABI(),
  };

  const signature = await web3.eth.accounts.signTransaction(tx, privateKey);

  web3.eth
    .sendSignedTransaction(signature.rawTransaction)
    .on("receipt", async (receipt) => {
      console.log(receipt);
    });
};

module.exports = { userRegister, topUpBalance, addOrder, insertExit };
