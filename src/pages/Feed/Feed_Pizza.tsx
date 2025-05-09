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
  TextInput,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import axios from 'axios';
import {AuthContext} from '../../contexts/AuthContext';
import {Picker} from '@react-native-picker/picker';

// --- Interfaces ---
interface Pizza {
  id: number;
  nome: string;
  preco: number;
  ingredientes: string;
  detalhes?: string;
  caminho: string;
  categoria: string;
  tamanho?: string;
}

interface ApiProdutoItem {
  produto_id: string | number;
  nome: string;
  preco: string | number;
  tamanho: string | number;
  ingredientes: string;
  detalhes?: string;
  caminho: string;
  categoria: string;
}

export default function Feed() {
  const {user} = useContext(AuthContext);
  const [produtos, setProdutos] = useState<Pizza[]>([]);
  const [filteredItems, setFilteredItems] = useState<Pizza[]>([]); // Lista filtrada para AMBAS as listas
  const [quantities, setQuantities] = useState<{[key: number]: number}>({});
  const [selectedPizzas, setSelectedPizzas] = useState<Pizza[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [categories, setCategories] = useState<string[]>(['Todos']);

  // useEffect para buscar produtos e extrair categorias
  useEffect(() => {
    const fetchProdutos = async () => {
      setLoading(true);
      setProdutos([]);
      setFilteredItems([]);
      setCategories(['Todos']);
      setSelectedCategory('Todos');
      try {
        const response = await axios.get<ApiProdutoItem[]>(
          'https://devweb3.ok.etc.br/api_mobile/api_get_produtos.php',
        );
        if (!Array.isArray(response.data)) {
          throw new Error('Formato inválido da resposta da API');
        }
        const produtosValidos: Pizza[] = response.data
          .filter(
            item =>
              item &&
              typeof item === 'object' &&
              item.produto_id != null &&
              item.nome != null &&
              item.preco != null &&
              item.categoria != null,
          )
          .map(
            (item): Pizza => ({
              id: Number(item.produto_id),
              nome: String(item.nome),
              ingredientes: String(
                item.ingredientes || 'Ingredientes não disponíveis',
              ),
              preco: parseFloat(String(item.preco)) || 0,
              caminho: String(item.caminho || ''),
              detalhes: String(item.detalhes || ''),
              categoria: String(item.categoria || 'Outros'),
              tamanho: String(item.tamanho || ''),
            }),
          );
        setProdutos(produtosValidos);
        if (produtosValidos.length > 0) {
          const uniqueCategories = [
            'Todos',
            ...new Set(produtosValidos.map(p => p.categoria)),
          ].sort((a, b) =>
            a === 'Todos' ? -1 : b === 'Todos' ? 1 : a.localeCompare(b),
          );
          setCategories(uniqueCategories);
        } else {
          setCategories(['Todos']);
        }
      } catch (error) {
        console.error('Erro ao buscar produtos:', error);
        setProdutos([]);
        setCategories(['Todos']);
      } finally {
        setLoading(false);
      }
    };
    fetchProdutos();
  }, []);

  // useEffect para aplicar filtros combinados
  useEffect(() => {
    let itemsToFilter = [...produtos];
    if (selectedCategory !== 'Todos') {
      itemsToFilter = itemsToFilter.filter(
        item => item.categoria === selectedCategory,
      );
    }
    if (searchQuery) {
      itemsToFilter = itemsToFilter.filter(item =>
        item.nome.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }
    setFilteredItems(itemsToFilter); // Atualiza a lista que será usada por ambas as FlatLists
  }, [produtos, selectedCategory, searchQuery]);

  // --- Funções de Carrinho e Lógica de Pizza ---
  // (Colar aqui as funções: sendItemToCartAPI, handlePizzaSelectionLogic, handleAddItemDirectly,
  // handleAddItemClick, handleMenuPizzaClick, handleRemovePizza,
  // handleConfirmAddition, handleCancelAddition como estavam antes)
  // --- Função Auxiliar para Enviar ao Carrinho ---
  const sendItemToCartAPI = (itemData: {
    cliente_id: number | string;
    pizza_id: number;
    preco: number;
    nome_pizza: string;
    tipo_pizza: string;
  }) => {
    /* ...código... */
    console.log('Enviando para API /api_registrar_carrinho.php:', itemData);
    return axios
      .post(
        'https://devweb3.ok.etc.br/api/api_registrar_carrinho.php',
        itemData,
      )
      .then(response => {
        console.log(
          `Item ${itemData.nome_pizza} (${itemData.tipo_pizza}) registrado. Resposta:`,
          response.data,
        );
        return response;
      })
      .catch(error => {
        console.error(
          `Erro ao registrar ${itemData.nome_pizza} (ID: ${itemData.pizza_id}) no carrinho:`,
          error,
        );
        if (axios.isAxiosError(error) && error.response) {
          console.error(
            'Resposta de Erro da API (registrar carrinho):',
            error.response.data,
          );
          Alert.alert(
            'Erro',
            `Não foi possível adicionar ${itemData.nome_pizza}. ${
              error.response.data?.message || 'Tente novamente.'
            }`,
          );
        }
        throw error;
      });
  };
  // --- Lógica de Seleção de PIZZA (meia/inteira) ---
  const handlePizzaSelectionLogic = (pizza: Pizza) => {
    if (!pizza || pizza.id == null) return;
    if (!user || !user.id) {
      setModalMessage('Você precisa estar logado para adicionar itens.');
      setSelectedPizzas([]);
      setQuantities({});
      setModalVisible(true);
      return;
    }
    const currentQuantity = quantities[pizza.id] || 0;
    if (currentQuantity === 1) {
      setModalMessage(
        `Deseja adicionar uma pizza inteira ${pizza.nome}? Preço: R$ ${(
          (pizza.preco || 0) * 2
        ).toFixed(2)}`,
      );
      setSelectedPizzas([pizza]);
      setModalVisible(true);
    } else if (selectedPizzas.length === 1) {
      const previousPizza = selectedPizzas[0];
      const precoMeiaMeia = (previousPizza.preco || 0) + (pizza.preco || 0);
      setModalMessage(
        `Deseja adicionar meia ${previousPizza.nome} e meia ${
          pizza.nome
        }? Preço: R$ ${precoMeiaMeia.toFixed(2)}`,
      );
      setSelectedPizzas([...selectedPizzas, pizza]);
      setModalVisible(true);
    } else {
      setQuantities(prev => ({...prev, [pizza.id]: 1}));
      setSelectedPizzas([pizza]);
    }
  };
  // --- Adicionar Itens NÃO-PIZZA Diretamente (com Alert de sucesso) ---
  const handleAddItemDirectly = async (item: Pizza) => {
    if (!item || item.id == null) return;
    if (!user || !user.id) {
      setModalMessage('Você precisa estar logado para adicionar itens.');
      setSelectedPizzas([]);
      setQuantities({});
      setModalVisible(true);
      return;
    }
    const itemData = {
      cliente_id: user.id,
      pizza_id: item.id,
      preco: item.preco || 0,
      nome_pizza: item.nome,
      tipo_pizza:
        item.categoria?.toLowerCase() === 'pizza' ? 'inteira' : 'item',
    };
    try {
      // setLoading(true); // Pode causar piscar da tela, talvez remover
      await sendItemToCartAPI(itemData);
      Alert.alert('Sucesso', `${item.nome} adicionado ao carrinho!`);
    } catch (error) {
      console.error('Falha ao adicionar item diretamente:', error);
    } finally {
      // setLoading(false);
    }
  };
  // --- Função Dispatcher ---
  const handleAddItemClick = (item: Pizza) => {
    if (!item || item.id == null) return;
    if (item.categoria?.toLowerCase() === 'pizza') {
      handlePizzaSelectionLogic(item);
    } else {
      handleAddItemDirectly(item);
    }
  };
  // --- handleMenuPizzaClick ---
  const handleMenuPizzaClick = (item: Pizza) => {
    if (!item || item.id == null) return;
    if (item.categoria?.toLowerCase() !== 'pizza') {
      console.warn(
        `Item "${item.nome}" no menu não é pizza, adicionando diretamente.`,
      );
      handleAddItemDirectly(item);
      return;
    }
    if (!user || !user.id) {
      setModalMessage('Você precisa estar logado para adicionar itens.');
      setSelectedPizzas([]);
      setModalVisible(true);
      return;
    }
    setModalMessage(
      `Deseja adicionar uma pizza inteira ${item.nome}? Preço: R$ ${(
        (item.preco || 0) * 2
      ).toFixed(2)}`,
    );
    setSelectedPizzas([item]);
    setQuantities({});
    setModalVisible(true);
  };
  // --- handleRemovePizza (Só afeta seleção de pizzas) ---
  const handleRemovePizza = (pizza: Pizza) => {
    if (pizza.categoria?.toLowerCase() !== 'pizza') {
      return;
    }
    if (!pizza || pizza.id == null) return;
    const currentQuantity = quantities[pizza.id] || 0;
    if (currentQuantity > 0) {
      setQuantities(prev => ({...prev, [pizza.id]: currentQuantity - 1}));
      if (
        currentQuantity === 1 &&
        selectedPizzas.length === 1 &&
        selectedPizzas[0]?.id === pizza.id
      ) {
        setSelectedPizzas([]);
      }
    }
  };
  // --- handleConfirmAddition (Confirmação de PIZZAS do modal) ---
  const handleConfirmAddition = () => {
    if (!user || !user.id) {
      setModalMessage(
        'Você precisa estar logado para adicionar itens ao carrinho.',
      );
      return;
    }
    if (modalMessage.includes('logado')) {
      handleCancelAddition();
      return;
    }
    const validSelectedPizzas = selectedPizzas.filter(
      p => p && p.id != null && p.categoria?.toLowerCase() === 'pizza',
    );
    if (validSelectedPizzas.length === 0) {
      handleCancelAddition();
      return;
    }
    const apiCalls = validSelectedPizzas.map(pizza => {
      const tipoPizza = validSelectedPizzas.length === 1 ? 'inteira' : 'meia';
      const precoFinal =
        tipoPizza === 'inteira' ? (pizza.preco || 0) * 2 : pizza.preco || 0;
      const itemData = {
        cliente_id: user.id!,
        pizza_id: pizza.id,
        preco: parseFloat(precoFinal.toFixed(2)),
        nome_pizza: pizza.nome,
        tipo_pizza: tipoPizza,
      };
      return sendItemToCartAPI(itemData);
    });
    Promise.all(apiCalls)
      .then(results => console.log('Pizzas selecionadas processadas.'))
      .catch(error => console.error('Erro ao processar pizzas:', error))
      .finally(() => handleCancelAddition());
  };
  // --- handleCancelAddition (Limpa estado de seleção de pizza) ---
  const handleCancelAddition = () => {
    setModalVisible(false);
    setQuantities({});
    setSelectedPizzas([]);
    setModalMessage('');
  };

  // --- Render Item ---
  const renderItem = ({item}: {item: Pizza}) => {
    const isPizza = item.categoria?.toLowerCase() === 'pizza';
    return (
      <View style={styles.itemContainer}>
        <View style={styles.row}>
          {isPizza ? (
            <TouchableOpacity onPress={() => handleRemovePizza(item)}>
              <Icon name="minus-circle" size={25} color="#ff6347" />
            </TouchableOpacity>
          ) : (
            <View style={styles.buttonPlaceholder} />
          )}
          <Text style={styles.quantity}>
            {isPizza ? quantities[item?.id] || 0 : ''}
          </Text>
          <TouchableOpacity onPress={() => handleAddItemClick(item)}>
            <Icon name="plus-circle" size={25} color="#32cd32" />
          </TouchableOpacity>
          <Text style={styles.itemTitle}>
            {item?.nome || 'Nome Indisponível'}
          </Text>
        </View>
        <Text style={styles.itemDescription}>
          {item?.ingredientes || item?.detalhes || 'Detalhes indisponíveis'}
        </Text>
        <Text style={styles.itemPrice}>{`R$ ${(item?.preco ?? 0).toFixed(
          2,
        )}`}</Text>
      </View>
    );
  };

  // --- Render Menu Item ---
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
              console.log(`Erro img ${item?.caminho}:`, e.nativeEvent.error)
            }
          />
        ) : (
          <View style={[styles.menuItemImage, styles.placeholderImage]}>
            <Icon
              name={
                item.categoria?.toLowerCase() === 'pizza'
                  ? 'pizza-slice'
                  : 'shopping-basket'
              }
              size={20}
              color="#ccc"
            />
          </View>
        )}
      </View>
      <Text style={styles.menuItemText} numberOfLines={2}>
        {item?.nome || '???'}
      </Text>
    </TouchableOpacity>
  );

  // --- Estrutura JSX ---
  return (
    <View style={styles.container}>
      {/* Container para Filtros e Busca */}
      <View style={styles.filtersContainer}>
        {/* Picker */}
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedCategory}
            style={styles.picker}
            onValueChange={itemValue => setSelectedCategory(itemValue)}
            mode="dropdown"
            prompt="Selecione Categoria"
            dropdownIconColor="#FFA500">
            {categories.map((category, index) => (
              <Picker.Item
                key={index}
                label={category}
                value={category}
                style={styles.pickerItem}
              />
            ))}
          </Picker>
        </View>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nome..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#888"
          />
          <View style={styles.searchIconContainer}>
            <Icon name="search" size={18} color="#fff" />
          </View>
        </View>
      </View>

      {/* Menu Horizontal (AGORA USANDO DADOS FILTRADOS) */}
      <View style={styles.menuContainer}>
        {/* Mostra loader APENAS se estiver carregando E a lista original ainda estiver vazia */}
        {loading && produtos.length === 0 ? (
          <ActivityIndicator
            style={{paddingVertical: 20}}
            size="small"
            color="#FFA500"
          />
        ) : (
          <FlatList
            // ***** ALTERAÇÃO PRINCIPAL AQUI *****
            data={filteredItems} // Usa a mesma lista filtrada da vertical
            keyExtractor={(item, index) => `menu-${item?.id ?? index}`}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.menuList}
            renderItem={renderMenuItem} // Reutiliza a função de renderização do item do menu
            ListEmptyComponent={
              // Mostra mensagem apenas se não estiver carregando E a lista filtrada estiver vazia
              !loading && filteredItems.length === 0 ? (
                <Text style={styles.emptyMenu}>
                  {/* Mensagem varia se a lista original tem itens ou não */}
                  {produtos.length > 0
                    ? 'Nenhum item para os filtros.'
                    : 'Nenhum item no menu.'}
                </Text>
              ) : null
            }
          />
        )}
      </View>

      {/* Banner */}
      <View style={styles.banner}>
        <Image
          source={require('../../assets/banner.png')}
          style={styles.bannerImage}
          onError={e => console.log('Erro banner:', e.nativeEvent.error)}
        />
      </View>

      {/* Lista Principal Vertical */}
      {loading && produtos.length === 0 ? (
        <ActivityIndicator
          style={{marginTop: 50}}
          size="large"
          color="#FFA500"
        />
      ) : (
        <FlatList
          data={filteredItems} // Já usava a lista filtrada
          keyExtractor={(item, index) => `main-${item?.id ?? index}`}
          renderItem={renderItem} // Função de renderização da lista principal
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyListContainer}>
              <Text style={styles.empty}>
                {!loading && produtos.length === 0
                  ? 'Nenhum item disponível no momento.'
                  : 'Nenhum item encontrado para os filtros aplicados.'}
              </Text>
            </View>
          }
        />
      )}

      {/* Modal */}
      <Modal
        animationType="fade"
        transparent
        visible={modalVisible}
        onRequestClose={handleCancelAddition}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalMessage}>{modalMessage}</Text>
            <View style={styles.modalButtons}>
              {modalMessage &&
              !modalMessage.includes('logado') &&
              selectedPizzas.length > 0 ? (
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

// --- Estilos ---
const IMAGE_SIZE = 55;
const BORDER_WIDTH = 2;
const IMAGE_WITH_BORDER_SIZE = IMAGE_SIZE + BORDER_WIDTH * 2;
const BUTTON_ICON_SIZE = 25;

// (Colar aqui os estilos completos da sua versão anterior)
const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#f8f8f8'},
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  pickerContainer: {
    flex: 1,
    height: 45,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    justifyContent: 'center',
    marginRight: 10,
    overflow: 'hidden',
  },
  picker: {height: '100%', width: '100%', color: '#333'},
  pickerItem: {fontSize: 14, backgroundColor: '#fff'},
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 45,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: '#fff',
    paddingLeft: 10,
    paddingRight: 5,
  },
  searchInput: {flex: 1, height: '100%', fontSize: 15, color: '#333'},
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
    minHeight: IMAGE_WITH_BORDER_SIZE + 30,
  }, // Garante altura mínima para mensagem de vazio
  menuItemOuterContainer: {
    alignItems: 'center',
    marginHorizontal: 8,
    width: IMAGE_WITH_BORDER_SIZE + 10,
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderImage: {backgroundColor: '#f0f0f0'},
  menuItemText: {
    color: '#555',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 2,
    paddingHorizontal: 2,
  },
  emptyMenu: {
    // Estilo para mensagem de menu vazio
    paddingHorizontal: 20,
    color: '#999',
    textAlign: 'center',
    // Tenta centralizar verticalmente no espaço do menu
    lineHeight: IMAGE_WITH_BORDER_SIZE + 20, // Ajuste conforme altura do menu
    width: '100%', // Ocupa a largura
    alignSelf: 'center',
  },
  banner: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 5,
    marginBottom: 10,
  },
  bannerImage: {
    width: '95%',
    height: undefined,
    aspectRatio: 16 / 6,
    resizeMode: 'contain',
    borderRadius: 8,
  },
  list: {width: '100%', paddingHorizontal: 16, paddingBottom: 20},
  itemContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
    marginBottom: 10,
    borderRadius: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 1.5,
  },
  row: {flexDirection: 'row', alignItems: 'center', marginBottom: 8},
  buttonPlaceholder: {width: BUTTON_ICON_SIZE},
  quantity: {
    fontSize: 18,
    marginHorizontal: 12,
    fontWeight: 'bold',
    color: '#333',
    minWidth: 25,
    textAlign: 'center',
    lineHeight: BUTTON_ICON_SIZE,
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
    marginLeft: 16,
    paddingLeft: 0,
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
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
    paddingHorizontal: 20,
  },
  empty: {textAlign: 'center', fontSize: 16, color: '#999'},
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
  modalButtons: {flexDirection: 'row', justifyContent: 'center', width: '100%'},
});
