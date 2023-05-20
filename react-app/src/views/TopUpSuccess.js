import { useNavigate } from 'react-router-dom'

function TopUpSuccess(){
  const navigate = useNavigate()

    return(
      <div class="w-full max-w-sm">
          <div class="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
            <div class="mb-4">
              <img className="image w-1/2 mx-auto" src="https://cdn-icons-png.flaticon.com/512/148/148767.png"></img>
              </div>
            <div class="flex items-center justify-center">
              <button onClick={()=>navigate('/dashboard')} class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
    );
}

export default TopUpSuccess;