const express = require("express");
const bodyParser = require("body-parser");
const { pool } = require("./connectDB");
const {
  userRegister,
  topUpBalance,
  addOrder,
  insertExit,
  getUserOrderInfo,
  getOrderDetail,
} = require("./blockchainFunc");
const { connectMqtt } = require("./connectMqtt");

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

//endpoint buat tes bisa terhubung ke database atau tidak
// app.get("/", async (req, res) => {
//   const result_query = await pool.query("SELECT * FROM parking_users");
//   res.json(result_query.rows[0]);
// });

//endpoint buat print res.json aja
// app.get("/", (req, res) => {
//   res.json("HOORAY");
// });

app.get("/testErrorCode", (req, res) => {
  try {
    let string = "beyblade";
    if (string == "beyblade") {
      // const error = new Error("Unauthorized User");
      // error.code = "409";
      // throw error;
      throw new Error("Unathorized User");
    }

    res.status(200).send("OKE BANGET").end();
  } catch (err) {
    res.status(400).send(err).end();
  }
});

//fungsi untuk menjadikan segala number yang length < 2, ditambahkan 0 di depan angka tersebut
function padTo2Digits(num) {
  return num.toString().padStart(2, "0");
}

//endpoint untuk restore database (parking_users dan orders_detail) dari blockchain ke database
app.post("/retrieveBlockchain", async (req, res) => {
  //MULAI DARI SINI

  try {
    //Menghapus semua data di blockchain
    await pool.query(`TRUNCATE TABLE parking_users CASCADE`);

    //variable yang merepresentasikan id user
    let user_id = 1;

    let parking_user = await getUserOrderInfo(user_id);
    //looping dari tiap user yang ada
    while (parking_user.plate_number !== "") {
      //variable untuk menyimpan booking list dari tiap user
      const orders_user = parking_user.order_list;

      //insert parking_user ke database
      await pool.query(
        `INSERT INTO parking_users (user_id, plat_number, balance) VALUES ('${parking_user.user_id}','${parking_user.plate_number}', '${parking_user.balance}') RETURNING *`
      );

      //dari tiap user, dilooping lagi dari order_list
      for (let i = 0; i < orders_user.length; i++) {
        //menyimpan hasil getOrderDetail (function blockchain) ke variable getOrder
        const getOrder = await getOrderDetail(orders_user[i]);
        const booking_id = orders_user[i];

        //convert waktu time_enter dan time_exit dalam bentuk timestamp YY-MM-DD hh-mm-ss
        const time_enter_unixTimeStamp = getOrder.time_enter;
        const time_exit_unixTimeStamp = getOrder.time_exit;

        //mengubah unixtimestamp menjadi timestamp
        const dateEnter = new Date(time_enter_unixTimeStamp * 1000);
        const dateExit = new Date(time_exit_unixTimeStamp * 1000);

        //mendapatkan waktu dalam jam, menit, dan detik
        const hoursEnter = dateEnter.getHours();
        const minutesEnter = dateEnter.getMinutes();
        const secondsEnter = dateEnter.getSeconds();

        const hoursExit = dateExit.getHours();
        const minutesExit = dateExit.getMinutes();
        const secondsExit = dateExit.getSeconds();

        //meng-arrange waktu menjadi hh-mm-ss
        const timeEnter = `${padTo2Digits(hoursEnter)}:${padTo2Digits(
          minutesEnter
        )}:${padTo2Digits(secondsEnter)}`;

        const timeExit = `${padTo2Digits(hoursExit)}:${padTo2Digits(
          minutesExit
        )}:${padTo2Digits(secondsExit)}`;

        //mengambil yang sebelumnya bentuk Date, menjadi masing-masing (tahun, bulan, dan hari)
        const yearEnter = dateEnter.getFullYear();
        const monthEnter = padTo2Digits(dateEnter.getMonth() + 1);
        const dayEnter = padTo2Digits(dateEnter.getDate());

        const yearExit = dateExit.getFullYear();
        const monthExit = padTo2Digits(dateExit.getMonth() + 1);
        const dayExit = padTo2Digits(dateExit.getDate());

        //meng-arrange date menjadi terurut YY-MM-DD
        const dateTimeEnter = `${yearEnter}-${monthEnter}-${dayEnter} ${timeEnter}`;
        const dateTimeExit = `${yearExit}-${monthExit}-${dayExit} ${timeExit}`;

        //query untuk insert ke database

        //hash map untuk mengconvert data status paid/ not paid dari blockchain yg merupakan enum 1 atau 0 menjadi "PAID" atau "NOT PAID"
        const hashPaidNotPaid = {
          1: "PAID",
          0: "NOT PAID",
        };

        //query insert orders_detail ke db
        await pool.query(
          `INSERT INTO orders_detail (booking_id, user_id, time_enter, time_exit, price, status) VALUES ('${booking_id}','${
            getOrder.user_id
          }', '${dateTimeEnter}', '${dateTimeExit}', '${getOrder.price}','${
            hashPaidNotPaid[getOrder.status]
          }') RETURNING *`
        );
      }

      //Menyesuaikan sequence primary key dari masing-masing tabel di database
      await pool.query(
        `SELECT setval('parking_users_user_id_seq', (SELECT MAX(user_id) FROM parking_users)+1);`
      );

      await pool.query(
        `SELECT setval('orders_detail_booking_id_seq', (SELECT MAX(booking_id) FROM orders_detail)+1);`
      );

      //beralih ke indeks berikutnya pada parking user index
      user_id++;
      parking_user = await getUserOrderInfo(user_id);
    }

    // Drawbacks dari algoritma di atas adalah O(n^2)

    res.status(200).send("success").end();
  } catch (err) {
    console.log(err.message);
    res.status(404).send("failed").end();
  }
});

