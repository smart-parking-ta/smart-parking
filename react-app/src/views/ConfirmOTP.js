import { useState } from "react";
import { otpConfirmation } from "../components/OTP";
import { useNavigate } from 'react-router-dom'

function ConfirmOTP(){
  const navigate = useNavigate() 
  const [OTPCode, setOTPCode] = useState()

    function onConfirmSubmit(e){
      e.preventDefault();
      console.log(OTPCode)
      otpConfirmation(OTPCode);
      alert('Success confirm');
      navigate('/dashboard');
    }

    return(
        <div>
            <form class="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4" onSubmit={onConfirmSubmit}>
            <p className="text-black text-sm pb-6">Masukkan kode yang dikirimkan ke nomor telepon anda</p>
            <div class="mb-4">
            <label class="block text-gray-700 text-sm font-bold mb-2" for="username">
              Kode OTP
            </label>
            <input onChange={(e)=>setOTPCode(e.target.value)} class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="username" type="text" placeholder="Masukkan kode otp"/>
          </div>
          
          <div class="flex items-center justify-center">
            <button class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
              konfirmasi
            </button>
          </div>
          </form>
          <div class="text-center text-sm">
          Already have an account?
          <a className="text-black" href="signin"> Login</a>
        </div>
        </div>
    );
}

export default ConfirmOTP;