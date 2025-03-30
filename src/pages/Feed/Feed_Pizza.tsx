import React, {useEffect, useState} from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  Image,
} from 'react-native';
import axios from 'axios';

interface Pizza {
  id: number;
  nome: string;
  descricao: string;
  preco: number;
  imagem: string; // Adicione esta propriedade!
}

export default function Feed() {
  const [pizzas, setPizzas] = useState<Pizza[]>([]);

  useEffect(() => {
    const fetchPizzas = async () => {
      try {
        const response = await axios.get<Pizza[]>(
          'https://devweb3.ok.etc.br/api/api_get_pizzas.php',
        );
        const pizzasComImagens = response.data.map(pizza => ({
          ...pizza,
          preco: parseFloat(pizza.preco as unknown as string) || 0, // Converte o preço para número
          imagem: '../../assets/pizza_default.png', // Adiciona o caminho da imagem
        }));
        setPizzas(pizzasComImagens);
      } catch (error) {
        console.error('Erro ao buscar os dados:', error);
      }
    };

    fetchPizzas();
  }, []);

  const renderMenuItem = ({item}: {item: Pizza}) => (
    <TouchableOpacity style={styles.menuItem}>
      <Image
        source={require('../../assets/pizza_default.png')}
        style={styles.menuItemImage}
      />
      <Text style={styles.menuItemText}>{item.nome}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* ... outros componentes ... */}
      <View style={styles.menuContainer}>
        <FlatList
          data={pizzas}
          keyExtractor={item => item.id.toString()}
          horizontal={true}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.menuList}
          renderItem={renderMenuItem} // Usa a nova função de renderização
        />
      </View>
      {/* ... outros componentes ... */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  searchContainer: {
    flexDirection: 'row', // Garante que o campo de busca e o ícone fiquem na mesma linha
    alignItems: 'center',
    width: '90%',
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 50,
    paddingLeft: 10,
    paddingRight: 10,
  },
  searchInput: {
    flex: 1, // Faz o campo de texto ocupar o máximo de espaço disponível
    height: '100%',
  },
  searchIcon: {
    position: 'absolute',
    right: 10, // Posiciona o ícone no lado direito
  },
  iconContainer: {
    position: 'relative', // Faz o ícone ser posicionado dentro do círculo
    backgroundColor: '#FFA500', // Cor laranja
    borderRadius: 20, // Forma o círculo
    justifyContent: 'center',
    alignItems: 'center',
    width: 30, // Define o tamanho do círculo
    height: 30, // Define o tamanho do círculo
    marginLeft: 10,
  },
  icon: {
    position: 'absolute', // Posiciona o ícone dentro do círculo
    top: '50%', // Coloca o ícone no meio do círculo
    left: '50%', // Coloca o ícone no meio do círculo
    transform: [{translateX: -10}, {translateY: -10}], // Ajusta o ícone para ficar centralizado
  },
  list: {
    width: '100%',
    paddingHorizontal: 16,
  },
  itemContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  itemDescription: {
    fontSize: 14,
    color: '#666',
  },
  itemPrice: {
    fontSize: 16,
    color: '#00a000',
    marginTop: 8,
  },
  quantity: {
    fontSize: 18,
    marginHorizontal: 10,
    fontWeight: 'bold',
    color: '#333',
  },
  empty: {
    textAlign: 'center',
    fontSize: 16,
    color: '#999',
    marginTop: 20,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    alignItems: 'center',
  },
  modalMessage: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  image: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
    marginBottom: 20,
  },
  menuContainer: {
    width: '100%',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    backgroundColor: '#f8f8f8',
  },
  menuList: {
    paddingHorizontal: 10,
  },
  menuItem: {
    padding: 10, // Adicionado padding para espaço interno
    backgroundColor: '#FFA500',
    borderRadius: 10,
    marginRight: 10,
    width: 150, // Ajuste a largura conforme necessário
    alignItems: 'center', // Centraliza o conteúdo horizontalmente
  },
  menuItemText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 5, // Espaço entre a imagem e o texto
    textAlign: 'center', // Centraliza o texto
  },
  menuItemImage: {
    width: 80, // Ajuste o tamanho da imagem conforme necessário
    height: 80, // Ajuste o tamanho da imagem conforme necessário
    borderRadius: 40, // Deixa a imagem redonda (opcional)
    marginBottom: 5, // Espaço entre a imagem e o texto
    resizeMode: 'cover', // Ou 'contain', 'stretch' - ajuste conforme necessário
  },
});