//endpoint untuk topup balance di database dan blockchain
app.post(
  "/topUpBalance",
  async (req, res, next) => {
    try {
      const data = req.body;

      //validasi data yang diterima
      if (!data.user_id || !data.amount) {
        throw new Error("user_id and amount is required");
      }
      if (data.amount <= 0) {
        throw new Error("amount must be greater than 0");
      }

      if (typeof data.user_id !== "number" || typeof data.amount !== "number") {
        throw new Error("type of user_id and amount must be number");
      }

      //transaksi db dimulai
      await pool.query("BEGIN;");

      //insert balance ke database berdasarkan user_id
      await pool.query(
        `UPDATE parking_users SET balance = balance + ${data.amount} WHERE user_id = ${data.user_id}`
      );

      //simpan data yang diterima ke req.data_request_body
      req.data_request_body = data;

      //jika berhasil maka next ke middleware berikutnya
      next();
    } catch (err) {
      //jika ada error maka masuk ke catch, return error dan transaksi db di rollback
      await pool.query("ROLLBACK;");
      res.status(406).send(err.message).end();
    }
  },
  async (req, res) => {
    try {
      //fungsi untuk topup balance ke blockchain
      await topUpBalance(
        req.data_request_body.user_id,
        req.data_request_body.amount
      );

      //jika berhasil maka commit transaksi db, jika gagal masuk ke catch
      await pool.query("COMMIT;");

      res.status(202).send("top up balance berhasil").end();
    } catch (err) {
      //jika ada error maka masuk ke catch, return error dan transaksi db di rollback
      await pool.query("ROLLBACK;");

      res.status(406).send(err.message).end();
    }
  }
);

//endpoint untuk register users (ini masih mentah banget, ga ada autentikasi 2 faktor dll)
app.post(
  "/register",
  async (req, res, next) => {
    try {
      const data = req.body;

      //validasi data yang diterima
      if (!data.plat_number) {
        throw new Error("plate_number is required");
      }
      if (typeof data.plat_number !== "string") {
        throw new Error("type of plate_number must be string");
      }

      await pool.query("BEGIN;");

      //fungsi untuk insert user ke database
      const insert_result = await pool.query(
        `INSERT INTO parking_users (plat_number) VALUES ('${data.plat_number}') RETURNING *`
      );
      req.insert_result_register = insert_result.rows[0];

      next();
    } catch (err) {
      await pool.query("ROLLBACK;");
      res.status(409).send(err.message).end();
    }
  },
  async (req, res) => {
    try {
      //fungsi untuk register user ke blockchain
      await userRegister(
        req.insert_result_register.user_id,
        req.insert_result_register.plat_number
      );

      await pool.query("COMMIT;");
      res.status(201).send("register berhasil").end();
    } catch (err) {
      await pool.query("ROLLBACK;");
      res.status(409).send(err.message).end();
    }
  }
);

//endpoint untuk login users
//sementara gausa pake middleware connectMqtt buat tes retrieve blockchain
app.post(
  "/checkIn",
  connectMqtt,
  async (req, res, next) => {
    //mengambil data dari request.body
    const data = req.body;

    try {
      //hasil return dari fungsi authenticateUserIn
      console.time("authenticateUser");
      const authenticatedUser = await authenticateUserIn(data.plat_number);

      console.timeEnd("authenticateUser");
      //jika user tidak ditemukan
      if (typeof authenticatedUser !== "object") {
        throw new Error(authenticatedUser);
      }

      //menandakan transaksi dimulai
      console.time("queryInsert");
      await pool.query("BEGIN;");

      //insert data ke tabel orders_detail dengan time_enter = NOW()
      const insert_result = await pool.query(
        `INSERT INTO orders_detail (user_id, time_enter, status) VALUES ('${authenticatedUser.user_id}', NOW(), 'NOT PAID') RETURNING *`
      );

      console.timeEnd("queryInsert");

      //menyimpan hasil data insert untuk selanjutnya digunakan di middleware selanjutnya
      req.insert_result_check_in = insert_result.rows[0];

      next();
    } catch (err) {
      await pool.query("ROLLBACK;");
      res.status(401).send(err.message).end();
    }
  },
  async (req, res) => {
    try {
      //mengubah waktu dengan format timestamp menjadi unix timestamp
      console.time("configureTime");
      let date_when_check_in = new Date(req.insert_result_check_in.time_enter);
      let time_enter_unixTimeStamp = Math.floor(
        date_when_check_in.getTime() / 1000
      );
      console.timeEnd("configureTime");

      console.time("blockchainFunction1");
      // fungsi untuk mengirim data ke blockchain network
      const blockchainAddOrder = await addOrder(
        req.insert_result_check_in.user_id,
        req.insert_result_check_in.booking_id,
        time_enter_unixTimeStamp
      );
      console.timeEnd("blockchainFunction1");

      console.time("blockchainFunction2");
      if (blockchainAddOrder != "success") {
        throw new Error(blockchainAddOrder);
      }
      console.timeEnd("blockchainFunction2");

      // fungsi untuk mengirim data ke mqtt broker sehingga gerbang bisa terbuka
      console.time("mqttFunc");
      const mqttClient = req.mqtt;
      mqttClient.publish(
        "backend/checkIn",
        "OPEN",
        { qos: 1, retain: true },
        (error) => {
          if (error) {
            throw new Error(error);
          }
        }
      );
      mqttClient.publish(
        "esp32/oledIn",
        "201",
        { qos: 1, retain: true },
        (error) => {
          if (error) {
            throw new Error(error);
          }
        }
      );

      console.timeEnd("mqttFunc");
      await pool.query("COMMIT;");
      res.status(201).send("check in berhasil").end();
    } catch (err) {
      await pool.query("ROLLBACK;");
      res.status(401).send(err.message).end();
    }
  }
);

