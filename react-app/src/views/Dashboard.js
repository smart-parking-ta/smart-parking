import { useNavigate } from 'react-router-dom'

function Dashboard(){
    const navigate = useNavigate()

    return(
        <div class="w-full">
            <div class="container px-5 py-24 mx-auto flex flex-wrap w-full">
            <div className='flex justify-end w-full'>
                <button onClick={()=>navigate('/')} className='button bg-black p-2 rounded'>Log Out</button>
            </div>
            <div class="flex w-full justify-center p-4">
            <div class="mx-4 max-w-sm p-10 bg-white border border-gray-200 rounded-lg shadow hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700">
                <h5 class="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Rp170.000</h5>
                <p class="text-sm font-normal text-gray-700 dark:text-gray-400">Your Balance</p>
                <button onClick={()=>navigate('/topup')} className="text-sm bg-black p-2 rounded-full border border-black py-2">Top Up Balance</button>
            </div>
            <div class="mx 4 max-w-sm p-10 bg-white border border-gray-200 rounded-lg shadow hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700">
                <h5 class="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">AE 1234 KL</h5>
                <p class="text-sm font-normal text-gray-700 dark:text-gray-400">Your Plate Number</p>
            </div>
            </div>
            <div class="flex p-4 w-full justify-center">
            <div class="max-w-sm p-10 bg-white border border-gray-200 rounded-lg shadow hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700">
                <h5 class="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Rp6.000</h5>
                <p class="text-sm font-normal text-gray-700 dark:text-gray-400">Need to Pay</p>
            </div>
            </div>
            </div>
        </div>
    );
}

export default Dashboard;