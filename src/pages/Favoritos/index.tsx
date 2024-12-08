import { StyleSheet, Text, View, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext'; // Importando o contexto de autenticação
import axios from 'axios';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useIsFocused } from '@react-navigation/native'; // Importando para saber quando a tela está focada

// Definindo o tipo para os itens favoritos
type Favorito = {
  pizza_id: number;
  nome_pizza: string;
  preco: string;
};

export default function Favoritos() {
  const { user } = useContext(AuthContext); // Obtendo o usuário logado do contexto
  const [favoritos, setFavoritos] = useState<Favorito[]>([]); // Definindo o tipo para o estado de favoritos
  const [loading, setLoading] = useState(true); // Estado para controlar o carregamento
  const isFocused = useIsFocused(); // Hook para verificar se a tela está focada

  // Função para obter os favoritos do usuário
  const fetchFavoritos = async () => {
    setLoading(true); // Começa o carregamento
    try {
      const response = await axios.get(`https://devweb3.ok.etc.br/api/api_get_pedidos_favoritos.php?cliente_id=${user.id}`);
      console.log('Resposta Completa da API:', response.data); // Verifique a resposta da API
  
      // Verificar se a resposta é um array
      if (Array.isArray(response.data)) {
        setFavoritos(response.data); // Atualiza o estado com os favoritos
      } else {
        console.log('Nenhum favorito encontrado ou resposta inválida');
        setFavoritos([]); // Garantir que o estado seja um array vazio, caso não haja favoritos
      }
    } catch (error) {
      console.error('Erro ao buscar favoritos:', error);
      setFavoritos([]); // Garantir que o estado seja um array vazio, caso ocorra erro
    } finally {
      setLoading(false); // Parar o carregamento após a requisição
    }
  };

  // Função para remover um favorito
  const removerFavorito = async (pizza_id: number) => {
    try {
      // Realiza a requisição GET passando pizza_id e cliente_id na URL
      const response = await axios.get(
        `https://devweb3.ok.etc.br/api/api_delete_favorito.php?pizza_id=${pizza_id}&cliente_id=${user.id}`
      );
  
      if (response.data.success) {
        setFavoritos(favoritos.filter(favorito => favorito.pizza_id !== pizza_id));
        console.log(`Favorito com pizza_id ${pizza_id} removido com sucesso.`);
      } else {
        console.error('Erro ao remover favorito:', response.data.message);
      }
    } catch (error) {
      console.error('Erro ao fazer requisição GET:', error);
    }
  };
  

  // Executa a requisição toda vez que a tela for focada
  useEffect(() => {
    if (isFocused) {
      fetchFavoritos(); // Chama a função para buscar os favoritos sempre que a tela de favoritos for exibida
    }
  }, [isFocused]); // Dependência para chamar sempre que a tela estiver focada

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Favoritos</Text>
      {favoritos.length === 0 ? (
        <Text>Nenhum favorito encontrado</Text> // Mensagem caso não haja favoritos
      ) : (
        <FlatList
          data={favoritos}
          keyExtractor={(item) => item.pizza_id.toString()}
          renderItem={({ item }) => (
            <View style={styles.item}>
              <Text style={styles.pizzaName}>{item.nome_pizza}</Text>
              <Text style={styles.pizzaPrice}>R$ {item.preco}</Text>
              <TouchableOpacity onPress={() => removerFavorito(item.pizza_id)}>
                <Icon name="trash" size={20} color="#ff0000" style={styles.icon} />
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  item: {
    backgroundColor: '#f4f4f4',
    padding: 10,
    marginVertical: 5,
    borderRadius: 5,
    width: '90%',
    flexDirection: 'row',
    justifyContent: 'space-between', // Alinha o conteúdo de forma que o ícone fique à direita
    alignItems: 'center', // Garante que o ícone e o texto fiquem alinhados verticalmente
  },
  pizzaName: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1, // Deixa o nome da pizza ocupar o espaço restante
  },
  pizzaPrice: {
    fontSize: 16,
    color: '#888',
    marginRight: 10, // Adiciona margem para o ícone não encostar no preço
  },
  icon: {
    marginLeft: 10, // Dá um pequeno espaço entre o nome e o ícone
  },
});
