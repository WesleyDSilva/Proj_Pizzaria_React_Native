import React, {useEffect, useState, useContext} from 'react';
import {
  StyleSheet,
  Text,
  View, // View é necessária
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  Image,
  Button,
  TextInput,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import axios from 'axios';
import {useCarrinho} from '../../contexts/CarrinhoContext';
import {AuthContext} from '../../contexts/AuthContext';

// Interface Pizza
interface Pizza {
  id: number;
  nome: string;
  descricao: string;
  preco: number;
  caminho: string;
}

export default function Feed() {
  const {adicionarPizza} = useCarrinho();
  const {user} = useContext(AuthContext);
  const [pizzas, setPizzas] = useState<Pizza[]>([]);
  const [quantities, setQuantities] = useState<{[key: number]: number}>({});
  const [selectedPizzas, setSelectedPizzas] = useState<Pizza[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    const fetchPizzas = async () => {
      try {
        const response = await axios.get<Pizza[]>(
          'https://devweb3.ok.etc.br/api/api_get_pizzas.php',
        );
        const pizzasComDadosCorrigidos = response.data.map(pizza => ({
          ...pizza,
          preco: parseFloat(pizza.preco as unknown as string) || 0,
        }));
        setPizzas(pizzasComDadosCorrigidos);
      } catch (error) {
        console.error('Erro ao buscar os dados:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPizzas();
  }, []);

  // --- Funções handleAddPizza, handleRemovePizza, handleConfirmAddition, handleCancelAddition ---
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
      setQuantities(prev => ({...prev, [pizza.id]: 1}));
      setSelectedPizzas([pizza]);
    }
  };

  const handleMenuPizzaClick = (pizza: Pizza) => {
    if (!user.id) {
      setModalMessage('Você precisa estar logado para adicionar itens.');
      setSelectedPizzas([]);
      setModalVisible(true);
      return;
    }
    setModalMessage(
      `Deseja adicionar uma pizza inteira ${pizza.nome}? Preço: R$ ${
        (pizza.preco || 0) * 2
      }`,
    );
    setSelectedPizzas([pizza]);
    setQuantities({});
    setModalVisible(true);
  };

  const handleRemovePizza = (pizza: Pizza) => {
    const currentQuantity = quantities[pizza.id] || 0;
    if (currentQuantity > 0) {
      setQuantities(prev => ({
        ...prev,
        [pizza.id]: currentQuantity - 1,
      }));
      if (
        currentQuantity === 1 &&
        selectedPizzas.length === 1 &&
        selectedPizzas[0].id === pizza.id
      ) {
        setSelectedPizzas([]);
      }
    }
  };

  const handleConfirmAddition = () => {
    if (!user.id) {
      setModalMessage(
        'Você precisa estar logado para adicionar itens ao carrinho.',
      );
      return;
    }
    if (
      modalMessage === 'Você precisa estar logado para adicionar itens.' ||
      modalMessage ===
        'Você precisa estar logado para adicionar itens ao carrinho.'
    ) {
      setModalVisible(false);
      setSelectedPizzas([]);
      setQuantities({});
      return;
    }

    selectedPizzas.forEach(pizza => {
      const tipoPizza = selectedPizzas.length === 1 ? 'inteira' : 'meia';
      const precoFinal =
        tipoPizza === 'inteira' ? (pizza.preco || 0) * 2 : pizza.preco || 0;

      axios
        .post('https://devweb3.ok.etc.br/api/api_registrar_carrinho.php', {
          cliente_id: user.id,
          pizza_id: pizza.id,
          preco: precoFinal,
          nome_pizza: pizza.nome,
          tipo_pizza: tipoPizza,
        })
        .then(response => {
          console.log('Pizza registrada no carrinho:', response.data);
        })
        .catch(error => {
          console.error('Erro ao registrar pizza no carrinho:', error);
        });
    });

    setModalVisible(false);
    setQuantities({});
    setSelectedPizzas([]);
  };

  const handleCancelAddition = () => {
    setModalVisible(false);
    if (
      modalMessage !== 'Você precisa estar logado para adicionar itens.' &&
      modalMessage !==
        'Você precisa estar logado para adicionar itens ao carrinho.'
    ) {
      setQuantities({});
      setSelectedPizzas([]);
    }
  };

  const filteredPizzas = pizzas.filter(pizza =>
    pizza.nome.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Render item para a lista principal (vertical) - SEM IMAGEM
  const renderItem = ({item}: {item: Pizza}) => (
    <View style={styles.itemContainer}>
      <View style={styles.row}>
        <TouchableOpacity onPress={() => handleRemovePizza(item)}>
          <Icon name="minus-circle" size={25} color="#ff6347" />
        </TouchableOpacity>
        <Text style={styles.quantity}>{quantities[item.id] || 0}</Text>
        <TouchableOpacity onPress={() => handleAddPizza(item)}>
          <Icon name="plus-circle" size={25} color="#32cd32" />
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

  // Render item para a lista horizontal (menu) - Chama handleMenuPizzaClick
  const renderMenuItem = ({item}: {item: Pizza}) => (
    <TouchableOpacity
      style={styles.menuItemOuterContainer}
      onPress={() => handleMenuPizzaClick(item)}>
      <View style={styles.menuItemImageBackground}>
        <Image
          source={{uri: item.caminho}}
          style={styles.menuItemImage}
          onError={e =>
            console.log(
              `Erro ao carregar imagem (menu) ${item.caminho}:`,
              e.nativeEvent.error,
            )
          }
        />
      </View>
      <Text style={styles.menuItemText}>{item.nome}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Busque por nome da pizza..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <View style={styles.searchIconContainer}>
          <Icon name="search" size={18} color="#fff" />
        </View>
      </View>

      <View style={styles.menuContainer}>
        {loading ? (
          <ActivityIndicator
            style={{paddingVertical: 20}}
            size="small"
            color="#FFA500"
          />
        ) : (
          <FlatList
            data={pizzas}
            keyExtractor={item => `menu-${item.id.toString()}`}
            horizontal={true}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.menuList}
            renderItem={renderMenuItem}
            ListEmptyComponent={
              <Text style={styles.emptyMenu}>Carregando pizzas...</Text>
            }
          />
        )}
      </View>

      {/* --- BANNER --- */}
      <View style={styles.banner}>
        <Image
          source={require('../../assets/banner.png')}
          style={styles.bannerImage} // Aplicando estilo à imagem do banner
          onError={e =>
            console.log('Erro ao carregar banner:', e.nativeEvent.error)
          } // Verificar erro de carregamento
        />
      </View>
      {/* --- FIM BANNER --- */}

      {loading && pizzas.length === 0 ? (
        <ActivityIndicator
          style={{marginTop: 20}} // Reduzido marginTop devido ao banner
          size="large"
          color="#0000ff"
        />
      ) : (
        <FlatList
          data={filteredPizzas}
          keyExtractor={item => `main-${item.id.toString()}`}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.empty}>
              {searchQuery
                ? 'Nenhuma pizza encontrada para sua busca.'
                : 'Nenhuma pizza disponível.'}
            </Text>
          }
        />
      )}

      {/* Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={handleCancelAddition}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalMessage}>{modalMessage}</Text>
            <View style={styles.modalButtons}>
              {modalMessage !==
                'Você precisa estar logado para adicionar itens.' &&
                modalMessage !==
                  'Você precisa estar logado para adicionar itens ao carrinho.' && (
                  <Button
                    title="Adicionar"
                    onPress={handleConfirmAddition}
                    color="#FFA500"
                  />
                )}
              {modalMessage !==
                'Você precisa estar logado para adicionar itens.' &&
                modalMessage !==
                  'Você precisa estar logado para adicionar itens ao carrinho.' && (
                  <View style={{width: 10}} />
                )}
              <Button
                title={
                  modalMessage ===
                    'Você precisa estar logado para adicionar itens.' ||
                  modalMessage ===
                    'Você precisa estar logado para adicionar itens ao carrinho.'
                    ? 'OK'
                    : 'Cancelar'
                }
                onPress={handleCancelAddition}
                color="#ff6347"
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// --- Estilos ---
const IMAGE_SIZE = 55;
const BORDER_WIDTH = 2;
const IMAGE_WITH_BORDER_SIZE = IMAGE_SIZE + BORDER_WIDTH * 2;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '90%',
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 50,
    paddingLeft: 15,
    paddingRight: 5,
    alignSelf: 'center',
    marginTop: 20,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 15,
  },
  searchIconContainer: {
    backgroundColor: '#FFA500',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 5,
  },
  menuContainer: {
    width: '100%',
    paddingVertical: 10,
    backgroundColor: '#f8f8f8',
    marginBottom: 5, // Reduzido espaço antes do banner
  },
  menuList: {
    paddingHorizontal: 10,
    alignItems: 'flex-start',
  },
  menuItemOuterContainer: {
    alignItems: 'center',
    marginHorizontal: 8,
    minWidth: IMAGE_WITH_BORDER_SIZE + 10,
  },
  menuItemImageBackground: {
    width: IMAGE_WITH_BORDER_SIZE,
    height: IMAGE_WITH_BORDER_SIZE,
    borderRadius: IMAGE_WITH_BORDER_SIZE / 2,
    backgroundColor: '#FFA500',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  menuItemImage: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    borderRadius: IMAGE_SIZE / 2,
    borderWidth: BORDER_WIDTH,
    borderColor: '#fff',
  },
  menuItemText: {
    color: '#555',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 2,
  },
  emptyMenu: {
    paddingHorizontal: 20,
    color: '#999',
  },
  // Estilo para o container do Banner
  banner: {
    width: '100%', // Ocupa toda a largura disponível
    alignItems: 'center', // Centraliza o conteúdo (Image) horizontalmente
    paddingVertical: 10, // Espaçamento vertical (ajuste conforme necessário)
    // justifyContent: 'center', // Centraliza verticalmente dentro do padding (opcional)
    marginBottom: 10, // Espaço abaixo do banner
    marginLeft: 6,
  },
  // Estilo para a Imagem do Banner (opcional, mas recomendado)
  bannerImage: {
    width: '95%', // Exemplo: 95% da largura do container
    // height: 150, // Defina uma altura ou use aspectRatio
    height: undefined, // Necessário para aspectRatio funcionar corretamente
    aspectRatio: 16 / 6, // Exemplo de proporção (ajuste para a proporção real da sua imagem)
    resizeMode: 'contain', // Ou 'cover', 'stretch'
    borderRadius: 8, // Opcional: bordas arredondadas
  },
  list: {
    width: '100%',
    paddingHorizontal: 16,
    paddingBottom: 20,
    // paddingTop: 10, // Adiciona espaço acima da lista principal
  },
  itemContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
    marginHorizontal: 5,
    marginBottom: 10,
    borderRadius: 5,
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
    color: '#333',
    flex: 1,
  },
  itemDescription: {
    fontSize: 14,
    color: '#666',
    marginLeft: 45,
    marginBottom: 5,
  },
  itemPrice: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: 'bold',
    alignSelf: 'flex-end',
    marginRight: 10,
  },
  quantity: {
    fontSize: 18,
    marginHorizontal: 12,
    fontWeight: 'bold',
    color: '#333',
    minWidth: 25,
    textAlign: 'center',
  },
  controls: {},
  empty: {
    textAlign: 'center',
    fontSize: 16,
    color: '#999',
    marginTop: 50,
    paddingHorizontal: 20,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 25,
    borderRadius: 10,
    width: '85%',
    alignItems: 'center',
    elevation: 5,
  },
  modalMessage: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 25,
    color: '#333',
    lineHeight: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
  },
});
