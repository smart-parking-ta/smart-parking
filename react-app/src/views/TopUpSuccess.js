import { useNavigate } from 'react-router-dom'
import broImage from '../assets/bro.png';



function TopUpSuccess(){
  const navigate = useNavigate()

    return(
      
      <div class="w-full max-w-sm">
          <div class="bg-gradient-to-r g-gradient-to-b from-teal-200 to-blue-50 shadow-md rounded px-8 pt-6 pb-8 mb-4">
            <div class="mb-4">
            <p className="text-black font-bold text-sm pb-6 text-l">Top Up Balance Berhasil!</p>
              <img className="image w-1/2 mx-auto" src={broImage}></img>
              </div>
            <div class="flex items-center justify-center">
              <button onClick={()=>navigate('/dashboard')} class="bg-[#445263] hover:bg-blue-200 hover:text-gray-700 text-white font-medium py-3 px-8 text-xs rounded-full focus:outline-none focus:shadow-outline">
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
    );
}

export default TopUpSuccess;