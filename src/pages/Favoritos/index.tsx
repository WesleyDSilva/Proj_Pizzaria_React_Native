// src/pages/Favoritos/index.tsx
import React, {useState, useEffect, useContext, useCallback} from 'react'; // Adicionado useCallback
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import {AuthContext} from '../../contexts/AuthContext';
import axios from 'axios';
import Icon from 'react-native-vector-icons/FontAwesome';
import {useIsFocused} from '@react-navigation/native';
import {Picker} from '@react-native-picker/picker';

const DEFAULT_IMAGE_URL =
  'https://via.placeholder.com/150/cccccc/808080?text=Item';
const API_GET_FAVORITOS_URL =
  'https://devweb3.ok.etc.br/api_mobile/api_get_pedidos_favoritos.php';
const API_DELETE_FAVORITO_URL =
  'https://devweb3.ok.etc.br/api/api_delete_favorito.php';
const API_GET_PRODUTOS_URL =
  'https://devweb3.ok.etc.br/api_mobile/api_get_produtos.php';
const API_REGISTRAR_ITEM_PEDIDO_URL =
  'https://devweb3.ok.etc.br/api_mobile/api_registrar_item_pedido.php';

interface FavoritoItem {
  id_favorito: number;
  cliente_id: number;
  id_pizza: number;
  nome_pizza: string;
  imagem: string;
}

interface ApiProdutoItem {
  produto_id: string | number;
  nome: string;
  ingredientes: string;
  detalhes?: string;
  caminho: string;
  categoria_id: string;
  categoria: string;
  pequena?: string | null;
  media?: string | null;
  grande?: string | null;
  grande_inteira?: string | null;
  media_inteira?: string | null;
  tamanho?: string;
}

interface ProdutoDetalhado {
  id: number;
  nome: string;
  ingredientes: string;
  detalhes?: string;
  caminho: string;
  categoria: string;
  precoBase: number;
  precoPequena?: number | null;
  precoMedia?: number | null;
  precoGrande?: number | null;
  precoMediaInteira?: number | null;
  precoGrandeInteira?: number | null;
  tamanhoOriginalApi?: string;
}

type PizzaTamanho = 'pequena' | 'media' | 'grande';
type PizzaTipo = 'inteira' | 'meia';

interface ItemPedidoPayloadAPI {
  cliente_id: string | number;
  produto_id: number;
  preco: number;
  tamanho_selecionado: string;
  tipo_tamanho: string;
  quantidade: number;
}

