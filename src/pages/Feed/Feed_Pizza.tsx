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
  ingredientes: string;
  detalhes?: string;
  caminho: string;
  categoria: string;
  preco: number;
  precoPequena?: number | null;
  precoMedia?: number | null;
  precoGrande?: number | null;
  precoGrandeInteira?: number | null;
  precoMediaInteira?: number | null;
  tamanhoApi?: string; // Pode ser usado para tamanho de itens não-pizza
}

interface ApiProdutoItem {
  produto_id: string | number;
  nome: string;
  ingredientes: string;
  detalhes?: string;
  caminho: string;
  categoria: string;
  pequena?: string | null;
  media?: string | null;
  grande?: string | null;
  grande_inteira?: string | null;
  media_inteira?: string | null;
  tamanho?: string; // Recebido da API de produtos
}

// Tipos para o modal de opções de pizza
type PizzaTamanho = 'pequena' | 'media' | 'grande';
type PizzaTipo = 'inteira' | 'meia';

// Interface para os dados enviados para a API de registrar item
interface ItemPedidoPayload {
  cliente_id: string | number;
  pizza_id: number; // Mapeia para produto_id na API
  preco: number; // Mapeia para total na API
  tamanho_selecionado: string; // Mapeia para tamanho na API
  tipo_pizza: string; // Mapeia para tipo_tamanho na API ('inteira', 'meia')
  // nome_pizza?: string; // Opcional, pois a API atual não usa para 'obs'
}

