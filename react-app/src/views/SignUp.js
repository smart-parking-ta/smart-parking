import { useEffect, useState } from "react";
import { sendOTP } from "../components/OTP";
import { useNavigate } from "react-router-dom";
import { register } from "../components/connectBE";

function SignUp() {
  const [nik, setNik] = useState("");
  const [nopol, setNopol] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const b = localStorage.getItem("user_id");
    console.log("b", b);

    if (b != null) {
      navigate("/dashboard");
    }
  }, []);

  async function onSignUpSubmit(e) {
    e.preventDefault();
    console.log("button clicked");
    const isCorrectAuth = await register(nopol, nik, phoneNumber);
    if (isCorrectAuth) {
      await sendOTP("+" + phoneNumber);
      navigate("/confirm-otp");
    } else {
      alert("Not valid nik");
    }
  }
  return (
    <div class="w-full max-w-sm">
      <form
        class="shadow-md rounded-[12px] px-8 pt-6 pb-8 mb-4 bg-gradient-to-r g-gradient-to-b from-teal-200 to-blue-50 shadow-lg rounded-lg"
        onSubmit={onSignUpSubmit}
      >
        <div class="mb-4">
          <label
            class="block text-gray-700 text-xs font-bold mb-2"
            for="username"
          >
            Nomor Induk Kependudukan
          </label>
          <input
            onChange={(e) => setNik(e.target.value)}
            type="number"
            class="shadow appearance-none border rounded-full py-3 px-4 text-xs text-gray-700 font-medium leading-tight focus:outline-none focus:shadow-outline"
            placeholder="Masukkan NIK"
            required
          />
        </div>
        <div class="mb-4">
          <label
            class="block text-gray-700 text-xs font-bold mb-2"
            for="password"
          >
            Nomor Polisi Kendaraan
          </label>
          <input
            onChange={(e) => setNopol(e.target.value)}
            type="text"
            class="shadow appearance-none border rounded-full py-3 px-4 text-xs text-gray-700 font-medium leading-tight focus:outline-none focus:shadow-outline"
            placeholder="Masukkan Nopol"
            required
          />
        </div>
        <div class="mb-4">
          <label
            class="block text-gray-700 text-xs font-bold mb-2"
            for="password"
          >
            Nomor Hp
          </label>
          <input
            onChange={(e) => setPhoneNumber(e.target.value)}
            type="number"
            class="shadow appearance-none border rounded-full py-3 px-4 text-xs text-gray-700 font-medium leading-tight focus:outline-none focus:shadow-outline"
            placeholder="Masukkan No. Hp"
            required
          />
        </div>
        <div class="flex items-center justify-center">
          <button
            id="sign-in-button"
            class="bg-[#445263] hover:bg-blue-200 hover:text-gray-700 text-white font-medium py-3 px-16 text-xs rounded-full focus:outline-none focus:shadow-outline"
          >
            Sign Up
          </button>
        </div>
      </form>
      <div class="text-center text-sm">
        Already have an account?
        <a
          className="text-white hover:underline-offset-4 hover:text-teal-700"
          href="signin"
        >
          {" "}
          Login
        </a>
      </div>
    </div>
  );
}

export default SignUp;
