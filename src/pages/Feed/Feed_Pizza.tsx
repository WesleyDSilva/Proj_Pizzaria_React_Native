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

// Interface Pizza (corresponde à nova API)
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
      setLoading(true);
      try {
        // <<< CONFIRME SE ESTA É A URL CORRETA DA SUA API ATUALIZADA >>>
        const response = await axios.get<any[]>(
          'https://devweb3.ok.etc.br/api/api_get_pizzas_mobile.php',
        );

        // --- Data Validation and Processing ---
        if (!Array.isArray(response.data)) {
          console.error('Erro: Resposta da API não é um array:', response.data);
          throw new Error('Invalid API response format');
        }

        // <<< AJUSTADO PARA O NOVO FORMATO DA API (id, descricao) >>>
        const pizzasValidas = response.data
          // 1. Filter usando 'id' (como a nova API retorna)
          .filter(
            item =>
              item &&
              typeof item === 'object' &&
              item.id != null && // <-- CORRIGIDO: Usar 'id'
              item.nome != null,
          )
          // 2. Map usando 'id' e 'descricao' (como a nova API retorna)
          .map(
            (item): Pizza => ({
              id: Number(item.id), // <-- CORRIGIDO: Usar 'id'
              nome: String(item.nome), // Mantém
              descricao: String(item.descricao || 'Descrição não disponível'), // <-- CORRIGIDO: Usar 'descricao'
              preco: parseFloat(item.preco as unknown as string) || 0, // Mantém
              caminho: String(item.caminho || ''), // Mantém
            }),
          );
        // <<< FIM DOS AJUSTES >>>

        // Logs para depuração - Verifique no console do Metro Bundler
        console.log('API Response Data (Raw):', response.data);
        console.log('Pizzas Válidas Mapeadas:', pizzasValidas);

        // Verificação adicional se o mapeamento falhou
        if (pizzasValidas.length === 0 && response.data.length > 0) {
          console.warn(
            "FILTRO/MAP RESULTADO VAZIO: Verifique os nomes dos campos ('id', 'descricao') no filter/map e compare com os dados brutos da API acima.",
          );
        }

        setPizzas(pizzasValidas);
        // --- End Data Validation ---
      } catch (error) {
        console.error(
          'Erro ao buscar ou processar os dados das pizzas:',
          error,
        );
        if (axios.isAxiosError(error)) {
          console.error('Axios error details:', error.toJSON());
          if (error.response) {
            console.error('API Response Data (on error):', error.response.data);
            console.error('API Response Status:', error.response.status);
          } else if (error.request) {
            console.error('Axios request error:', error.request);
          } else {
            console.error('Axios general error:', error.message);
          }
        }
        setPizzas([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPizzas();
  }, []);

  // --- Funções handlers (sem alterações, mantidas como antes) ---
  const handleAddPizza = (pizza: Pizza) => {
    if (!pizza || pizza.id == null) {
      console.warn('handleAddPizza called with invalid pizza data:', pizza);
      return;
    }
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
      if (!selectedPizzas[0] || selectedPizzas[0].id == null) {
        console.warn('handleAddPizza: Invalid pizza previously selected.');
        setSelectedPizzas([pizza]);
        setQuantities({[pizza.id]: 1});
        return;
      }
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
    if (!pizza || pizza.id == null) {
      console.warn(
        'handleMenuPizzaClick called with invalid pizza data:',
        pizza,
      );
      return;
    }
    if (!user || !user.id) {
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
    if (!pizza || pizza.id == null) {
      console.warn('handleRemovePizza called with invalid pizza data:', pizza);
      return;
    }
    const currentQuantity = quantities[pizza.id] || 0;
    if (currentQuantity > 0) {
      setQuantities(prev => ({
        ...prev,
        [pizza.id]: currentQuantity - 1,
      }));
      if (
        currentQuantity === 1 &&
        selectedPizzas.length === 1 &&
        selectedPizzas[0]?.id === pizza.id
      ) {
        setSelectedPizzas([]);
      }
    }
  };

  const handleConfirmAddition = () => {
    if (!user || !user.id) {
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

    const validSelectedPizzas = selectedPizzas.filter(p => p && p.id != null);
    if (validSelectedPizzas.length === 0) {
      console.warn('handleConfirmAddition: No valid pizzas selected.');
      setModalVisible(false);
      setQuantities({});
      setSelectedPizzas([]);
      return;
    }

    validSelectedPizzas.forEach(pizza => {
      const tipoPizza = validSelectedPizzas.length === 1 ? 'inteira' : 'meia';
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
          console.error(
            `Erro ao registrar pizza ${pizza.nome} (${pizza.id}) no carrinho:`,
            error,
          );
          if (axios.isAxiosError(error) && error.response) {
            console.error(
              'API Error Response (registrar carrinho):',
              error.response.data,
            );
          }
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
    setModalMessage('');
  };

  // Filter pizzas based on search query
  const filteredPizzas = searchQuery
    ? pizzas.filter(pizza =>
        pizza.nome.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : pizzas;

  // Render item for the main list
  const renderItem = ({item}: {item: Pizza}) => (
    <View style={styles.itemContainer}>
      <View style={styles.row}>
        <TouchableOpacity onPress={() => handleRemovePizza(item)}>
          <Icon name="minus-circle" size={25} color="#ff6347" />
        </TouchableOpacity>
        <Text style={styles.quantity}>{quantities[item?.id] || 0}</Text>
        <TouchableOpacity onPress={() => handleAddPizza(item)}>
          <Icon name="plus-circle" size={25} color="#32cd32" />
        </TouchableOpacity>
        <Text style={styles.itemTitle}>
          {item?.nome || 'Nome Indisponível'}
        </Text>
      </View>
      {/* Exibe a descrição vinda da API */}
      <Text style={styles.itemDescription}>
        {item?.descricao || 'Descrição Indisponível'}
      </Text>
      <Text style={styles.itemPrice}>{`R$ ${(item?.preco ?? 0).toFixed(
        2,
      )}`}</Text>
    </View>
  );

  // Render item for menu - Com renderização condicional da imagem
  const renderMenuItem = ({item}: {item: Pizza}) => (
    <TouchableOpacity
      style={styles.menuItemOuterContainer}
      onPress={() => handleMenuPizzaClick(item)}
      disabled={!item || item.id == null}>
      <View style={styles.menuItemImageBackground}>
        {item?.caminho ? (
          <Image
            source={{uri: item.caminho}}
            style={styles.menuItemImage}
            onError={e =>
              console.log(
                `Erro ao carregar imagem (menu) ${item?.caminho}:`,
                e.nativeEvent.error,
              )
            }
          />
        ) : (
          <View style={[styles.menuItemImage, {backgroundColor: '#ddd'}]} />
        )}
      </View>
      <Text style={styles.menuItemText}>{item?.nome || '???'}</Text>
    </TouchableOpacity>
  );

  // --- JSX Structure ---
  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Busque por nome da pizza..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
        <View style={styles.searchIconContainer}>
          <Icon name="search" size={18} color="#fff" />
        </View>
      </View>

      {/* Horizontal Menu */}
      <View style={styles.menuContainer}>
        {/* Loader inicial */}
        {loading && pizzas.length === 0 ? ( // Mostra loader se carregando E sem pizzas
          <ActivityIndicator
            style={{paddingVertical: 20}}
            size="small"
            color="#FFA500"
          />
        ) : (
          <FlatList
            data={pizzas} // Usa o estado 'pizzas' mapeado corretamente
            keyExtractor={(item, index) =>
              item?.id != null ? `menu-${item.id}` : `menu-fallback-${index}`
            }
            horizontal={true}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.menuList}
            renderItem={renderMenuItem}
            ListEmptyComponent={
              !loading ? ( // Só mostra se não estiver carregando
                <Text style={styles.emptyMenu}>Nenhuma pizza no menu.</Text>
              ) : null
            }
          />
        )}
      </View>

      {/* Banner */}
      <View style={styles.banner}>
        <Image
          source={require('../../assets/banner.png')} // Atenção a este caminho!
          style={styles.bannerImage}
          onError={e =>
            console.log('Erro ao carregar banner:', e.nativeEvent.error)
          }
        />
      </View>

      {/* Main Vertical List */}
      {/* Loader ou lista/vazio */}
      {loading && pizzas.length === 0 ? ( // Mostra loader se carregando E sem pizzas
        <ActivityIndicator
          style={{marginTop: 50}}
          size="large"
          color="#FFA500"
        />
      ) : (
        <FlatList
          data={filteredPizzas} // Lista filtrada pela busca
          keyExtractor={(item, index) =>
            item?.id != null ? `main-${item.id}` : `main-fallback-${index}`
          }
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.empty}>
              {
                searchQuery
                  ? 'Nenhuma pizza encontrada para sua busca.'
                  : !loading && pizzas.length === 0 // Condição chave aqui!
                  ? 'Nenhuma pizza disponível no momento.' // Mostra APENAS se não está carregando E pizzas está vazio
                  : 'Nenhuma pizza disponível.' // Caso padrão (não deve ocorrer se a lógica acima estiver ok)
              }
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
                'Você precisa estar logado para adicionar itens ao carrinho.' ? (
                <>
                  <Button
                    title="Adicionar"
                    onPress={handleConfirmAddition}
                    color="#FFA500"
                  />
                  <View style={{width: 10}} />
                  <Button
                    title="Cancelar"
                    onPress={handleCancelAddition}
                    color="#ff6347"
                  />
                </>
              ) : (
                <Button
                  title="OK"
                  onPress={handleCancelAddition}
                  color="#FFA500"
                />
              )}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// --- Estilos --- (Mantidos como antes)
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
    color: '#333',
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
    marginBottom: 5,
  },
  menuList: {
    paddingHorizontal: 10,
    alignItems: 'flex-start',
  },
  menuItemOuterContainer: {
    alignItems: 'center',
    marginHorizontal: 8,
    minWidth: IMAGE_WITH_BORDER_SIZE + 10,
    maxWidth: IMAGE_WITH_BORDER_SIZE + 30,
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
    backgroundColor: '#eee',
  },
  menuItemText: {
    color: '#555',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 2,
    flexWrap: 'wrap',
  },
  emptyMenu: {
    paddingHorizontal: 20,
    color: '#999',
    textAlign: 'center',
    width: '100%',
  },
  banner: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 10,
    marginBottom: 10,
  },
  bannerImage: {
    width: '95%',
    height: undefined,
    aspectRatio: 16 / 6,
    resizeMode: 'contain',
    borderRadius: 8,
  },
  list: {
    width: '100%',
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  itemContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
    marginBottom: 10,
    borderRadius: 8,
    elevation: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    marginLeft: 12,
    color: '#333',
    flex: 1,
  },
  itemDescription: {
    fontSize: 14,
    color: '#666',
    marginLeft: 45 + 12,
    marginBottom: 8,
  },
  itemPrice: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: 'bold',
    alignSelf: 'flex-end',
    marginRight: 10,
    marginTop: 4,
  },
  quantity: {
    fontSize: 18,
    marginHorizontal: 12,
    fontWeight: 'bold',
    color: '#333',
    minWidth: 25,
    textAlign: 'center',
  },
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
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
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
