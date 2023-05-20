import { useState } from "react";
import { sendOTP } from "../components/OTP";
import { useNavigate } from 'react-router-dom'

function TopUpBalance(){
  const [amount, setAmount] = useState('');
  const navigate = useNavigate()

  async function onSignInSubmit(e){
    e.preventDefault();
    console.log("button clicked")
    navigate('/topup-success');
  }

    return(
      <div class="w-full max-w-sm">
          <form class="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4" onSubmit={onSignInSubmit}>
            <div class="mb-4">
              <label class="block text-gray-700 text-sm font-bold mb-2" for="password">
                Nominal Top Up
              </label>
              <input onChange={(e)=>setAmount(e.target.value)} type="number" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="password" placeholder="Masukkan Nominal" required/>
            </div>
            <div class="flex items-center justify-center">
              <button id='sign-in-button' class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
                Submit
              </button>
            </div>
          </form>
        </div>
    );
}

export default TopUpBalance;