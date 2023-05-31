import { useState } from "react";
// import { otpConfirmation } from "../components/OTP";
import { useNavigate } from 'react-router-dom'

function ConfirmOTP(){
  const navigate = useNavigate() 
  const [OTPCode, setOTPCode] = useState()

  async function otpConfirmation(code){
    console.log('code', code)
    await window.confirmationResult.confirm(code)
    .then((result) => {
      // User signed in successfully.
      const user = result.user;
      console.log(user)
      navigate('/dashboard');
      // ...
    }).catch((error) => {
      // User couldn't sign in (bad verification code?)
      // ...
      console.log(error)
      alert('OTP false')
    });
}

    async function onConfirmSubmit(e){
      e.preventDefault();
      console.log(OTPCode)
      const a = await otpConfirmation(OTPCode)
      console.log(a)
      // navigate('/dashboard');
      // alert('OTP false')
    }

    return(
      <div class="w-full max-w-sm">
            <form class="bg-gradient-to-r g-gradient-to-b from-teal-200 to-blue-50 shadow-md rounded px-8 pt-6 pb-8 mb-4" onSubmit={onConfirmSubmit}>
            <p className="text-black text-sm pb-6 text-xs">Masukkan kode yang dikirimkan ke nomor telepon anda</p>
            <div class="mb-4">
            <label class="block text-gray-700 text-sm font-bold mb-2" for="username">
              Kode OTP
            </label>
            <input onChange={(e)=>setOTPCode(e.target.value)} class="shadow appearance-none border rounded-full py-3 px-5 text-xs text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="username" type="text" placeholder="Masukkan kode otp"/>
          </div>
          
          <div class="flex items-center justify-center">
            <button class="bg-[#445263] hover:bg-blue-200 hover:text-gray-700 text-white font-medium py-3 px-16 text-xs rounded-full focus:outline-none focus:shadow-outline">
              konfirmasi
            </button>
          </div>
          </form>
          <div class="text-center text-sm">
          Already have an account?
          <a className="text-white hover:underline-offset-4 hover:text-teal-700" href="signin"> Login</a>
        </div>
        </div>
    );
}

export default ConfirmOTP;