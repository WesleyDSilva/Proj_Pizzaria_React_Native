import React, { useState, useContext, useCallback } from 'react';
import { StyleSheet, Text, View, FlatList, ActivityIndicator, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import axios from 'axios';
import { AuthContext } from '../../contexts/AuthContext';
import { useCarrinho } from '../../contexts/CarrinhoContext';
import { useFocusEffect } from '@react-navigation/native';

interface CarrinhoItem {
  id: number;
  cliente_id: number;
  preco: string;  // Alterado para string, pois o valor vindo da API pode ser string
  nome_pizza: string;
  tipo_pizza: string;
}

const Carrinho = () => {
  const { user } = useContext(AuthContext);
  const { carrinho, setCarrinho, removerPizza } = useCarrinho();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Função para buscar os itens do carrinho
  const fetchCarrinho = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `https://devweb3.ok.etc.br/api/api_get_carrinho.php?cliente_id=${user.id}`
      );
      console.log('Dados do carrinho recebidos:', response.data);
      setCarrinho(response.data); // Atualiza o estado global com os dados do carrinho
      setError(null);
    } catch (err) {
      console.error('Erro ao buscar os dados do carrinho:', err);
      setError('Erro ao buscar os dados do carrinho.');
    } finally {
      setLoading(false);
    }
  };

  // Atualizar carrinho ao abrir a aba
  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        fetchCarrinho();
      }
    }, [user])
  );

  // Função para excluir item
  const deleteItem = async (id: number) => {
    try {
      const response = await axios.delete(
        `https://devweb3.ok.etc.br/api/api_delete_carrinho.php?id=${id}`
      );
      if (response.data.success) {
        Alert.alert('Sucesso', 'Item excluído com sucesso');
        removerPizza(id); // Remove o item localmente do carrinho
      } else {
        Alert.alert('Erro', response.data.error || 'Erro ao excluir o item');
      }
    } catch (err) {
      console.error('Erro ao excluir o item:', err);
      Alert.alert('Erro', 'Erro ao excluir o item');
    }
  };

  // Calcular o total dos preços
  const total = carrinho && Array.isArray(carrinho) ? 
    carrinho.reduce((acc, item) => acc + (Number(item.preco) || 0), 0) : 0;

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  if (carrinho.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.message}>Seu carrinho está vazio.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Carrinho</Text>
      <FlatList
        data={carrinho}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text style={styles.itemText}>
              {item.nome_pizza} - {item.tipo_pizza}
            </Text>
            <Text style={styles.itemText}>
              R$ {item.preco ? Number(item.preco).toFixed(2) : '0.00'}
            </Text>
            <Icon
              name="trash"
              size={24}
              color="red"
              onPress={() => deleteItem(item.id)}
            />
          </View>
        )}
      />
      <View style={styles.totalContainer}>
        <Text style={styles.totalText}>Total: R$ {total.toFixed(2)}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  itemText: {
    fontSize: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  error: {
    color: 'red',
    fontSize: 18,
  },
  message: {
    fontSize: 18,
    fontStyle: 'italic',
  },
  totalContainer: {
    marginTop: 20,
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
    alignItems: 'flex-end',
  },
  totalText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default Carrinho;
