import axios from "axios";


const api_CEP = axios.create({
    baseURL: 'https://viacep.com.br/ws/'
});

export {api_CEP};