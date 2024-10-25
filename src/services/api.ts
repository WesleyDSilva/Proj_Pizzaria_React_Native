/*import axios from "axios";

const api = axios.create({
    baseURL:'https://reqres.in'
})

export {api};
*/

import axios from 'axios';

// URL do Supabase
const SUPABASE_URL = 'https://jzlpwyuqtdfsdbiufigl.supabase.co';
// Chave de API do Supabase
const SUPABASE_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6bHB3eXVxdGRmc2RiaXVmaWdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjkyMTUzODQsImV4cCI6MjA0NDc5MTM4NH0.73UgUM8eFeZ3W5iGP2X3jzvc4I0r-CIK3i61e70BKoE';

// Criação da instância do Axios com a URL do Supabase
const api = axios.create({
    baseURL: SUPABASE_URL,
    headers: {
        'apikey': SUPABASE_API_KEY, // Inclui a chave da API no header
        'Authorization': `Bearer ${SUPABASE_API_KEY}`, // Usado se necessário
    }
});

export { api };
