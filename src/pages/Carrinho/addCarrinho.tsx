import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

// Define os tipos das props para o componente
interface AddCarrinhoProps {
  title?: string; // O título pode ser passado como prop opcional
  children?: React.ReactNode; // Permite que elementos filhos sejam passados
}

export interface CarrinhoItem {
  id: number; // id_item_pedido
  produto_id: number; // produto_id_api (o ID do produto real)
  preco: number; // total_item_pedido
  nome_produto: string; // nome_produto
  tipo_tamanho: string | null; // tipo_tamanho_pedido
  tamanho: string | null; // tamanho_pedido
  caminho_imagem?: string; // caminho_imagem_produto
}

export interface CarrinhoItem {
  id: number;
  pizza_id: number;
  preco: number;
  nome_pizza: string;
  tipo_pizza: string;
  cliente_id?: number;
  caminho_imagem?: string;
}

const AddCarrinho: React.FC<AddCarrinhoProps> = ({
  title = 'Carrinho',
  children,
}) => {
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
