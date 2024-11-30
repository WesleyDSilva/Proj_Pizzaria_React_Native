import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

// Define os tipos das props para o componente
interface AddCarrinhoProps {
  title?: string; // O título pode ser passado como prop opcional
  children?: React.ReactNode; // Permite que elementos filhos sejam passados
}

const AddCarrinho: React.FC<AddCarrinhoProps> = ({ title = "Carrinho", children }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {children ? children : <Text>Seu carrinho está vazio!</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
  },
});

export default AddCarrinho;
