import axios from 'axios';

const API_URL = 'https://devweb3.ok.etc.br'; // Substitua pelo URL base da sua API

interface CadastroData {
  nome: string;
  logradouro: string;
  cidade: string;
  UF: string;
  cep: string;
  complemento: string;
  numero_casa: string;
  email: string;
  telefone: string;
  senha: string;
  cpf: string;
}

export async function cadastrarUsuario(data: CadastroData): Promise<void> {
  try {
    //const response = await axios.post(`${API_URL}/api/api_create.php`, data);

    const response = await axios.post(
      `${API_URL}/api/api_create_hash.php`,
      data,
    );
    //const response = await axios.post(`${API_URL}/api/api_recebimento_cadastro.php`,data);
    if (response.status === 200 || response.status === 201) {
      return response.data;
    } else {
      throw new Error(response.data.message || 'Erro ao cadastrar usuário');
    }
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || 'Erro ao conectar com a API',
    );
  }
}