export default function Favoritos() {
  const {user} = useContext(AuthContext);
  const [favoritos, setFavoritos] = useState<FavoritoItem[]>([]);
  const [filteredFavoritos, setFilteredFavoritos] = useState<FavoritoItem[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const isFocused = useIsFocused();

  const [pizzaOptionsModalVisible, setPizzaOptionsModalVisible] =
    useState(false);
  const [currentProdutoParaOpcoes, setCurrentProdutoParaOpcoes] =
    useState<ProdutoDetalhado | null>(null);
  const [selectedTamanhoModal, setSelectedTamanhoModal] =
    useState<PizzaTamanho>('pequena');
  const [selectedTipoModal, setSelectedTipoModal] =
    useState<PizzaTipo>('inteira');
  const [calculatedPriceModal, setCalculatedPriceModal] = useState<number>(0);
  const [loadingProdutoDetalhes, setLoadingProdutoDetalhes] = useState(false);
  const [addingToCart, setAddingToCart] = useState<number | null>(null);

  const parseApiPrice = (price: string | null | undefined): number | null => {
    if (price === null || price === undefined || price === '') return null;
    const num = parseFloat(price);
    return isNaN(num) ? null : num;
  };

  const fetchFavoritos = useCallback(async () => {
    // Envolvido com useCallback
    if (!user?.id) {
      setFavoritos([]);
      // setFilteredFavoritos([]); // Será tratado pelo useEffect de filtro
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(
        `${API_GET_FAVORITOS_URL}?cliente_id=${user.id}`,
      );
      if (Array.isArray(response.data)) {
        const favsFormatados = response.data.map((fav: any) => ({
          id_favorito: Number(fav.id_favorito),
          cliente_id: Number(fav.cliente_id),
          id_pizza: Number(fav.id_pizza),
          nome_pizza: fav.nome_pizza || 'Favorito',
          imagem: fav.imagem || DEFAULT_IMAGE_URL,
        }));
        setFavoritos(favsFormatados); // Apenas atualiza 'favoritos'
        // setFilteredFavoritos(favsFormatados); // Removido daqui, useEffect cuidará disso
      } else {
        setFavoritos([]);
        // setFilteredFavoritos([]);
      }
    } catch (err) {
      setFavoritos([]);
      // setFilteredFavoritos([]);
      setError('Não foi possível carregar seus favoritos.');
      console.error('Erro fetchFavoritos:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]); // Dependência de user.id

  const removerFavorito = async (id_pizza: number) => {
    if (!user?.id) {
      Alert.alert('Erro', 'Usuário não identificado.');
      return;
    }
    try {
      const response = await axios.get(
        `${API_DELETE_FAVORITO_URL}?pizza_id=${id_pizza}&cliente_id=${user.id}`,
      );
      if (response.data.success) {
        // Atualiza 'favoritos', o useEffect cuidará de 'filteredFavoritos'
        setFavoritos(prev => prev.filter(fav => fav.id_pizza !== id_pizza));
        Alert.alert('Sucesso', 'Favorito removido!');
      } else {
        Alert.alert(
          'Erro',
          response.data.message || 'Não foi possível remover o favorito.',
        );
      }
    } catch (error) {
      Alert.alert('Erro', 'Erro de rede ao remover.');
      console.error('Erro removerFavorito:', error);
    }
  };

  // Função para o TextInput, apenas atualiza searchQuery
  const handleSearch = (text: string) => {
    setSearchQuery(text);
  };

  // useEffect para buscar favoritos quando a tela foca ou o usuário muda
  useEffect(() => {
    if (isFocused && user?.id) {
      fetchFavoritos();
    } else if (!user?.id) {
      setFavoritos([]); // Limpa a lista principal de favoritos
      // filteredFavoritos será limpo pelo useEffect abaixo por causa da mudança em 'favoritos'
      setSearchQuery('');
      setError(null);
    }
  }, [isFocused, user?.id, fetchFavoritos]); // Adicionado fetchFavoritos como dependência

  // useEffect para filtrar a lista quando searchQuery ou a lista original de favoritos mudar
  useEffect(() => {
    if (searchQuery === '') {
      setFilteredFavoritos(favoritos);
    } else {
      const filtered = favoritos.filter(fav =>
        fav.nome_pizza.toLowerCase().includes(searchQuery.toLowerCase()),
      );
      setFilteredFavoritos(filtered);
    }
  }, [searchQuery, favoritos]); // Re-executa quando searchQuery ou favoritos mudar

  const fetchProdutoDetalhes = async (
    produto_id: number,
  ): Promise<ProdutoDetalhado | null> => {
    // ... (implementação existente)
    setLoadingProdutoDetalhes(true);
    try {
      const response = await axios.get<ApiProdutoItem[]>(API_GET_PRODUTOS_URL);
      const produtoApi = response.data.find(
        p => Number(p.produto_id) === produto_id,
      );
      if (produtoApi) {
        const pPequena = parseApiPrice(produtoApi.pequena);
        const pMedia = parseApiPrice(produtoApi.media);
        const pGrande = parseApiPrice(produtoApi.grande);
        const pMediaInteira = parseApiPrice(produtoApi.media_inteira);
        const pGrandeInteira = parseApiPrice(produtoApi.grande_inteira);
        const precoBase =
          pPequena ?? pMedia ?? pGrande ?? pMediaInteira ?? pGrandeInteira ?? 0;
        return {
          id: Number(produtoApi.produto_id),
          nome: produtoApi.nome,
          ingredientes: produtoApi.ingredientes,
          detalhes: produtoApi.detalhes,
          caminho: produtoApi.caminho || DEFAULT_IMAGE_URL,
          categoria: produtoApi.categoria,
          precoBase: precoBase,
          precoPequena: pPequena,
          precoMedia: pMedia,
          precoGrande: pGrande,
          precoMediaInteira: pMediaInteira,
          precoGrandeInteira: pGrandeInteira,
          tamanhoOriginalApi: produtoApi.tamanho,
        };
      }
      Alert.alert('Erro', `Produto com ID ${produto_id} não encontrado.`);
      return null;
    } catch (error) {
      console.error('Erro detalhes produto:', error);
      Alert.alert('Erro', 'Detalhes do produto não carregados.');
      return null;
    } finally {
      setLoadingProdutoDetalhes(false);
    }
  };

  const sendItemToApiRegistrarPedido = async (
    itemData: ItemPedidoPayloadAPI,
  ) => {
    // ... (implementação existente)
    console.log('Enviando payload:', JSON.stringify(itemData));
    try {
      const response = await axios.post(
        API_REGISTRAR_ITEM_PEDIDO_URL,
        itemData,
      );
      if (response.data.success) {
        Alert.alert('Sucesso!', `${itemData.produto_id} adicionado.`);
      } else {
        Alert.alert('Erro', response.data.message || 'Falha.');
      }
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response)
        Alert.alert(
          'Erro API',
          `${error.response.data?.message || 'Tente novamente.'}`,
        );
      else Alert.alert('Erro', 'Erro desconhecido.');
      throw error;
    }
  };

  const handleAdicionarFavoritoAoCarrinho = async (
    itemFavorito: FavoritoItem,
  ) => {
    // ... (implementação existente, usando sendItemToApiRegistrarPedido)
    if (!user || !user.id) {
      Alert.alert('Login Necessário');
      return;
    }
    setAddingToCart(itemFavorito.id_favorito);
    const produtoDetalhado = await fetchProdutoDetalhes(itemFavorito.id_pizza);
    if (produtoDetalhado) {
      if (produtoDetalhado.categoria?.toLowerCase() === 'pizza') {
        setCurrentProdutoParaOpcoes(produtoDetalhado);
        let dT: PizzaTamanho = 'pequena';
        if (produtoDetalhado.precoPequena !== null) dT = 'pequena';
        else if (
          produtoDetalhado.precoMedia !== null ||
          produtoDetalhado.precoMediaInteira !== null
        )
          dT = 'media';
        else if (
          produtoDetalhado.precoGrande !== null ||
          produtoDetalhado.precoGrandeInteira !== null
        )
          dT = 'grande';
        setSelectedTamanhoModal(dT);
        setSelectedTipoModal('inteira');
        setPizzaOptionsModalVisible(true);
      } else {
        if (produtoDetalhado.precoBase <= 0) {
          Alert.alert(
            'Atenção',
            `Preço inválido para "${produtoDetalhado.nome}".`,
          );
          setAddingToCart(null);
          return;
        }
        let tApiNonPizza: PizzaTamanho = 'pequena';
        if (produtoDetalhado.tamanhoOriginalApi) {
          const tLower = produtoDetalhado.tamanhoOriginalApi.toLowerCase();
          if (tLower.includes('pequen')) tApiNonPizza = 'pequena';
          else if (tLower.includes('medi') || tLower.includes('médi'))
            tApiNonPizza = 'media';
          else if (tLower.includes('grand')) tApiNonPizza = 'grande';
        }
        const itemData: ItemPedidoPayloadAPI = {
          cliente_id: String(user.id),
          produto_id: produtoDetalhado.id,
          preco: produtoDetalhado.precoBase,
          tamanho_selecionado: tApiNonPizza,
          tipo_tamanho: 'inteira',
          quantidade: 1,
        };
        try {
          await sendItemToApiRegistrarPedido(itemData);
        } catch (e) {
          console.info('Catch add non-pizza fav');
        } finally {
          setAddingToCart(null);
        }
      }
    } else {
      setAddingToCart(null);
    }
  };

  useEffect(() => {
    // Calcular preço no modal
    if (currentProdutoParaOpcoes) {
      let price = 0;
      const pizza = currentProdutoParaOpcoes;
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
  }, [currentProdutoParaOpcoes, selectedTamanhoModal, selectedTipoModal]);

  const handleConfirmarAdicionarPizzaAoCarrinho = async () => {
    if (!currentProdutoParaOpcoes || !user || !user.id) {
      setAddingToCart(null);
      return;
    }
    if (calculatedPriceModal <= 0 && selectedTipoModal !== 'meia') {
      Alert.alert('Atenção', 'Preço/combinação inválido.');
      return;
    }
    const itemData: ItemPedidoPayloadAPI = {
      cliente_id: String(user.id),
      produto_id: currentProdutoParaOpcoes.id,
      preco: calculatedPriceModal,
      tamanho_selecionado: selectedTamanhoModal,
      tipo_tamanho: selectedTipoModal,
      quantidade: 1,
    };
    try {
      await sendItemToApiRegistrarPedido(itemData);
      setPizzaOptionsModalVisible(false);
      setCurrentProdutoParaOpcoes(null);
    } catch (error) {
      console.info('Catch confirm add pizza');
    } finally {
      if (currentProdutoParaOpcoes) setAddingToCart(null);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFA500" />
      </View>
    );
  }
  if (error && !loading && favoritos.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Meus Favoritos</Text>
        <View style={styles.centeredMessage}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={fetchFavoritos} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Tentar Novamente</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Meus Favoritos</Text>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar Favorito"
          value={searchQuery}
          onChangeText={handleSearch}
          placeholderTextColor="#888"
        />
        <View style={styles.searchIconContainer}>
          <Icon name="search" size={20} color="#fff" />
        </View>
      </View>

      {loadingProdutoDetalhes && (
        <ActivityIndicator
          size="small"
          color="#FFA500"
          style={{marginVertical: 10}}
        />
      )}

      {filteredFavoritos.length > 0 ? (
        <FlatList
          data={filteredFavoritos}
          keyExtractor={item => item.id_favorito.toString()}
          numColumns={2}
          contentContainerStyle={styles.multiItemContentContainer}
          renderItem={({item}) => {
            const isItemAddingToCart = addingToCart === item.id_favorito;
            return (
              <View style={styles.itemContainer}>
                <View style={styles.pizzaImageContainer}>
                  <Image
                    source={{uri: item.imagem}}
                    style={styles.pizzaImage}
                    resizeMode="contain"
                  />
                </View>
                <View style={styles.textContainer}>
                  <Text style={styles.pizzaName} numberOfLines={2}>
                    {item.nome_pizza}
                  </Text>
                </View>
                <View style={styles.actionButtonsContainer}>
                  <TouchableOpacity
                    onPress={() => removerFavorito(item.id_pizza)}
                    style={[styles.actionButton, styles.removeButton]}
                    disabled={isItemAddingToCart || loadingProdutoDetalhes}>
                    <Icon name="trash" size={18} color="#fff" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleAdicionarFavoritoAoCarrinho(item)}
                    style={[styles.actionButton, styles.addToCartButton]}
                    disabled={isItemAddingToCart || loadingProdutoDetalhes}>
                    {isItemAddingToCart ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Icon name="shopping-cart" size={18} color="#fff" />
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />
      ) : (
        <View style={styles.centeredMessage}>
          <Text style={styles.emptyText}>
            {loading
              ? ''
              : searchQuery
              ? 'Nenhum favorito para sua busca.'
              : 'Você não tem favoritos.'}
          </Text>
        </View>
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={pizzaOptionsModalVisible}
        onRequestClose={() => {
          setPizzaOptionsModalVisible(false);
          setCurrentProdutoParaOpcoes(null);
          setAddingToCart(null);
        }}>
        <View style={styles.modalOverlay}>
          <View style={styles.pizzaOptionsModalContent}>
            <Text style={styles.modalTitle}>
              {currentProdutoParaOpcoes?.nome}
            </Text>
            <Text style={styles.pickerLabel}>Tamanho:</Text>
            <View style={styles.modalPickerContainer}>
              <Picker
                selectedValue={selectedTamanhoModal}
                style={styles.modalPicker}
                onValueChange={v => setSelectedTamanhoModal(v as PizzaTamanho)}
                mode="dropdown">
                {currentProdutoParaOpcoes?.precoPequena !== null && (
                  <Picker.Item label="Pequena" value="pequena" />
                )}
                {(currentProdutoParaOpcoes?.precoMedia !== null ||
                  currentProdutoParaOpcoes?.precoMediaInteira !== null) && (
                  <Picker.Item label="Média" value="media" />
                )}
                {(currentProdutoParaOpcoes?.precoGrande !== null ||
                  currentProdutoParaOpcoes?.precoGrandeInteira !== null) && (
                  <Picker.Item label="Grande" value="grande" />
                )}
              </Picker>
            </View>
            <Text style={styles.pickerLabel}>Tipo:</Text>
            <View style={styles.modalPickerContainer}>
              <Picker
                selectedValue={selectedTipoModal}
                style={styles.modalPicker}
                onValueChange={v => setSelectedTipoModal(v as PizzaTipo)}
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
                  setCurrentProdutoParaOpcoes(null);
                  setAddingToCart(null);
                }}>
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={handleConfirmarAdicionarPizzaAoCarrinho}>
                <Text style={styles.modalButtonText}>Adicionar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// --- Estilos --- (Mesmos estilos da sua pergunta anterior, ligeiramente ajustados)
const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#f8f8f8', paddingTop: 20},
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '90%',
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 80,
    alignSelf: 'center',
    marginBottom: 15,
    backgroundColor: '#fff',
    paddingHorizontal: 10,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 15,
    paddingRight: 30,
    color: '#000',
  },
  searchIconContainer: {
    position: 'absolute',
    right: 10,
    backgroundColor: '#FFA500',
    padding: 5,
    borderRadius: 50,
  },
  multiItemContentContainer: {paddingHorizontal: 5, paddingBottom: 20},
  itemContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginVertical: 8,
    marginHorizontal: '1%',
    width: '48%',
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.2,
    shadowRadius: 2,
    paddingBottom: 10,
  },
  pizzaImageContainer: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: '#FFEACE',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 15,
    borderWidth: 2,
    borderColor: '#FFA831',
  },
  pizzaImage: {width: 100, height: 100, borderRadius: 50},
  textContainer: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  pizzaName: {
    fontSize: 15,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
    marginBottom: 4,
    minHeight: 36,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 10,
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
    marginHorizontal: 5,
  },
  removeButton: {backgroundColor: '#E57373'},
  addToCartButton: {backgroundColor: '#66BB6A'},
  centeredMessage: {justifyContent: 'center', alignItems: 'center', flex: 1},
  emptyText: {fontSize: 18, color: '#999', textAlign: 'center'},
  errorText: {
    fontSize: 18,
    color: '#E53935',
    marginBottom: 10,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#FFA500',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  retryButtonText: {color: '#fff', fontSize: 16},
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  pizzaOptionsModalContent: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 25,
    alignItems: 'stretch',
    elevation: 5,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 25,
    textAlign: 'center',
    color: '#333',
  },
  pickerLabel: {
    fontSize: 16,
    color: '#444',
    marginBottom: 5,
    fontWeight: '500',
  },
  modalPickerContainer: {
    width: '100%',
    height: 50,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 20,
    justifyContent: 'center',
    backgroundColor: '#f9f9f9',
  },
  modalPicker: {height: '100%', width: '100%', color: '#333'},
  modalPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#E64A19',
    marginVertical: 25,
    textAlign: 'center',
  },
  modalButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 15,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    elevation: 2,
  },
  modalButtonConfirm: {backgroundColor: '#FFA500', marginRight: 5},
  modalButtonCancel: {backgroundColor: '#757575', marginLeft: 5},
  modalButtonText: {color: '#fff', fontSize: 16, fontWeight: 'bold'},
});
