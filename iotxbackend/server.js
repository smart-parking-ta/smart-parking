const express = require("express");
const bodyParser = require("body-parser");
const { pool } = require("./connectDB");
const app = express();
const abi = require("./abi.json");
const Web3 = require("web3");
const web3 = new Web3(
  "https://polygon-mumbai.g.alchemy.com/v2/qwI6nWN1DdnpMQ_3ZOxe0thDR3NHsLBD"
);
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const contractAddress = "0xf8d3A6F3154Ea108f11424CA8Bc401012E3dde07";
const accountAddress = "0x8De119dEc454624DcED3a48030d697b6E597446F";
const privateKey =
  "0190a15c2c10ee296432c781af4db3ce21668960155c516843102b728a03c0a0";

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

const insertExit = async () => {
  const order_id = 1;
  const time_exit = 81721872; // type unix timestamp
  const price = 5000;
  const status = 1; // type enum  0: not paid / 1: paid

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

//endpoint buat tes bisa terhubung ke database atau tidak
// app.get("/", async (req, res) => {
//   const result_query = await pool.query("SELECT * FROM parking_users");
//   res.json(result_query.rows[0]);
// });

//endpoint buat print res.json aja
// app.get("/", (req, res) => {
//   res.json("HOORAY");
// });

//Nanti fungsi ini digabung sama api endpoint register
// app.use(async function (req, res, next) {
//   await userRegister(1, "DK1234AB");
//   console.log("user registered");
//   next();
// });

//endpoint untuk login
app.post(
  "/checkIn",
  async (req, res, next) => {
    //mengambil data dari request.body
    const data = req.body;

    try {
      const authenticatedUser = await authenticateUserIn(data.plat_number);

      //jika user tidak ditemukan
      if (typeof authenticatedUser !== "object") {
        throw new Error(authenticatedUser);
      }

      //menandakan transaksi dimulai
      await pool.query("BEGIN;");

      //insert data ke tabel orders_detail dengan time_enter = NOW()
      const insert_result = await pool.query(
        `INSERT INTO orders_detail (user_id, time_enter, status) VALUES ('${authenticatedUser.user_id}', NOW(), 'NOT PAID') RETURNING *`
      );

      //menyimpan hasil data insert untuk selanjutnya digunakan di middleware selanjutnya
      req.insert_result_check_in = insert_result.rows[0];

      next();
    } catch (err) {
      pool.query("ROLLBACK;");
      res.status(401).send(err.message).end();
    }
  },
  async (req, res) => {
    // fungsi untuk mengirim data ke blockchain network
    // await addOrder(
    //   req.insert_result_check_in.user_id,
    //   req.insert_result_check_in.booking_id,
    //   req.insert_result_check_in.time_enter
    // );

    await pool.query("COMMIT;");
    res.status(201).send("check in berhasil").end();
  }
);

app.post(
  "/checkOut",
  async (req, res, next) => {
    //mengambil data dari request.body
    const data = req.body;

    try {
      const authenticatedUser = await authenticateUserOut(data.plat_number);

      if (typeof authenticatedUser !== "object") {
        throw new Error(authenticatedUser);
      }
      const price_rent_parking = authenticatedUser.price;

      pool.query("BEGIN;");
      //jika saldo user < dari price print saldo tidak cukup
      if (authenticatedUser.balance < price_rent_parking) {
        res.status(402).send("saldo tidak cukup");
        return;
      } else {
        //jika saldo user > dari price maka kurangi saldo user dengan price
        await pool.query(
          `UPDATE parking_users SET balance = balance - ${price_rent_parking} WHERE user_id = '${authenticatedUser.user_id}'`
        );

        //update status booking menjadi paid
        await pool.query(
          `UPDATE orders_detail SET status = 'PAID' WHERE booking_id = '${authenticatedUser.booking_id}'`
        );
      }

      next();
    } catch (err) {
      pool.query("ROLLBACK;");
      res.status(401).send(err.message).end();
    }
  },
  async (req, res) => {
    //fungsi untuk mengirim data ke blockchain network
    // await addOrder();

    pool.query("COMMIT;");
    res.status(202).send("check-out berhasil");
  }
);

//fungsi untuk otentikasi user saat keluar gerbang
async function authenticateUserOut(plat_number) {
  try {
    if (!plat_number) {
      throw new Error("plat_number is required");
    }
    if (typeof plat_number !== "string") {
      throw new Error("plat_number must be a string");
    }

    pool.query("BEGIN;");

    //memastikan kalau plat_number user terdaftar di database
    const result = await pool.query(
      `SELECT * FROM parking_users WHERE plat_number = '${plat_number}'`
    );

    //error handler jika plat_number tidak terdaftar di database
    if (!result || !result.rows || !result.rows.length) {
      throw new Error("Unauthorized User");
    }

    //mengambil data spesifik renting user terhadap sewa parkir
    const authenticate_user_result = await pool.query(
      `SELECT * FROM orders_detail WHERE user_id = '${result.rows[0].user_id}' AND status = 'NOT PAID'`
    );

    //error handler jika user tidak memiliki data sewa parkir yang belum dibayar
    if (
      !authenticate_user_result ||
      !authenticate_user_result.rows ||
      !authenticate_user_result.rows.length
    ) {
      throw new Error("there is no booking data from the user");
    }

    //query untuk edit time_exit
    await pool.query(
      `UPDATE orders_detail SET time_exit = NOW() WHERE booking_id = '${authenticate_user_result.rows[0].booking_id}'`
    );

    //ambil bagian dalam bentuk miliseconds dari time_exit dan time_enter
    const hour_time_exit_result = await pool.query(
      `SELECT EXTRACT(EPOCH FROM time_exit) * 1000 AS time_exit FROM orders_detail WHERE booking_id = '${authenticate_user_result.rows[0].booking_id}'`
    );
    const hour_time_enter_result = await pool.query(
      `SELECT EXTRACT(EPOCH FROM time_enter) * 1000 AS time_enter FROM orders_detail WHERE booking_id = '${authenticate_user_result.rows[0].booking_id}'`
    );

    // query untuk edit price
    const harga_tiket_parkir = await calculatePrice(
      hour_time_exit_result.rows[0].time_exit,
      hour_time_enter_result.rows[0].time_enter
    );

    if (harga_tiket_parkir == null) {
      throw new Error("Error in calculate price");
    }

    //query untuk update harga tiket parkir
    await pool.query(
      `UPDATE orders_detail SET price = ${harga_tiket_parkir} WHERE booking_id = '${authenticate_user_result.rows[0].booking_id}'`
    );

    //mengumpulkan data agar di tahap selanjutnya lebih mudah di-manipulasi
    const user_data = {
      booking_id: authenticate_user_result.rows[0].booking_id,
      user_id: authenticate_user_result.rows[0].user_id,
      time_enter: authenticate_user_result.rows[0].time_enter,
      time_exit: authenticate_user_result.rows[0].time_exit,
      price: authenticate_user_result.rows[0].price,
      status: authenticate_user_result.rows[0].status,
      balance: result.rows[0].balance,
    };

    pool.query("COMMIT;");
    return user_data;
  } catch (err) {
    pool.query("ROLLBACK;");
    return err.message;
  }
}

//fungsi untuk otentikasi user saat masuk gerbang berdasarkan plat_number mereka
async function authenticateUserIn(plat_number) {
  try {
    if (!plat_number) {
      throw new Error("plat_number is required");
    }
    if (typeof plat_number !== "string") {
      throw new Error("plat_number must be a string");
    }

    //menandakan transaksi dimulai --> keterangan dicomment karena mau migrasi kode
    // await pool.query("BEGIN;");

    const result = await pool.query(
      `SELECT * FROM parking_users WHERE plat_number = '${plat_number}'`
    );

    if (!result || !result.rows || !result.rows.length) {
      throw new Error("Unauthorized user");
    }

    //insert data ke tabel orders_detail dengan time_enter = NOW()
    // const insert_result = await pool.query(
    //   `INSERT INTO orders_detail (user_id, time_enter, status) VALUES ('${result.rows[0].user_id}', NOW(), 'NOT PAID') RETURNING *`
    // );

    //mau migrasi kode menjadi --> query insert ada langsung di endpoint check-in, dan pool query begin, commit, dan rollback di endpoint check-in juga
    //jika tidak ada error, maka dapat dilakukan commit
    // await pool.query("COMMIT;");
    //
    // return insert_result.rows[0];

    return result.rows[0];
  } catch (err) {
    //jika ada error, maka transaksi akan dirollback --> dicomment karena mau migrasi kode
    // await pool.query("ROLLBACK;");
    return err.message;
  }
}

async function calculatePrice(time_exit, time_enter) {
  try {
    //ini perlu ambil bagian jamnya aja

    //mencari selisih dalam milisecond
    const diffInMs = Math.abs(time_exit - time_enter);

    //convert selisih dalam milisecond ke dalam jam
    const diffInHours = Math.ceil(diffInMs / (1000 * 60 * 60));

    //4000 adalah initial harga parkingnya, dan sejam seterusnya akan dikenakan 2000
    const price = 4000 + (diffInHours - 1) * 2000;
    return price;
  } catch (err) {
    return;
  }
}

app.listen(process.env.PORT, () => {
  console.log(`Server started on port ${process.env.PORT}`);
});
