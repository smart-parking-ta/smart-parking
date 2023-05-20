import { useState } from "react";
import { sendOTP } from "../components/OTP";
import { useNavigate } from 'react-router-dom'

function SignIn(){
  const [phoneNumber, setPhoneNumber] = useState('');
  const navigate = useNavigate()

  async function onSignInSubmit(e){
    e.preventDefault();
    console.log("button clicked")
    await sendOTP(phoneNumber);
    navigate('/confirm-otp');
  }

    return(
      <div class="w-full max-w-sm">
          <form class="bg-gradient-to-r g-gradient-to-b from-teal-200 to-blue-50 shadow-md rounded px-8 pt-6 pb-8 mb-4" onSubmit={onSignInSubmit}>
            <div class="mb-4">
            <label class="block text-gray-700 text-xs font-bold mb-2" for="password">
    Nomor Hp
  </label>
  <input onChange={(e)=>setPhoneNumber(e.target.value)} type="tel" class="shadow appearance-none border rounded-full py-3 px-2 font-medium text-gray-700 text-xs leading-tight focus:outline-none focus:shadow-outline" id="password" placeholder="Masukkan No. Hp +62.."/>
            </div>
            <div class="flex items-center justify-center">
              <button id='sign-in-button' class="bg-[#445263] hover:bg-blue-200 hover:text-gray-700 text-white font-medium py-3 px-16 text-xs rounded-full focus:outline-none focus:shadow-outline">
                Sign In
              </button>
            </div>
          </form>
          <div class="text-center text-sm">
          Already have an account?
          <a className="text-white hover:underline-offset-4 hover:text-teal-700" href="/"> Sign Up</a>
        </div>
        </div>
    );
}

export default SignIn;