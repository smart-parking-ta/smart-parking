import { useNavigate } from 'react-router-dom'

function Dashboard(){
    const navigate = useNavigate()

    return(
        <div class="w-full">
            <div class="container px-5 py-24 mx-auto flex flex-wrap w-full">
            <div className='flex justify-end w-full space-x-4 '>
                <button onClick={()=>navigate('/e-ticket')} className='bg-[#445263] hover:bg-blue-200 hover:text-gray-700 text-white font-medium py-3 px-16 text-xs rounded-full focus:outline-none focus:shadow-outline'>E-Ticket</button>
                <button onClick={()=>navigate('/')} className='bg-[#445263] hover:bg-blue-200 hover:text-gray-700 text-white font-medium py-3 px-16 text-xs rounded-full focus:outline-none focus:shadow-outline'>Log Out</button>
            </div>
            <div class="flex w-full justify-center p-4">
            <div class="mx-4 max-w-sm p-10 bg-gradient-to-r g-gradient-to-b from-teal-200 to-blue-50 border border-gray-200 rounded-lg shadow hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700">
                <h5 class="mb-2 text-2xl font-bold tracking-tight text-gray-900">Rp170.000</h5>
                <p class="text-xs font-bold text-gray-700 dark:text-gray-400">Your Balance</p>
                <button onClick={()=>navigate('/topup')} class="mt-4 text-xs bg-[#425061] p-2 rounded-full border border-black py-2">Top Up Balance</button>
            </div>
            <div class="mx 4 max-w-sm p-10 bg-gradient-to-r g-gradient-to-b from-teal-200 to-blue-50 border border-gray-200 rounded-lg shadow hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700">
                <h5 class="mb-2 text-2xl font-bold tracking-tight text-gray-900">AE 1234 KL</h5>
                <p class="text-xs font-bold text-gray-700 dark:text-gray-400">Your Plate Number</p>
            </div>
            </div>
            <div class="flex p-4 w-full justify-center">
            <div class="max-w-sm p-10 bg-gradient-to-r g-gradient-to-b from-teal-200 to-blue-50 border border-gray-200 rounded-lg shadow hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700">
                <h5 class="mb-2 text-2xl font-bold tracking-tight text-gray-900">Rp6.000</h5>
                <p class="text-xs font-bold text-gray-700 dark:text-gray-400">Need to Pay</p>
            </div>
            </div>
            </div>
        </div>
    );
}

export default Dashboard;