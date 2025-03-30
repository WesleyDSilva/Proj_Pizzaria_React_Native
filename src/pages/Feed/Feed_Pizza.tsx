import React, {useEffect, useState, useContext} from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  Image,
  Button,
  TextInput, // Importando o TextInput para a barra de busca
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import axios from 'axios';
import {useCarrinho} from '../../contexts/CarrinhoContext';
import {AuthContext} from '../../contexts/AuthContext';

// Definindo o tipo dos dados da API
interface Pizza {
  id: number;
  nome: string;
  descricao: string;
  preco: number;
}

export default function Feed() {
  const {adicionarPizza} = useCarrinho();
  const {user} = useContext(AuthContext); // Pegando o usuário do contexto de autenticação
  const [pizzas, setPizzas] = useState<Pizza[]>([]);
  const [quantities, setQuantities] = useState<{[key: number]: number}>({});
  const [selectedPizzas, setSelectedPizzas] = useState<Pizza[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>(''); // Estado para armazenar o texto da busca

  useEffect(() => {
    const fetchPizzas = async () => {
      try {
        const response = await axios.get<Pizza[]>(
          'https://devweb3.ok.etc.br/api/api_get_pizzas.php',
        );
        const pizzasComPrecoConvertido = response.data.map(pizza => ({
          ...pizza,
          preco: parseFloat(pizza.preco as unknown as string) || 0, // Converte o preço para número
        }));
        setPizzas(pizzasComPrecoConvertido);
      } catch (error) {
        console.error('Erro ao buscar os dados:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPizzas();
  }, []);

  const handleAddPizza = (pizza: Pizza) => {
    const currentQuantity = quantities[pizza.id] || 0;

    if (currentQuantity === 1) {
      setModalMessage(
        `Deseja adicionar uma pizza inteira ${pizza.nome}? Preço: R$ ${
          (pizza.preco || 0) * 2
        }`,
      );
      setSelectedPizzas([pizza]);
      setModalVisible(true);
    } else if (selectedPizzas.length === 1) {
      const previousPizza = selectedPizzas[0];
      setModalMessage(
        `Deseja adicionar meia ${previousPizza.nome} e meia ${
          pizza.nome
        }? Preço: R$ ${(previousPizza.preco || 0) + (pizza.preco || 0)}`,
      );
      setSelectedPizzas([...selectedPizzas, pizza]);
      setModalVisible(true);
    } else {
      setQuantities(prev => ({...prev, [pizza.id]: currentQuantity + 1}));
      setSelectedPizzas([pizza]);
    }
  };

  const handleRemovePizza = (pizza: Pizza) => {
    const currentQuantity = quantities[pizza.id] || 0;
    if (currentQuantity > 0) {
      setQuantities(prev => ({
        ...prev,
        [pizza.id]: currentQuantity - 1,
      }));
    }
  };

  const handleConfirmAddition = () => {
    if (!user.id) {
      setModalMessage(
        'Você precisa estar logado para adicionar itens ao carrinho.',
      );
      setModalVisible(true);
      return;
    }

    // Envia a pizza para o carrinho e chama a API
    selectedPizzas.forEach(pizza => {
      const tipoPizza = selectedPizzas.length > 1 ? 'meia' : 'inteira'; // Define o tipo da pizza
      const precoFinal =
        tipoPizza === 'inteira' ? pizza.preco * 2 : pizza.preco; // Multiplica por 2 se for inteira

      // Envia a requisição para registrar a pizza no carrinho na API
      axios
        .post('https://devweb3.ok.etc.br/api/api_registrar_carrinho.php', {
          cliente_id: user.id, // Agora pegamos o ID do cliente do contexto
          pizza_id: pizza.id,
          preco: precoFinal,
          nome_pizza: pizza.nome,
          tipo_pizza: tipoPizza, // Envia o tipo da pizza (meia ou inteira)
        })
        .then(response => {
          console.log('Pizza registrada no carrinho:', response.data);
        })
        .catch(error => {
          console.error('Erro ao registrar pizza no carrinho:', error);
        });
    });

    // Fecha o modal e limpa o estado de pizzas selecionadas
    setModalVisible(false);
    setQuantities({});
    setSelectedPizzas([]);
  };

  const handleCancelAddition = () => {
    setModalVisible(false);
    setQuantities({});
    setSelectedPizzas([]);
  };

  // Função para filtrar as pizzas com base no texto de pesquisa
  const filteredPizzas = pizzas.filter(pizza =>
    pizza.nome.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const renderItem = ({item}: {item: Pizza}) => (
    <View style={styles.itemContainer}>
      <View style={styles.row}>
        <TouchableOpacity onPress={() => handleRemovePizza(item)}>
          <Icon name="minus" size={20} color="#ff0000" />
        </TouchableOpacity>
        <Text style={styles.quantity}>{quantities[item.id] || 0}</Text>
        <TouchableOpacity onPress={() => handleAddPizza(item)}>
          <Icon name="plus" size={20} color="#00a000" />
        </TouchableOpacity>
        <Text style={styles.itemTitle}>
          {item.nome || 'Nome não disponível'}
        </Text>
      </View>
      <Text style={styles.itemDescription}>
        {item.descricao || 'Descrição não disponível'}
      </Text>
      <Text style={styles.itemPrice}>{`R$ ${item.preco.toFixed(2)}`}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Busque por nome da pizza..."
          value={searchQuery}
          onChangeText={setSearchQuery} // Atualiza o estado da pesquisa
        />
        <View style={styles.iconContainer}>
          <Icon name="search" size={20} color="#000000" style={styles.icon} />
        </View>
      </View>

      <View style={styles.menuContainer}>
        <FlatList
          data={pizzas} // Mostra todas as pizzas sem filtro
          keyExtractor={item => item.id.toString()}
          horizontal={true} // Faz a lista rolar horizontalmente
          showsHorizontalScrollIndicator={false} // Esconde a barra de rolagem
          contentContainerStyle={styles.menuList}
          renderItem={({item}) => (
            <TouchableOpacity style={styles.menuItem}>
              <Text style={styles.menuItemText}>{item.nome}</Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <FlatList
          data={filteredPizzas} // Usa a lista filtrada
          keyExtractor={item => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.empty}>Nenhuma pizza encontrada.</Text>
          }
        />
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={handleCancelAddition}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalMessage}>{modalMessage}</Text>
            <View style={styles.modalButtons}>
              <Button title="Adicionar" onPress={handleConfirmAddition} />
              <Button
                title="Cancelar"
                onPress={handleCancelAddition}
                color="#ff0000"
              />
            </View>
          </View>
        </View>
      </Modal>
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
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#FFA500',
    borderRadius: 20,
    marginHorizontal: 5,
  },
  menuItemText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
