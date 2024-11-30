import React from 'react';
import { StyleSheet, Text, View, FlatList } from 'react-native';

import { useCarrinho } from '../../contexts/CarrinhoContext';

const Carrinho = () => {
  const { carrinho, removerPizza } = useCarrinho();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Carrinho</Text>
      {carrinho.length === 0 ? (
        <Text>Seu carrinho está vazio!</Text>
      ) : (
        <FlatList
          data={carrinho}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.item}>
              <Text style={styles.itemText}>{item.nome}</Text>
              <Text style={styles.itemText}>R$ {item.preco?.toFixed(2)}</Text>
              <Text onPress={() => removerPizza(item.id)} style={styles.removeButton}>
                Remover
              </Text>
            </View>
          )}
        />
      )}
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
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  itemText: {
    fontSize: 16,
  },
  removeButton: {
    color: '#ff0000',
    fontWeight: 'bold',
  },
});

export default Carrinho;
