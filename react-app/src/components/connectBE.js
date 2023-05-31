import axios from 'axios';

const domain = 'http://localhost:8080'

export async function login(phone_number) {
    try{
    const response = await axios.post(domain + '/login', {
      phone_number: phone_number,
    })
    console.log(response.data)
    localStorage.setItem('user_id', response.data.user_id)
    return true
    } catch (error) {
        console.log(error.response.data)
        return false
    }
  }

export  async function getUserData(id) {
    const response = await axios.get(domain + '/getUserData/'+id);

    console.log("user id", response.data);
    return response.data
  }