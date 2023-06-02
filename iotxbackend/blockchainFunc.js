const abi = require("./abi.json");
const Web3 = require("web3");
const web3 = new Web3(
  "https://polygon-mumbai.g.alchemy.com/v2/qwI6nWN1DdnpMQ_3ZOxe0thDR3NHsLBD"
);
require("dotenv").config();

//reset db first
// const contractAddress = "0x94c986cCF3ac66873a474d951Dc17768E1f0ea6E";
const privateKey = process.env.PRIVATE_KEY;
web3.eth.accounts.wallet.add(privateKey);
const accountAddress = web3.eth.accounts.wallet[0].address;

const contract = new web3.eth.Contract(abi, contractAddress);

const userRegister = async (
  user_id,
  plat_number,
  nik,
  username,
  phone_number
) => {
  try {
    const tx = {
      from: accountAddress,
      to: contractAddress,
      gas: 150000,
      data: contract.methods
        .userRegister(user_id, plat_number, nik, username, phone_number)
        .encodeABI(),
    };

    const signature = await web3.eth.accounts.signTransaction(tx, privateKey);

    await web3.eth
      .sendSignedTransaction(signature.rawTransaction)
      .on("receipt", async (receipt) => {
        console.log("Blockchain user register status: ", receipt.status);
      });
    return "success";
  } catch (err) {
    console.log(err.message);
    return err;
  }
};

const topUpBalance = async (user_id, amount) => {
  try {
    const tx = {
      from: accountAddress,
      to: contractAddress,
      gas: 150000,
      data: contract.methods.topUpBalance(user_id, amount).encodeABI(),
    };

    const signature = await web3.eth.accounts.signTransaction(tx, privateKey);

    await web3.eth
      .sendSignedTransaction(signature.rawTransaction)
      .on("receipt", async (receipt) => {
        console.log("Blockchain top-up balance status: ", receipt.status);
      });

    return "success";
  } catch (err) {
    console.log(err.message);
    return err;
  }
};

const addOrder = async (user_id, order_id, time_enter) => {
  try {
    //ngga ada parameter price karena dari fungsi blockchain itu udah add 4000
    const tx = {
      from: accountAddress,
      to: contractAddress,
      gas: 150000,
      data: contract.methods
        .addOrder(user_id, order_id, time_enter)
        .encodeABI(),
    };

    const signature = await web3.eth.accounts.signTransaction(tx, privateKey);

    await web3.eth
      .sendSignedTransaction(signature.rawTransaction)
      .on("receipt", async (receipt) => {
        console.log("Blockchain check-in status: ", receipt.status);
      });

    return "success";
  } catch (err) {
    console.log(err.message);
    return err;
  }
};

const insertExit = async (order_id, time_exit, price) => {
  try {
    const tx = {
      from: accountAddress,
      to: contractAddress,
      gas: 150000,
      data: contract.methods.insertExit(order_id, time_exit, price).encodeABI(),
    };
    const signature = await web3.eth.accounts.signTransaction(tx, privateKey);

    await web3.eth
      .sendSignedTransaction(signature.rawTransaction)
      .on("receipt", async (receipt) => {
        console.log("Blockchain check-out status: ", receipt.status);
      });

    return "success";
  } catch (err) {
    console.log(err.message);
    return err;
  }
};

const getUserOrderInfo = async (user_id) => {
  try {
    const data = await contract.methods
      .getUserInfo(user_id)
      .call({ from: accountAddress });
    const newData = {
      user_id: parseInt(data.user_id),
      balance: parseInt(data.balance),
      plate_number: data.plate_number,
      nik: data.nik,
      username: data.username,
      phone_number: data.phone_number,
      order_list: data.order_id.map(function (str) {
        return parseInt(str);
      }),
    };
    return newData;
  } catch (err) {
    console.log(err.message);
    return err;
  }
};

const getOrderDetail = async (order_id) => {
  try {
    const data = await contract.methods
      .getOrderDetail(order_id)
      .call({ from: accountAddress });
    const newData = {
      user_id: parseInt(data.user_id),
      time_enter: parseInt(data.time_enter),
      time_exit: parseInt(data.time_exit),
      price: parseInt(data.price),
      status: parseInt(data.status),
    };
    return newData;
  } catch (err) {
    console.log(err.message);
    return err;
  }
};

// Uncomment this for test read data from contract
// getUserOrderInfo(1)
// getOrderDetail(1)

module.exports = {
  userRegister,
  topUpBalance,
  addOrder,
  insertExit,
  getUserOrderInfo,
  getOrderDetail,
};
