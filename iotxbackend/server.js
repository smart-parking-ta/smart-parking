const express = require("express");
const bodyParser = require("body-parser");
const { pool } = require("./connectDB");
const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

//endpoint buat tes bisa terhubung ke database atau tidak
// app.get("/", async (req, res) => {
//   const result_query = await pool.query("SELECT * FROM parking_users");
//   res.json(result_query.rows[0]);
// });

app.get("/", (req, res) => {
  res.json("HOORAY");
});

//endpoint untuk login
app.post("/checkIn", async (req, res) => {
  //mengambil data dari request.body
  const data = req.body;

  try {
    const authenticatedUser = await authenticateUserIn(data.plat_number);
    res.json(authenticatedUser).status(201);
    return authenticatedUser;
    //fungsi kirim data ke database
  } catch (err) {
    res.json("check-in gagal").status(404);
    return err;
  }
});

app.post("/checkOut", async (req, res) => {
  //mengambil data dari request.body
  const data = req.body;

  try {
    const authenticatedUser = await authenticateUserOut(data.plat_number);
    const price_rent_parking = authenticatedUser.price;

    pool.query("BEGIN;");
    //jika saldo user < dari price print saldo tidak cukup
    if (authenticatedUser.balance < price_rent_parking) {
      res.json("saldo tidak cukup");
      return "saldo tidak cukup";
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

    //buat testing
    pool.query("COMMIT;");

    res.json("check-out berhasil").status(201);
    return "check-out berhasil";
  } catch (err) {
    pool.query("ROLLBACK;");
    res.json("check-out gagal").status(404);
    return err;
  }
});

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
      return "authenticate user check-out failed";
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
      return "authenticate user check-out failed";
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
    return err;
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

    //menandakan transaksi dimulai
    await pool.query("BEGIN;");

    const result = await pool.query(
      `SELECT * FROM parking_users WHERE plat_number = '${plat_number}'`
    );

    if (!result || !result.rows || !result.rows.length) {
      return "authenticate user check-in failed";
    }

    //insert data ke tabel orders_detail dengan time_enter = NOW()
    await pool.query(
      `INSERT INTO orders_detail (user_id, time_enter, status) VALUES ('${result.rows[0].user_id}', NOW(), 'NOT PAID') RETURNING *`
    );

    //jika tidak ada error, maka dapat dilakukan commit
    await pool.query("COMMIT;");
    return result.rows[0];
  } catch (err) {
    //jika ada error, maka transaksi akan dirollback
    await pool.query("ROLLBACK;");
    return err;
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
    return err.message;
  }
}

app.listen(process.env.PORT, () => {
  console.log(`Server started on port ${process.env.PORT}`);
});
