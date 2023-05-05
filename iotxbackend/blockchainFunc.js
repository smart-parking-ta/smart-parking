const abi = require("./abi.json");
const Web3 = require("web3");
const web3 = new Web3("https://polygon-mumbai.g.alchemy.com/v2/qwI6nWN1DdnpMQ_3ZOxe0thDR3NHsLBD");
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

const getUserOrderInfo = async (user_id) => {
  const data = await contract.methods.userOrderInfo(user_id).call();
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
  const data = await contract.methods.ordersDetail(order_id).call();
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

// Uncomment this for test read data from contract
// getUserOrderInfo(1)
// getOrderDetail(1)

module.exports = { userRegister, topUpBalance, addOrder, insertExit, getUserOrderInfo, getOrderDetail };
