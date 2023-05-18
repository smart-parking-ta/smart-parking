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
        <div>
          <form class="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4" onSubmit={onSignInSubmit}>
            <div class="mb-4">
              <label class="block text-gray-700 text-sm font-bold mb-2" for="password">
                Nomor Hp
              </label>
              <input onChange={(e)=>setPhoneNumber(e.target.value)} type="tel" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="password" placeholder="Masukkan No. Hp +62..." />
            </div>
            <div class="flex items-center justify-center">
              <button id='sign-in-button' class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
                Sign In
              </button>
            </div>
          </form>
          <div class="text-center text-sm">
          Already have an account?
          <a className="text-black" href="/"> Sign Up</a>
        </div>
        </div>
    );
}

export default SignIn;