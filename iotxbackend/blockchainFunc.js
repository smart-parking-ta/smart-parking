const abi = require("./abi.json");
const Web3 = require("web3");
const web3 = new Web3("https://polygon-mumbai.g.alchemy.com/v2/qwI6nWN1DdnpMQ_3ZOxe0thDR3NHsLBD");
require("dotenv").config();

const contractAddress = "0x10b8F7820deB70a60c087Ad4e0056511dEdCEa87";
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

const getUserOrderInfo = async (user_id) => {
  const data = await contract.methods.getUserInfo(user_id).call();
  const newData = {
    user_id: parseInt(data.user_id),
    balance: parseInt(data.balance),
    plate_number: data.plate_number,
    order_list: data.order_id.map(function(str){return parseInt(str)}),
  }
  console.log(newData)
  return newData;
}

const getOrderDetail = async (order_id) => {
  const data = await contract.methods.getOrderDetail(order_id).call();
  const newData = {
    user_id: parseInt(data.user_id),
    time_enter: parseInt(data.time_enter),
    time_exit: parseInt(data.time_exit),
    price: parseInt(data.price),
    status: parseInt(data.status)
  }
  console.log(newData)
  return newData;
}

module.exports = { userRegister, topUpBalance, addOrder, insertExit, getUserOrderInfo, getOrderDetail };
