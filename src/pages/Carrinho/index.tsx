// Carrinho.tsx
import React, { useState, useContext, useCallback } from 'react';
import { StyleSheet, Text, View, FlatList, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import axios from 'axios';
import { AuthContext } from '../../contexts/AuthContext';
import { useCarrinho } from '../../contexts/CarrinhoContext';
import { useFocusEffect } from '@react-navigation/native';
import { CarrinhoItem } from '../../contexts/CarrinhoItem';

const Carrinho = () => {
  const { user } = useContext(AuthContext);
  const { carrinho, setCarrinho, removerPizza } = useCarrinho();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCarrinho = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `https://devweb3.ok.etc.br/api/api_get_carrinho.php?cliente_id=${user.id}`
      );
      const carrinhoData: CarrinhoItem[] = response.data.map((item: any) => ({
        id: Number(item.id),
        pizza_id: Number(item.pizza_id),
        preco: parseFloat(item.preco),
        nome_pizza: item.nome_pizza,
        tipo_pizza: item.tipo_pizza,
        cliente_id: item.cliente_id ? Number(item.cliente_id) : undefined, // Tratar cliente_id como opcional
      }));
      setCarrinho(carrinhoData);
      setError(null);
    } catch (err) {
      console.error('Erro ao buscar os dados do carrinho:', err);
      setError('Erro ao buscar os dados do carrinho.');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        fetchCarrinho();
      }
    }, [user])
  );

  const deleteItem = async (id: number) => {
    try {
      const response = await axios.delete(
        `https://devweb3.ok.etc.br/api/api_delete_carrinho.php?id=${id}`
      );
      if (response.data.success) {
        Alert.alert('Sucesso', 'Item excluído com sucesso');
        removerPizza(id);
      } else {
        Alert.alert('Erro', response.data.error || 'Erro ao excluir o item');
      }
    } catch (err) {
      console.error('Erro ao excluir o item:', err);
      Alert.alert('Erro', 'Erro ao excluir o item');
    }
  };

  const handleFavorite = async (item: CarrinhoItem) => {
    try {
      // Crie a estrutura do pedido com base no item clicado
      const pizza = {
        cliente_id: item.cliente_id ?? user.id, // Garantir que cliente_id seja um número
        pizza_id: item.pizza_id,
        nome_pizza: item.nome_pizza,
        preco: item.preco,
      };
  
      // Verifique se todos os campos necessários estão presentes
      if (!pizza.cliente_id || !pizza.pizza_id || !pizza.nome_pizza || !pizza.preco) {
        Alert.alert('Erro', 'Campos obrigatórios não preenchidos');
        return;
      }
  
      // Exiba os dados no console antes de enviar à API
      console.log("Enviando o pedido para a API:", pizza);
  
      // Envie o item para a API
      const response = await axios.post('https://devweb3.ok.etc.br/api/api_pedido_favorito.php', { pizzas: [pizza] });
  
      if (response.data.success) {
        Alert.alert('Sucesso', 'Pizza adicionada aos favoritos!');
      } else {
        Alert.alert('Erro', response.data.message || 'Erro ao adicionar aos favoritos.');
      }
    } catch (error) {
      console.error('Erro ao adicionar aos favoritos:', error);
      Alert.alert('Erro', 'Erro ao adicionar aos favoritos.');
    }
  };
  

  const total = carrinho && carrinho.length > 0
    ? carrinho.reduce((acc, item) => acc + item.preco, 0)
    : 0;

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
      <TouchableOpacity onPress={() => handleFavorite(item)}>
        <Icon name="heart" size={20} color="red" style={styles.icon} />
      </TouchableOpacity>
      <Text style={styles.itemText}>
        {item.nome_pizza} - {item.tipo_pizza}
      </Text>
      <Text style={styles.itemText}>R$ {item.preco.toFixed(2)}</Text>
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
    flex: 1,
    marginLeft: 10,
  },
  icon: {
    marginRight: 10,
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