export default function Feed() {
  const {user} = useContext(AuthContext);
  const [produtos, setProdutos] = useState<Pizza[]>([]);
  const [filteredItems, setFilteredItems] = useState<Pizza[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [categories, setCategories] = useState<string[]>(['Todos']);

  const [pizzaOptionsModalVisible, setPizzaOptionsModalVisible] =
    useState(false);
  const [currentPizzaForOptions, setCurrentPizzaForOptions] =
    useState<Pizza | null>(null);
  const [selectedTamanhoModal, setSelectedTamanhoModal] =
    useState<PizzaTamanho>('pequena');
  const [selectedTipoModal, setSelectedTipoModal] =
    useState<PizzaTipo>('inteira');
  const [calculatedPriceModal, setCalculatedPriceModal] = useState<number>(0);

  const parseApiPrice = (price: string | null | undefined): number | null => {
    if (price === null || price === undefined || price === '') return null;
    const num = parseFloat(price);
    return isNaN(num) ? null : num;
  };

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
          throw new Error('Formato inválido');
        }
        const produtosValidos: Pizza[] = response.data
          .filter(
            item =>
              item &&
              typeof item === 'object' &&
              item.produto_id != null &&
              item.nome != null &&
              item.categoria != null,
          )
          .map((item): Pizza => {
            const pPequena = parseApiPrice(item.pequena);
            const pMedia = parseApiPrice(item.media);
            const pGrande = parseApiPrice(item.grande);
            const pGrandeInteira = parseApiPrice(item.grande_inteira);
            const pMediaInteira = parseApiPrice(item.media_inteira);
            const precoBase = pPequena ?? pMedia ?? pGrande ?? 0;

            return {
              id: Number(item.produto_id),
              nome: String(item.nome),
              ingredientes: String(item.ingredientes || 'Ingr. não disp.'),
              detalhes: String(item.detalhes || ''),
              caminho: String(item.caminho || ''),
              categoria: String(item.categoria || 'Outros'),
              preco: precoBase,
              precoPequena: pPequena,
              precoMedia: pMedia,
              precoGrande: pGrande,
              precoGrandeInteira: pGrandeInteira,
              precoMediaInteira: pMediaInteira,
              tamanhoApi: String(item.tamanho || ''), // Recebido da API de produtos
            };
          });
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
        console.error('Erro produtos:', error);
        setProdutos([]);
        setCategories(['Todos']);
      } finally {
        setLoading(false);
      }
    };
    fetchProdutos();
  }, []);

  useEffect(() => {
    let itemsToFilter = [...produtos];
    if (selectedCategory !== 'Todos')
      itemsToFilter = itemsToFilter.filter(
        item => item.categoria === selectedCategory,
      );
    if (searchQuery)
      itemsToFilter = itemsToFilter.filter(item =>
        item.nome.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    setFilteredItems(itemsToFilter);
  }, [produtos, selectedCategory, searchQuery]);

  const sendItemToCartAPI = (itemData: ItemPedidoPayload) => {
    console.log('Enviando para api_registrar_item_pedido.php:', itemData);
    return axios
      .post(
        'https://devweb3.ok.etc.br/api_mobile/api_registrar_item_pedido.php',
        itemData,
      )
      .then(response => {
        console.log(
          `Item (ID Prod: ${itemData.pizza_id}) registrado. Resposta:`,
          response.data,
        );
        return response.data;
      })
      .catch(error => {
        console.error(
          `Erro ao registrar item (ID Prod: ${itemData.pizza_id}):`,
          error,
        );
        if (axios.isAxiosError(error) && error.response) {
          console.error(
            'Dados da resposta do erro da API:',
            error.response.data,
          );
          Alert.alert(
            'Erro ao Adicionar',
            `Falha ao adicionar. ${
              error.response.data?.message || 'Tente novamente.'
            }`,
          );
        } else {
          Alert.alert('Erro ao Adicionar', 'Ocorreu um erro desconhecido.');
        }
        throw error;
      });
  };

  const handleAddNonPizzaDirectly = async (item: Pizza) => {
    if (!user || !user.id) {
      Alert.alert(
        'Login Necessário',
        'Você precisa estar logado para adicionar itens.',
      );
      return;
    }

    const precoFinal =
      typeof item.precoPequena === 'number'
        ? item.precoPequena
        : typeof item.preco === 'number'
        ? item.preco
        : null;

    if (precoFinal === null) {
      Alert.alert(
        'Atenção',
        `O item "${item.nome}" não possui um preço definido.`,
      );
      return;
    }

    // Definir um tamanho padrão para itens não-pizza.
    // A API espera 'pequena', 'media', ou 'grande' (ou o que estiver no ENUM do DB).
    // 'item.tamanhoApi' pode vir da API de produtos se for um tamanho válido.
    // Caso contrário, um default como 'pequena' ou 'unico' (se 'unico' for um ENUM válido).
    const tamanhoParaApi =
      item.tamanhoApi &&
      ['pequena', 'media', 'grande'].includes(item.tamanhoApi.toLowerCase())
        ? item.tamanhoApi.toLowerCase()
        : 'pequena'; // Default para itens não-pizza se tamanhoApi não for válido/específico

    // tipo_pizza para a API (tipo_tamanho no DB) deve ser 'inteira' ou 'meia'.
    const tipoPizzaParaApi = 'inteira'; // Para itens não-pizza, 'inteira' é o mais lógico

    const itemData: ItemPedidoPayload = {
      cliente_id: String(user.id), // API pode esperar string ou converter
      pizza_id: item.id,
      preco: precoFinal,
      tamanho_selecionado: tamanhoParaApi,
      tipo_pizza: tipoPizzaParaApi,
    };

    try {
      const response = await sendItemToCartAPI(itemData);
      if (response.success === true) {
        Alert.alert('Sucesso', `${item.nome} adicionado ao carrinho!`);
      } else {
        Alert.alert(
          'Erro ao Adicionar',
          response.message ||
            `Não foi possível adicionar o item "${item.nome}".`,
        );
      }
    } catch (error) {
      // Erro já tratado visualmente em sendItemToCartAPI
      console.error('Erro ao tentar adicionar item não-pizza:', error);
    }
  };

  const handleAddItem = (item: Pizza) => {
    if (!user || !user.id) {
      Alert.alert(
        'Login Necessário',
        'Você precisa estar logado para adicionar itens.',
      );
      return;
    }
    if (item.categoria?.toLowerCase() === 'pizza') {
      setCurrentPizzaForOptions(item);
      const defaultTamanho =
        item.precoPequena !== null
          ? 'pequena'
          : item.precoMedia !== null
          ? 'media'
          : item.precoGrande !== null
          ? 'grande'
          : 'pequena'; // Fallback caso nenhum preço esteja definido
      setSelectedTamanhoModal(defaultTamanho as PizzaTamanho);
      setSelectedTipoModal('inteira');
      setPizzaOptionsModalVisible(true);
    } else {
      handleAddNonPizzaDirectly(item);
    }
  };

  useEffect(() => {
    if (currentPizzaForOptions) {
      let price = 0;
      const pizza = currentPizzaForOptions;
      if (selectedTipoModal === 'inteira') {
        if (
          selectedTamanhoModal === 'pequena' &&
          typeof pizza.precoPequena === 'number'
        )
          price = pizza.precoPequena * 2;
        else if (
          selectedTamanhoModal === 'media' &&
          typeof pizza.precoMediaInteira === 'number'
        )
          price = pizza.precoMediaInteira;
        else if (
          selectedTamanhoModal === 'media' &&
          typeof pizza.precoMedia === 'number'
        )
          price = pizza.precoMedia * 2;
        else if (
          selectedTamanhoModal === 'grande' &&
          typeof pizza.precoGrandeInteira === 'number'
        )
          price = pizza.precoGrandeInteira;
        else if (
          selectedTamanhoModal === 'grande' &&
          typeof pizza.precoGrande === 'number'
        )
          price = pizza.precoGrande * 2;
      } else {
        // Meia
        if (
          selectedTamanhoModal === 'media' &&
          typeof pizza.precoMedia === 'number'
        )
          price = pizza.precoMedia;
        else if (
          selectedTamanhoModal === 'grande' &&
          typeof pizza.precoGrande === 'number'
        )
          price = pizza.precoGrande;
      }
      setCalculatedPriceModal(price);
    }
  }, [currentPizzaForOptions, selectedTamanhoModal, selectedTipoModal]);

  const handleConfirmPizzaOptions = async () => {
    if (!currentPizzaForOptions || !user || !user.id) return;

    if (calculatedPriceModal <= 0) {
      Alert.alert('Atenção', 'Preço inválido ou não selecionado corretamente.');
      return;
    }

    // const nomePizzaFinal = // A API atual não usa o nome para 'obs'
    //   selectedTipoModal === 'meia'
    //     ? `Meia ${currentPizzaForOptions.nome} (${selectedTamanhoModal})`
    //     : `${currentPizzaForOptions.nome} (${selectedTamanhoModal} ${selectedTipoModal})`;

    const itemData: ItemPedidoPayload = {
      cliente_id: String(user.id),
      pizza_id: currentPizzaForOptions.id,
      preco: calculatedPriceModal,
      tamanho_selecionado: selectedTamanhoModal,
      tipo_pizza: selectedTipoModal,
    };

    try {
      const response = await sendItemToCartAPI(itemData);
      if (response.success === true) {
        Alert.alert(
          'Sucesso',
          `${currentPizzaForOptions.nome} (${selectedTamanhoModal} ${selectedTipoModal}) adicionada ao carrinho!`,
        );
        setPizzaOptionsModalVisible(false);
        setCurrentPizzaForOptions(null);
      } else {
        Alert.alert(
          'Erro ao Adicionar',
          response.message || `Não foi possível adicionar a pizza.`,
        );
      }
    } catch (error) {
      console.error('Erro ao tentar confirmar opções de pizza:', error);
    }
  };

  const renderItem = ({item}: {item: Pizza}) => {
    const precoExibicao =
      typeof item.precoPequena === 'number'
        ? `R$ ${item.precoPequena.toFixed(2)}`
        : item.preco > 0
        ? `R$ ${item.preco.toFixed(2)}`
        : 'Preço Indisp.';

    return (
      <View style={styles.itemContainer}>
        <Text style={styles.itemTitle}>
          {item?.nome || 'Nome Indisponível'}
        </Text>
        <Text style={styles.itemDescription}>
          {item?.ingredientes || item?.detalhes || 'Detalhes indisponíveis'}
        </Text>
        <Text style={styles.itemPrice}>{precoExibicao}</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => handleAddItem(item)}>
          <Text style={styles.addButtonText}>Adicionar</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderMenuItem = ({item}: {item: Pizza}) => (
    <TouchableOpacity
      style={styles.menuItemOuterContainer}
      onPress={() => handleAddItem(item)}
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
      <Text style={styles.menuItemText} numberOfLines={1}>
        {item?.nome || '???'}
      </Text>
      {typeof item.precoPequena === 'number' && (
        <Text style={styles.menuItemPrice}>
          R$ {item.precoPequena.toFixed(2)}
        </Text>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.filtersContainer}>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedCategory}
            style={styles.picker}
            onValueChange={itemValue => setSelectedCategory(itemValue)}
            mode="dropdown"
            dropdownIconColor="#FFA500">
            {categories.map((cat, idx) => (
              <Picker.Item
                key={idx}
                label={cat}
                value={cat}
                style={styles.pickerItem}
              />
            ))}
          </Picker>
        </View>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#888"
          />
          <View style={styles.searchIconContainer}>
            <Icon name="search" size={18} color="#fff" />
          </View>
        </View>
      </View>

      <View style={styles.menuContainer}>
        {loading && !produtos.length ? (
          <ActivityIndicator
            style={{paddingVertical: 20}}
            size="small"
            color="#FFA500"
          />
        ) : (
          <FlatList
            data={filteredItems}
            keyExtractor={(it, idx) => `menu-${it?.id ?? idx}`}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.menuList}
            renderItem={renderMenuItem}
            ListEmptyComponent={
              !loading && !filteredItems.length ? (
                <Text style={styles.emptyMenu}>
                  {produtos.length ? 'Filtros sem resultado.' : 'Menu vazio.'}
                </Text>
              ) : null
            }
          />
        )}
      </View>

      <View style={styles.banner}>
        <Image
          source={require('../../assets/banner.png')}
          style={styles.bannerImage}
          onError={e => console.log('Erro banner:', e.nativeEvent.error)}
        />
      </View>

      {loading && !produtos.length ? (
        <ActivityIndicator
          style={{marginTop: 50}}
          size="large"
          color="#FFA500"
        />
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(it, idx) => `main-${it?.id ?? idx}`}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyListContainer}>
              <Text style={styles.empty}>
                {!loading && !produtos.length
                  ? 'Itens não disponíveis.'
                  : 'Nenhum item para os filtros.'}
              </Text>
            </View>
          }
        />
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={pizzaOptionsModalVisible}
        onRequestClose={() => {
          setPizzaOptionsModalVisible(false);
          setCurrentPizzaForOptions(null);
        }}>
        <View style={styles.modalOverlay}>
          <View style={styles.pizzaOptionsModalContent}>
            <Text style={styles.modalTitle}>
              {currentPizzaForOptions?.nome}
            </Text>

            <Text style={styles.pickerLabel}>Tamanho:</Text>
            <View style={styles.modalPickerContainer}>
              <Picker
                selectedValue={selectedTamanhoModal}
                style={styles.modalPicker}
                onValueChange={itemValue =>
                  setSelectedTamanhoModal(itemValue as PizzaTamanho)
                }
                mode="dropdown">
                {currentPizzaForOptions?.precoPequena !== null && (
                  <Picker.Item label="Pequena" value="pequena" />
                )}
                {currentPizzaForOptions?.precoMedia !== null && (
                  <Picker.Item label="Média" value="media" />
                )}
                {currentPizzaForOptions?.precoGrande !== null && (
                  <Picker.Item label="Grande" value="grande" />
                )}
              </Picker>
            </View>

            <Text style={styles.pickerLabel}>Tipo:</Text>
            <View style={styles.modalPickerContainer}>
              <Picker
                selectedValue={selectedTipoModal}
                style={styles.modalPicker}
                onValueChange={itemValue =>
                  setSelectedTipoModal(itemValue as PizzaTipo)
                }
                enabled={selectedTamanhoModal !== 'pequena'}
                mode="dropdown">
                <Picker.Item label="Inteira" value="inteira" />
                {selectedTamanhoModal !== 'pequena' && (
                  <Picker.Item label="Meia" value="meia" />
                )}
              </Picker>
            </View>

            <Text style={styles.modalPrice}>
              Preço: R$ {calculatedPriceModal.toFixed(2)}
            </Text>

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  setPizzaOptionsModalVisible(false);
                  setCurrentPizzaForOptions(null);
                }}>
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={handleConfirmPizzaOptions}>
                <Text style={styles.modalButtonText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// --- Estilos --- (Mantidos como antes, não vou repetir para economizar espaço)
const IMAGE_SIZE = 55;
const BORDER_WIDTH = 2;
const IMAGE_WITH_BORDER_SIZE = IMAGE_SIZE + BORDER_WIDTH * 2;

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
    minHeight: IMAGE_WITH_BORDER_SIZE + 50,
  },
  menuItemOuterContainer: {
    alignItems: 'center',
    marginHorizontal: 8,
    width: IMAGE_WITH_BORDER_SIZE + 30,
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
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 2,
    paddingHorizontal: 2,
  },
  menuItemPrice: {
    color: '#FFA500',
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 1,
  },
  emptyMenu: {
    paddingHorizontal: 20,
    color: '#999',
    textAlign: 'center',
    lineHeight: IMAGE_WITH_BORDER_SIZE + 20,
    width: '100%',
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
    padding: 15,
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
  itemTitle: {fontSize: 17, fontWeight: 'bold', color: '#333', marginBottom: 5},
  itemDescription: {fontSize: 14, color: '#666', marginBottom: 8},
  itemPrice: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  addButton: {
    backgroundColor: '#FFA500',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 5,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  pizzaOptionsModalContent: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  pickerLabel: {
    fontSize: 16,
    color: '#555',
    alignSelf: 'flex-start',
    marginLeft: 10,
    marginTop: 10,
    marginBottom: 5,
  },
  modalPickerContainer: {
    width: '100%',
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 15,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  modalPicker: {
    height: '100%',
    width: '100%',
    color: '#333',
  },
  modalPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E53935',
    marginVertical: 20,
  },
  modalButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 10,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  modalButtonConfirm: {
    backgroundColor: '#4CAF50',
  },
  modalButtonCancel: {
    backgroundColor: '#f44336',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
    paddingHorizontal: 20,
  },
  empty: {textAlign: 'center', fontSize: 16, color: '#999'},
});
