import { api_CEP } from "./api_CEP";

export async function  buscaEndereco(cep){
    try {
        response = await api_CEP.get(`${cep}/json/`);
        const data = response. data;
        
        console.log("Dados recebidos da API:", data);

        if (data.erro){
            throw new Error('CEP  não encontrado'); // Usa a configuração da API
        }

        const {logradouro, localidade:cidade, uf:estado} = data;
        return {logradouro,cidade, estado}; // Retorna os dados do endereço
    } catch (error){
        throw new Error("Erro ao buscar endereço: "+error.message);        
    }
}