import { useState } from "react";
import { sendOTP } from "../components/OTP";
import { useNavigate } from 'react-router-dom'
import { topUpBalance } from "../components/connectBE";

function TopUpBalance(){
  const [amount, setAmount] = useState();
  const navigate = useNavigate()

  async function onSignInSubmit(e){
    e.preventDefault();
    console.log("button clicked")
    const user_id = localStorage.getItem('user_id')
    const isSuccess = await topUpBalance(parseInt(user_id), parseInt(amount))
    if (isSuccess){
      navigate('/topup-success');
    }
    else {
      alert('error top up')
    }
  }

    return(
      <div class="w-full max-w-sm">
          <form class="bg-gradient-to-r g-gradient-to-b from-teal-200 to-blue-50 shadow-md rounded px-8 pt-6 pb-8 mb-4" onSubmit={onSignInSubmit}>
            <div class="mb-4">
              <label class="block text-gray-700 text-sm font-bold mb-2" for="password">
                Nominal Top Up
              </label>
              <input value={amount} onChange={(e)=>setAmount(e.target.value)} type="number" class="shadow appearance-none border rounded-full py-3 px-4 font-medium text-gray-700 text-xs leading-tight focus:outline-none focus:shadow-outline" placeholder="Masukkan Nominal" required/>
            </div>
            <div class="flex items-center justify-center">
              <button id='sign-in-button' class="bg-[#445263] hover:bg-blue-200 hover:text-gray-700 text-white font-medium py-3 px-16 text-xs rounded-full focus:outline-none focus:shadow-outline">
                Submit
              </button>
            </div>
          </form>
        </div>
    );
}

export default TopUpBalance;