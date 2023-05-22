import { useNavigate } from 'react-router-dom'

function ETicket(){
    const navigate = useNavigate()

    return(
        <div class="w-full">
            <div class="container px-5 py-24 mx-auto flex flex-wrap w-full">
            <div className='flex justify-end w-full space-x-4 '>
                <button onClick={()=>navigate('/dashboard')} className='bg-[#445263] hover:bg-blue-200 hover:text-gray-700 text-white font-medium py-3 px-16 text-xs rounded-full focus:outline-none focus:shadow-outline'>Dashboard</button>
                <button onClick={()=>navigate('/')} className='bg-[#445263] hover:bg-blue-200 hover:text-gray-700 text-white font-medium py-3 px-16 text-xs rounded-full focus:outline-none focus:shadow-outline'>Log Out</button>
            </div>
            <div class="flex w-full justify-center p-4">
            <div class="mx-4 max-w-sm p-10 bg-gradient-to-r g-gradient-to-b from-teal-200 to-blue-50 border border-gray-200 rounded-lg shadow hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700">
                <p class="text-xs font-bold text-gray-700 dark:text-gray-400">Charged</p>
                <h5 class="mb-2 text-2xl font-bold tracking-tight text-gray-900">Rp 5.000</h5>
                <p class="text-xs font-bold text-gray-700 dark:text-gray-400">In: 2023/05/04 16:40:25, Out: 2023/05/04 17:10:25</p>
            </div>
            <div class="mx-4 max-w-sm p-10 bg-gradient-to-r g-gradient-to-b from-teal-200 to-blue-50 border border-gray-200 rounded-lg shadow hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700">
                <p class="text-xs font-bold text-gray-700 dark:text-gray-400">Charged</p>
                <h5 class="mb-2 text-2xl font-bold tracking-tight text-gray-900">Rp 30.000</h5>
                <p class="text-xs font-bold text-gray-700 dark:text-gray-400">In: 2023/05/04 16:40:25, Out: 2023/05/04 17:10:25</p>
            </div>
            </div>
            </div>
        </div>
    );
}

export default ETicket;