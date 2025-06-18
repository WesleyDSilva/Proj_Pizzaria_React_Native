import React, {useEffect, useState, useContext, useCallback} from 'react';
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
import axios, {AxiosError} from 'axios'; // Importar AxiosError para tipagem
import {AuthContext} from '../../contexts/AuthContext';
import {Picker} from '@react-native-picker/picker';
// import { useCarrinho } from '../../contexts/CarrinhoContext'; // Se for atualizar o carrinho global

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
  tamanhoApi?: string;
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
  tamanho?: string;
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

// Interface para a resposta esperada da API de registro de item
interface ApiResponseRegistrarItem {
  success: boolean;
  message?: string;
  // Outros campos que a API pode retornar em sucesso ou erro
}

const API_PRODUTOS_URL =
  'https://devweb3.ok.etc.br/api_mobile/api_get_produtos.php';
const API_REGISTRAR_ITEM_PEDIDO_URL =
  'https://devweb3.ok.etc.br/api_mobile/api_registrar_item_pedido.php';

export default function Feed() {
  const {user} = useContext(AuthContext);
  // const { fetchCarrinhoData } = useCarrinho();

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
  const [isSubmitting, setIsSubmitting] = useState(false); // Para loading do botão de confirmar no modal

  const parseApiPrice = (price: string | null | undefined): number | null => {
    if (price === null || price === undefined || price === '') return null;
    const num = parseFloat(price);
    return isNaN(num) ? null : num;
  };

  const fetchProdutos = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get<ApiProdutoItem[]>(API_PRODUTOS_URL);
      if (!Array.isArray(response.data)) {
        throw new Error('Formato de resposta inválido da API de produtos.');
      }
      const produtosValidos: Pizza[] = response.data
        .filter(
          item =>
            item &&
            item.produto_id != null &&
            item.nome != null &&
            item.categoria != null,
        )
        .map((item): Pizza => {
          const pPequena = parseApiPrice(item.pequena);
          const pMedia = parseApiPrice(item.media);
          const pGrande = parseApiPrice(item.grande);
          const pMediaInteira = parseApiPrice(item.media_inteira);
          const pGrandeInteira = parseApiPrice(item.grande_inteira);
          let precoBaseExibicao = 0;
          if (item.categoria?.toLowerCase() === 'pizza') {
            precoBaseExibicao =
              pPequena !== null
                ? pPequena * 2
                : pMediaInteira ??
                  (pMedia !== null
                    ? pMedia * 2
                    : pGrandeInteira ?? (pGrande !== null ? pGrande * 2 : 0));
          } else {
            precoBaseExibicao = pPequena ?? pMedia ?? pGrande ?? 0;
          }
          return {
            id: Number(item.produto_id),
            nome: String(item.nome),
            ingredientes: String(
              item.ingredientes || 'Ingredientes não disponíveis.',
            ),
            detalhes: String(item.detalhes || ''),
            caminho: String(item.caminho || ''),
            categoria: String(item.categoria || 'Outros'),
            preco: precoBaseExibicao,
            precoPequena: pPequena,
            precoMedia: pMedia,
            precoGrande: pGrande,
            precoGrandeInteira: pGrandeInteira,
            precoMediaInteira: pMediaInteira,
            tamanhoApi: String(item.tamanho || ''),
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
      console.error('Erro ao buscar produtos:', error);
      Alert.alert('Erro', 'Não foi possível carregar os produtos.');
      setProdutos([]);
      setCategories(['Todos']);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProdutos();
  }, [fetchProdutos]);

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

  const handleSearch = (text: string) => {
    setSearchQuery(text);
  };

  // Função centralizada para registrar item, com tratamento de erro
  const sendItemToApiRegistrarPedido = async (
    itemData: ItemPedidoPayloadAPI,
  ): Promise<ApiResponseRegistrarItem> => {
    console.log(
      'Enviando para api_registrar_item_pedido.php:',
      JSON.stringify(itemData),
    );
    setIsSubmitting(true); // Inicia o loading global para adição
    try {
      const response = await axios.post<ApiResponseRegistrarItem>(
        API_REGISTRAR_ITEM_PEDIDO_URL,
        itemData,
      );
      console.log(
        `Item (ID Prod: ${itemData.produto_id}) registrado. Resposta:`,
        response.data,
      );

      if (response.data.success) {
        Alert.alert('Sucesso!', `${itemData.produto_id} adicionado ao pedido.`); // Ajustar nome se tiver
        // if (fetchCarrinhoData) fetchCarrinhoData(); // Atualizar carrinho global
      } else {
        Alert.alert(
          'Erro ao Adicionar',
          response.data.message || 'Não foi possível adicionar o item.',
        );
      }
      return response.data;
    } catch (error) {
      // error é 'unknown'
      let errorMessage =
        'Ocorreu um erro desconhecido ao tentar adicionar o item.';
      let logMessage = `Erro desconhecido ao registrar item (ID Prod: ${itemData.produto_id})`;

      if (axios.isAxiosError(error)) {
        logMessage = `Erro Axios (ID Prod: ${itemData.produto_id}): Status ${error.response?.status}`;
        if (error.response) {
          const apiErrorData = error.response.data as ApiResponseRegistrarItem; // Tenta tipar
          console.error('Dados do erro da API:', apiErrorData);
          errorMessage =
            apiErrorData?.message ||
            `Falha na comunicação (código: ${error.response.status}).`;
          logMessage += ` - Data: ${JSON.stringify(apiErrorData)}`;
        } else if (error.request) {
          errorMessage = 'Sem resposta do servidor. Verifique sua conexão.';
          logMessage += ' - Sem resposta do servidor.';
        } else {
          errorMessage = `Erro ao preparar requisição: ${error.message}`;
          logMessage += ` - Erro na requisição: ${error.message}`;
        }
        Alert.alert('Erro ao Adicionar', errorMessage);
      } else if (error instanceof Error) {
        errorMessage = `Erro inesperado: ${error.message}`;
        logMessage = `Erro JS (ID Prod: ${itemData.produto_id}): ${error.message}`;
        Alert.alert('Erro ao Adicionar', errorMessage);
      } else {
        logMessage += `: ${String(error)}`;
        Alert.alert('Erro Inesperado', 'Ocorreu um erro muito incomum.');
      }
      console.error(logMessage, error);
      // Retorna um objeto de erro padronizado para o chamador poder verificar 'success'
      return {success: false, message: errorMessage};
    } finally {
      setIsSubmitting(false); // Finaliza o loading global para adição
    }
  };

  const handleAddNonPizzaDirectly = async (item: Pizza) => {
    if (!user || !user.id) {
      Alert.alert('Login Necessário', 'Você precisa estar logado.');
      return;
    }
    const precoFinal = item.preco;
    if (precoFinal <= 0) {
      Alert.alert(
        'Atenção',
        `O item "${item.nome}" não possui um preço válido.`,
      );
      return;
    }

    let tamanhoParaApi: PizzaTamanho = 'pequena'; // Default
    if (item.tamanhoApi) {
      const tamanhoOriginalLower = item.tamanhoApi.toLowerCase();
      if (['pequena', 'media', 'grande'].includes(tamanhoOriginalLower)) {
        tamanhoParaApi = tamanhoOriginalLower as PizzaTamanho;
      }
      // Se precisar de mapeamentos mais complexos, adicione aqui
      // ex: if (tamanhoOriginalLower.includes('lata')) tamanhoParaApi = 'pequena';
    }

    const itemData: ItemPedidoPayloadAPI = {
      cliente_id: String(user.id),
      produto_id: item.id,
      preco: precoFinal,
      tamanho_selecionado: tamanhoParaApi,
      tipo_tamanho: 'inteira',
      quantidade: 1,
    };
    try {
      await sendItemToApiRegistrarPedido(itemData);
      // O alerta de sucesso/erro já é tratado em sendItemToApiRegistrarPedido
    } catch (error) {
      console.info(
        'Catch em handleAddNonPizzaDirectly (erro já tratado em sendItemToApi).',
      );
    }
  };

  const handleAddItem = (item: Pizza) => {
    if (isSubmitting) return; // Previne múltiplos cliques enquanto uma adição está em progresso
    if (!user || !user.id) {
      Alert.alert('Login Necessário', 'Você precisa estar logado.');
      return;
    }
    if (item.categoria?.toLowerCase() === 'pizza') {
      setCurrentPizzaForOptions(item);
      let defaultTamanho: PizzaTamanho = 'pequena';
      if (item.precoPequena !== null) defaultTamanho = 'pequena';
      else if (item.precoMedia !== null || item.precoMediaInteira !== null)
        defaultTamanho = 'media';
      else if (item.precoGrande !== null || item.precoGrandeInteira !== null)
        defaultTamanho = 'grande';
      setSelectedTamanhoModal(defaultTamanho);
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
    if (calculatedPriceModal <= 0 && selectedTipoModal !== 'meia') {
      Alert.alert('Atenção', 'Preço inválido ou combinação não disponível.');
      return;
    }

    const itemData: ItemPedidoPayloadAPI = {
      cliente_id: String(user.id),
      produto_id: currentPizzaForOptions.id,
      preco: calculatedPriceModal,
      tamanho_selecionado: selectedTamanhoModal,
      tipo_tamanho: selectedTipoModal,
      quantidade: 1,
    };

    try {
      const response = await sendItemToApiRegistrarPedido(itemData);
      if (response.success) {
        // Verifica o success da resposta retornada
        // Alert.alert('Sucesso', `${currentPizzaForOptions.nome} (${selectedTamanhoModal} ${selectedTipoModal}) adicionada ao pedido!`); // Alert já está em sendItemToApi...
        setPizzaOptionsModalVisible(false);
        setCurrentPizzaForOptions(null);
      } else {
        // Alert.alert('Erro ao Adicionar', response.message || `Não foi possível adicionar a pizza.`); // Alert já está em sendItemToApi...
      }
    } catch (error) {
      console.info(
        'Catch em handleConfirmPizzaOptions (erro já tratado e alertado em sendItemToApi).',
      );
    }
  };

  const renderItem = ({item}: {item: Pizza}) => {
    let precoExibicao = 'Preço Indisp.';
    if (item.categoria?.toLowerCase() === 'pizza') {
      if (typeof item.precoPequena === 'number')
        precoExibicao = `A partir de R$ ${(item.precoPequena * 2).toFixed(2)}`;
      else if (typeof item.precoMediaInteira === 'number')
        precoExibicao = `Média R$ ${item.precoMediaInteira.toFixed(2)}`;
      else if (typeof item.precoGrandeInteira === 'number')
        precoExibicao = `Grande R$ ${item.precoGrandeInteira.toFixed(2)}`;
      else if (item.preco > 0) precoExibicao = `R$ ${item.preco.toFixed(2)}`;
    } else {
      if (item.preco > 0) precoExibicao = `R$ ${item.preco.toFixed(2)}`;
    }
    return (
      <TouchableOpacity
        style={styles.itemContainer}
        onPress={() => handleAddItem(item)}
        disabled={isSubmitting}>
        {item.caminho ? (
          <Image source={{uri: item.caminho}} style={styles.itemImageFeed} />
        ) : (
          <View style={[styles.itemImageFeed, styles.placeholderImageFeed]}>
            <Icon
              name={
                item.categoria?.toLowerCase() === 'pizza' ? 'codepen' : 'circle'
              }
              size={40}
              color="#ccc"
            />
          </View>
        )}
        <View style={styles.itemContent}>
          <Text style={styles.itemTitle}>
            {item?.nome || 'Nome Indisponível'}
          </Text>
          <Text style={styles.itemDescription} numberOfLines={2}>
            {item?.ingredientes || item?.detalhes || 'Detalhes indisponíveis'}
          </Text>
          <Text style={styles.itemPrice}>{precoExibicao}</Text>
        </View>
        <View style={styles.addButtonContainer}>
          {isSubmitting ? (
            <ActivityIndicator color="#FFA500" />
          ) : (
            <Icon name="plus-circle" size={30} color="#FFA500" />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderMenuItem = ({item}: {item: Pizza}) => (
    <TouchableOpacity
      style={styles.menuItemOuterContainer}
      onPress={() => handleAddItem(item)}
      disabled={!item || item.id == null || isSubmitting}>
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
            <Icon name="image" size={20} color="#ccc" />
          </View>
        )}
      </View>
      <Text style={styles.menuItemText} numberOfLines={2}>
        {item?.nome || '???'}
      </Text>
    </TouchableOpacity>
  );

  if (loading && produtos.length === 0) {
    // Mostra loading principal apenas se ainda não carregou nada
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFA500" />
        <Text style={{marginTop: 10, fontSize: 16, color: '#555'}}>
          Carregando cardápio...
        </Text>
      </View>
    );
  }

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
            onChangeText={handleSearch}
            placeholderTextColor="#888"
          />
          <TouchableOpacity style={styles.searchIconContainer}>
            <Icon name="search" size={18} color="#fff" />
          </TouchableOpacity>
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
                  {produtos.length
                    ? 'Filtros sem resultado.'
                    : 'Cardápio vazio.'}
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

      <FlatList
        data={filteredItems}
        keyExtractor={(it, idx) => `main-${it?.id ?? idx}`}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyListContainer}>
            <Text style={styles.empty}>
              {!loading && !produtos.length
                ? 'Cardápio indisponível.'
                : 'Nenhum item para os filtros.'}
            </Text>
          </View>
        }
      />

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
                {(currentPizzaForOptions?.precoMedia !== null ||
                  currentPizzaForOptions?.precoMediaInteira !== null) && (
                  <Picker.Item label="Média" value="media" />
                )}
                {(currentPizzaForOptions?.precoGrande !== null ||
                  currentPizzaForOptions?.precoGrandeInteira !== null) && (
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
                }}
                disabled={isSubmitting}>
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.modalButtonConfirm,
                  isSubmitting && styles.buttonDisabled,
                ]}
                onPress={handleConfirmPizzaOptions}
                disabled={isSubmitting}>
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.modalButtonText}>Confirmar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const IMAGE_SIZE = 60;
const BORDER_WIDTH = 2;
const IMAGE_WITH_BORDER_SIZE = IMAGE_SIZE + BORDER_WIDTH * 2;

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#f0f0f0'},
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  pickerContainer: {
    flex: 1.2,
    height: 40,
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    justifyContent: 'center',
    marginRight: 8,
    overflow: 'hidden',
  },
  picker: {height: '100%', width: '100%', color: '#333'},
  pickerItem: {fontSize: 14},
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 20,
    backgroundColor: '#fff',
    paddingLeft: 12,
    paddingRight: 5,
  },
  searchInput: {flex: 1, height: '100%', fontSize: 14, color: '#333'},
  searchIconContainer: {
    backgroundColor: '#FFA500',
    borderRadius: 13,
    width: 26,
    height: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 5,
  },
  menuContainer: {
    width: '100%',
    paddingVertical: 10,
    backgroundColor: '#fff',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    elevation: 1,
  },
  menuList: {
    paddingHorizontal: 5,
    alignItems: 'flex-start',
    minHeight: IMAGE_WITH_BORDER_SIZE + 45,
  },
  menuItemOuterContainer: {
    alignItems: 'center',
    marginHorizontal: 5,
    width: IMAGE_WITH_BORDER_SIZE + 10,
    paddingBottom: 5,
  },
  menuItemImageBackground: {
    width: IMAGE_WITH_BORDER_SIZE,
    height: IMAGE_WITH_BORDER_SIZE,
    borderRadius: IMAGE_WITH_BORDER_SIZE / 2,
    backgroundColor: '#FFA500',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 3,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.15,
    shadowRadius: 1.0,
  },
  menuItemImage: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    borderRadius: IMAGE_SIZE / 2,
    borderWidth: BORDER_WIDTH,
    borderColor: '#fff',
    backgroundColor: '#f5f5f5',
  },
  placeholderImage: {
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuItemText: {
    color: '#444',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 2,
    paddingHorizontal: 1,
    height: 28,
  },
  emptyMenu: {
    paddingHorizontal: 20,
    color: '#aaa',
    textAlign: 'center',
    lineHeight: IMAGE_WITH_BORDER_SIZE + 20,
    width: '100%',
    alignSelf: 'center',
  },
  banner: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 0,
    marginBottom: 10,
  },
  bannerImage: {
    width: '96%',
    height: undefined,
    aspectRatio: 16 / 5,
    resizeMode: 'cover',
    borderRadius: 10,
  },
  list: {width: '100%', paddingHorizontal: 10, paddingBottom: 10},
  itemContainer: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
    marginBottom: 8,
    borderRadius: 10,
    elevation: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemImageFeed: {width: 75, height: 75, borderRadius: 8, marginRight: 12},
  placeholderImageFeed: {
    backgroundColor: '#e9ecef',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemContent: {flex: 1},
  itemTitle: {fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 3},
  itemDescription: {
    fontSize: 13,
    color: '#666',
    marginBottom: 6,
    lineHeight: 18,
  },
  itemPrice: {
    fontSize: 15,
    color: '#00897B',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  addButtonContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 10,
  },
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
  buttonDisabled: {backgroundColor: '#cccccc'}, // Estilo para botão desabilitado no modal
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f4f6f8',
  }, // Estilo para loading inicial
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
    paddingHorizontal: 20,
  },
  empty: {textAlign: 'center', fontSize: 16, color: '#888'},
});