//endpoint untuk logout users
//sementara gausa pake middleware connectMqtt buat tes retrieve blockchain
app.post(
  "/checkOut",
  connectMqtt,
  async (req, res, next) => {
    //mengambil data dari request.body
    const data = req.body;

    try {
      //hasil return dari fungsi authenticateUserOut
      const authenticatedUser = await authenticateUserOut(data.plat_number);
      if (typeof authenticatedUser !== "object") {
        throw new Error(authenticatedUser);
      }
      const price_rent_parking = authenticatedUser.price;

      await pool.query("BEGIN;");
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

      req.booking_data_to_alter = authenticatedUser;
      next();
    } catch (err) {
      await pool.query("ROLLBACK;");
      res.status(401).send(err.message).end();
    }
  },
  async (req, res) => {
    try {
      //mengubah waktu time exit dengan format timestamp menjadi unix timestamp
      let date_when_check_out = new Date(req.booking_data_to_alter.time_exit);
      let time_exit_unixTimeStamp = Math.floor(
        date_when_check_out.getTime() / 1000
      );

      //fungsi untuk mengirim data ke blockchain network
      const blockchainInsertExit = await insertExit(
        req.booking_data_to_alter.booking_id,
        time_exit_unixTimeStamp,
        req.booking_data_to_alter.price
      );

      if (blockchainInsertExit != "success") {
        throw new Error(blockchainInsertExit);
      }

      //fungsi untuk mengirim data ke mqtt broker sehingga gerbang bisa terbuka
      const mqttClient = req.mqtt;
      mqttClient.publish(
        "backend/checkOut",
        "OPEN",
        { qos: 1, retain: true },
        (error) => {
          if (error) {
            throw new Error(error);
          }
        }
      );

      await pool.query("COMMIT;");
      res.status(202).send("check-out berhasil");
    } catch (err) {
      await pool.query("ROLLBACK;");
      res.status(401).send(err.message).end();
    }
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

    await pool.query("BEGIN;");

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

    //mengambil data spesifik renting user terhadap sewa parkir
    const recent_authenticate_user_result = await pool.query(
      `SELECT * FROM orders_detail WHERE user_id = '${result.rows[0].user_id}' AND status = 'NOT PAID'`
    );
    //mengumpulkan data agar di tahap selanjutnya lebih mudah di-manipulasi
    const user_data = {
      booking_id: recent_authenticate_user_result.rows[0].booking_id,
      user_id: recent_authenticate_user_result.rows[0].user_id,
      time_enter: recent_authenticate_user_result.rows[0].time_enter,
      time_exit: recent_authenticate_user_result.rows[0].time_exit,
      price: recent_authenticate_user_result.rows[0].price,
      status: recent_authenticate_user_result.rows[0].status,
      balance: result.rows[0].balance,
    };

    await pool.query("COMMIT;");
    return user_data;
  } catch (err) {
    await pool.query("ROLLBACK;");
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

    const result = await pool.query(
      `SELECT * FROM parking_users WHERE plat_number = '${plat_number}'`
    );

    if (!result || !result.rows || !result.rows.length) {
      throw new Error("Unauthorized user");
    }

    const user_id = result.rows[0].user_id;

    const isUserAlreadyIn = await pool.query(
      `SELECT * FROM orders_detail WHERE user_id = '${user_id}' AND status = 'NOT PAID'`
    );

    if (isUserAlreadyIn.rows.length) {
      throw new Error("User already in");
    }

    return result.rows[0];
  } catch (err) {
    return err.message;
  }
}

//fungsi untuk menghitung harga penyewaan parkir berdasarkan waktu masuk dan keluar
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
