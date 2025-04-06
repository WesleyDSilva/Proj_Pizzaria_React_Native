import React, {useState, useContext, useCallback, useMemo} from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Image,
  Platform,
  Modal, // <-- Imported Modal
  TextInput, // <-- Imported TextInput
  KeyboardAvoidingView, // <-- Imported KeyboardAvoidingView
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import axios from 'axios';
import {AuthContext} from '../../contexts/AuthContext';
import {useCarrinho, CarrinhoItem} from '../../contexts/CarrinhoContext';
import {useFocusEffect} from '@react-navigation/native';

// *** ADDED INTERFACE DEFINITION BACK ***
// Interface for grouped items in the FlatList
interface GrupoCarrinhoItem {
  key: string;
  pizza_id: number;
  nome_pizza: string;
  tipo_pizza: string;
  precoUnitario: number;
  quantidade: number;
  precoTotalGrupo: number;
  primeiroItemId: number;
  caminho_imagem?: string;
}
// *** END ADDED INTERFACE DEFINITION ***

// API URL to fetch the cart
const API_GET_CARRINHO_URL =
  'https://devweb3.ok.etc.br/api/api_get_carrinho.php';

// --- Define the correct URL for the create order PHP script ---
const API_CRIAR_PEDIDO_URL =
  'https://devweb3.ok.etc.br/api/api_criar_pedido.php'; // <-- Confirm this is correct

const Carrinho = () => {
  const {user} = useContext(AuthContext);
  // Assuming limparCarrinho exists in your context
  const {
    carrinho,
    setCarrinho,
    removerPizza,
    removerTodasAsPizzasDoTipo,
    limparCarrinho,
  } = useCarrinho();
  // const navigation = useNavigation(); // <-- Initialize navigation hook if needed to navigate away

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [itemLoading, setItemLoading] = useState<{[key: string]: boolean}>({});
  const [deletingAllType, setDeletingAllType] = useState<number | null>(null);
  const [favoritingItemKey, setFavoritingItemKey] = useState<string | null>(
    null,
  );
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [observacao, setObservacao] = useState('');
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // --- Fetch Cart Data ---
  const fetchCarrinho = useCallback(async () => {
    if (!user?.id) {
      console.log('Fetch cancelled: user not logged in.');
      setCarrinho([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(
        `${API_GET_CARRINHO_URL}?cliente_id=${user.id}`,
      );

      if (Array.isArray(response.data)) {
        const rawData: any[] = response.data;
        const carrinhoData: CarrinhoItem[] = rawData.map((item: any) => ({
          id: Number(item.carrinho_id),
          pizza_id: Number(item.pizza_id),
          preco: parseFloat(item.preco) || 0,
          nome_pizza: item.nome_pizza || 'Pizza Desconhecida',
          tipo_pizza: item.tipo_pizza || 'N/A',
          cliente_id: user.id ? Number(user.id) : undefined,
          caminho_imagem: item.caminho_imagem || undefined,
        }));
        setCarrinho(carrinhoData);
      } else if (
        response.data &&
        response.data.error === false &&
        response.data.message ===
          'Nenhum item encontrado no carrinho para este cliente.' // Specific check for the PHP message
      ) {
        console.log('Cart empty (API response):', response.data.message);
        setCarrinho([]); // Ensure cart is empty locally
      } else if (
        response.data &&
        response.data.error === false &&
        response.data.message
      ) {
        // General empty message check
        console.log('Cart empty (API response):', response.data.message);
        setCarrinho([]);
      } else if (response.data && response.data.error === true) {
        console.error('API Error fetching cart:', response.data.message);
        setError(response.data.message || 'Error returned by API.');
        setCarrinho([]);
      } else {
        // Handle case where response.data might be null, empty object, or other unexpected format indicating empty
        if (
          response.data === null ||
          (typeof response.data === 'object' &&
            Object.keys(response.data).length === 0) ||
          response.data === ''
        ) {
          console.log('Cart is empty (received empty or null response).');
          setCarrinho([]);
        } else {
          console.warn('Unexpected API response format:', response.data);
          setError('Error in API response format.');
          setCarrinho([]);
        }
      }
    } catch (err: any) {
      console.error('Error fetching cart (axios/network):', err);
      const errorMessage =
        err.response?.data?.message || err.message || 'Could not load cart.';
      setError(errorMessage);
      setCarrinho([]);
    } finally {
      setLoading(false);
    }
  }, [user, setCarrinho]);

  // Fetch cart when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchCarrinho();
    }, [fetchCarrinho]),
  );

  // --- Group Cart Items ---
  const gruposCarrinho = useMemo(() => {
    const grupos: Map<string, GrupoCarrinhoItem> = new Map(); // Use the interface here
    carrinho.forEach(item => {
      const groupKey = `${item.pizza_id}-${item.tipo_pizza}`;
      if (grupos.has(groupKey)) {
        const g = grupos.get(groupKey)!;
        g.quantidade += 1;
        g.precoTotalGrupo += item.preco || 0;
      } else {
        grupos.set(groupKey, {
          // Ensure properties match GrupoCarrinhoItem
          key: groupKey,
          pizza_id: item.pizza_id,
          nome_pizza: item.nome_pizza || 'Pizza',
          tipo_pizza: item.tipo_pizza || 'N/A',
          precoUnitario: item.preco || 0,
          quantidade: 1,
          precoTotalGrupo: item.preco || 0,
          primeiroItemId: item.id,
          caminho_imagem: item.caminho_imagem,
        });
      }
    });
    return Array.from(grupos.values());
  }, [carrinho]);

  // --- Calculate Total ---
  const total = useMemo(
    () => gruposCarrinho.reduce((acc, g) => acc + g.precoTotalGrupo, 0),
    [gruposCarrinho],
  );

  // --- Item Interaction Handlers ---
  const handleIncrementItem = async (grupo: GrupoCarrinhoItem) => {
    // Use the interface here
    if (!user?.id) {
      Alert.alert('Error', 'Login required to modify cart.');
      return;
    }
    setItemLoading(prev => ({...prev, [grupo.key]: true}));
    try {
      const res = await axios.post(
        'https://devweb3.ok.etc.br/api/api_registrar_carrinho.php',
        {
          cliente_id: Number(user.id),
          pizza_id: grupo.pizza_id,
          preco: grupo.precoUnitario,
          nome_pizza: grupo.nome_pizza,
          tipo_pizza: grupo.tipo_pizza,
        },
      );
      if (res.data.success || res.status === 200 || res.status === 201) {
        await fetchCarrinho();
      } else {
        Alert.alert(
          'Error Adding',
          res.data.message || 'Could not add item to cart.',
        );
      }
    } catch (err: any) {
      console.error('Error incrementing item:', err);
      Alert.alert(
        'Network Error',
        err.response?.data?.message || 'Could not add item.',
      );
    } finally {
      setItemLoading(prev => ({...prev, [grupo.key]: false}));
    }
  };

  const handleDecrementItem = async (grupo: GrupoCarrinhoItem) => {
    // Use the interface here
    if (!user?.id) {
      Alert.alert('Error', 'Login required to modify cart.');
      return;
    }
    if (grupo.quantidade <= 0) return;

    const itemParaRemover = carrinho.find(
      i => i.pizza_id === grupo.pizza_id && i.tipo_pizza === grupo.tipo_pizza,
    );

    if (!itemParaRemover) {
      console.error(
        `Error: Could not find cart item for group ${grupo.key} to remove.`,
      );
      Alert.alert('Internal Error', 'Could not identify item to remove.');
      return;
    }
    const idParaRemover = itemParaRemover.id;

    setItemLoading(prev => ({...prev, [grupo.key]: true}));
    try {
      const url = `https://devweb3.ok.etc.br/api/api_delete_carrinho_item.php?id=${idParaRemover}`;
      const res = await axios.get(url);

      if (res.data.success || res.status === 200) {
        await fetchCarrinho();
      } else {
        console.error('API error removing item:', res.data);
        Alert.alert(
          'Error Removing',
          res.data.message || 'Could not remove item from cart.',
        );
      }
    } catch (err: any) {
      console.error('Network/axios error decrementing item:', err);
      Alert.alert(
        'Network Error',
        err.response?.data?.message || 'Could not remove item.',
      );
    } finally {
      setItemLoading(prev => ({...prev, [grupo.key]: false}));
    }
  };

  const handleDeleteAllOfType = async (
    pizza_id: number,
    nome_pizza: string,
  ) => {
    if (!user?.id) {
      Alert.alert('Error', 'Login required to modify cart.');
      return;
    }
    Alert.alert(
      'Remove All?',
      `Are you sure you want to remove all "${nome_pizza}" pizzas from the cart?`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setDeletingAllType(pizza_id);
            try {
              const url = `https://devweb3.ok.etc.br/api/api_delete_carrinho.php?pizza_id=${pizza_id}&cliente_id=${Number(
                user.id,
              )}`;
              const res = await axios.get(url);

              if (res.data.success || res.status === 200) {
                await fetchCarrinho();
                console.log(
                  `All "${nome_pizza}" pizzas (ID: ${pizza_id}) removed.`,
                );
              } else {
                Alert.alert(
                  'Error Removing',
                  res.data.message || 'Could not remove items from cart.',
                );
              }
            } catch (err: any) {
              console.error(
                `Error removing all pizzas of type ${pizza_id}:`,
                err,
              );
              Alert.alert(
                'Network Error',
                err.response?.data?.message || 'Could not remove items.',
              );
            } finally {
              setDeletingAllType(null);
            }
          },
        },
      ],
      {cancelable: true},
    );
  };

  const handleFavorite = async (grupo: GrupoCarrinhoItem) => {
    // Use the interface here
    if (!user?.id) {
      Alert.alert('Error', 'Login required to favorite.');
      return;
    }
    setFavoritingItemKey(grupo.key);

    const payload = {
      pizzas: [
        {
          cliente_id: Number(user.id),
          pizza_id: grupo.pizza_id,
          nome_pizza: grupo.nome_pizza,
          preco: grupo.precoUnitario,
        },
      ],
    };

    if (
      !payload.pizzas[0].cliente_id ||
      !payload.pizzas[0].pizza_id ||
      !payload.pizzas[0].nome_pizza ||
      payload.pizzas[0].preco === undefined
    ) {
      Alert.alert('Internal Error', 'Incomplete data to favorite.');
      setFavoritingItemKey(null);
      return;
    }

    try {
      const res = await axios.post(
        'https://devweb3.ok.etc.br/api/api_pedido_favorito.php',
        payload,
      );

      if (res.data.success) {
        Alert.alert(
          'Favorited!',
          `"${grupo.nome_pizza}" added to your favorites.`,
        );
      } else {
        Alert.alert(
          'Error Favoriting',
          res.data.message || 'Could not favorite pizza.',
        );
      }
    } catch (err: any) {
      console.error('Error favoriting:', err);
      Alert.alert(
        'Network Error',
        err.response?.data?.message || 'Could not favorite pizza.',
      );
    } finally {
      setTimeout(() => {
        setFavoritingItemKey(null);
      }, 300);
    }
  };

  // --- Checkout Function ---
  const proceedToCheckout = async (obs: string) => {
    if (!user?.id) {
      Alert.alert('Erro', 'Usuário não identificado para finalizar o pedido.');
      setIsModalVisible(false);
      return;
    }
    if (carrinho.length === 0) {
      Alert.alert(
        'Carrinho Vazio',
        'Adicione itens ao carrinho antes de finalizar.',
      );
      setIsModalVisible(false);
      return;
    }

    setIsCheckingOut(true);
    setIsModalVisible(false);

    try {
      const response = await axios.post(API_CRIAR_PEDIDO_URL, {
        // Use correct API URL
        cliente_id: user.id,
        observacao: obs.trim(), // Trim whitespace from observation
      });

      if (response.data && response.data.success) {
        Alert.alert(
          'Pedido Finalizado',
          `Seu pedido (${
            response.data.n_pedido || ''
          }) foi enviado com sucesso!`,
        );
        // Clear local cart state
        if (limparCarrinho) {
          limparCarrinho();
        } else {
          setCarrinho([]);
        }
        setObservacao('');
        // Optional: Navigate
        // navigation.navigate('OrderConfirmation', { orderId: response.data.n_pedido });
      } else {
        Alert.alert(
          'Erro ao Finalizar',
          response.data.message || 'Não foi possível registrar o pedido.',
        );
      }
    } catch (checkoutError: any) {
      console.error('Checkout failed:', checkoutError);
      Alert.alert(
        'Erro de Rede',
        checkoutError.response?.data?.message ||
          'Não foi possível conectar ao servidor para finalizar o pedido.',
      );
    } finally {
      setIsCheckingOut(false);
    }
  };

  // --- Render Logic ---
  if (loading && carrinho.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#FFA500" />
        <Text style={styles.loadingText}>Loading cart...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Icon
          name="exclamation-triangle"
          size={40}
          color="#D32F2F"
          style={styles.iconError}
        />
        <Text style={styles.error}>{error}</Text>
        <TouchableOpacity onPress={fetchCarrinho} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!loading && gruposCarrinho.length === 0 && !isCheckingOut) {
    return (
      <View style={styles.centered}>
        <Icon
          name="shopping-cart"
          size={50}
          color="#adb5bd"
          style={styles.iconEmpty}
        />
        <Text style={styles.message}>Your cart is empty.</Text>
        <Text style={styles.messageSub}>Add some pizzas to see them here!</Text>
      </View>
    );
  }

  // --- Main Render ---
  return (
    <View style={styles.container}>
      <Text style={styles.title}>MY CART</Text>
      <FlatList
        data={gruposCarrinho} // Use the grouped data
        keyExtractor={item => item.key}
        renderItem={({item: grupo}: {item: GrupoCarrinhoItem}) => {
          // Explicitly type item here
          const isFavoriting = favoritingItemKey === grupo.key;

          return (
            <View style={styles.itemContainer}>
              {/* Left Part: Image */}
              <View style={styles.imageBorderContainer}>
                {grupo.caminho_imagem ? (
                  <Image
                    source={{uri: grupo.caminho_imagem}}
                    style={styles.pizzaImage}
                    resizeMode="cover"
                    onError={e =>
                      console.warn(
                        `Error loading image ${grupo.caminho_imagem}:`,
                        e.nativeEvent.error,
                      )
                    }
                  />
                ) : (
                  <View style={styles.pizzaImagePlaceholderContent}>
                    <Icon name="camera" size={20} color="#ced4da" />
                  </View>
                )}
              </View>

              {/* Right Part: Content Area (Row) */}
              <View style={styles.contentAreaRow}>
                {/* Info Column (Name/Price + Quantity Group) */}
                <View style={styles.infoColumn}>
                  {/* Name and Price */}
                  <View style={styles.namePriceContainer}>
                    <Text
                      style={styles.itemTextName}
                      numberOfLines={1}
                      ellipsizeMode="tail">
                      {grupo.nome_pizza}
                      {grupo.tipo_pizza !== 'N/A'
                        ? ` - ${grupo.tipo_pizza}`
                        : ''}
                    </Text>
                    <Text style={styles.itemTextPrice}>
                      R$ {grupo.precoUnitario.toFixed(2)}
                    </Text>
                  </View>
                  {/* Quantity Group (+/-) */}
                  <View style={styles.quantityGroupContainer}>
                    <View style={styles.quantityGroupBackground}>
                      <TouchableOpacity
                        style={styles.quantityCtrlButton}
                        onPress={() => handleDecrementItem(grupo)}
                        disabled={
                          itemLoading[grupo.key] ||
                          deletingAllType === grupo.pizza_id ||
                          grupo.quantidade <= 1 ||
                          isFavoriting
                        }>
                        <Icon
                          name="minus"
                          size={16}
                          color={
                            itemLoading[grupo.key] ||
                            deletingAllType === grupo.pizza_id ||
                            grupo.quantidade <= 1 ||
                            isFavoriting
                              ? '#adb5bd'
                              : '#D32F2F'
                          }
                        />
                      </TouchableOpacity>
                      <View style={styles.quantityTextContainer}>
                        {itemLoading[grupo.key] &&
                        !deletingAllType &&
                        !isFavoriting ? (
                          <ActivityIndicator size="small" color="#5D4037" />
                        ) : (
                          <Text style={styles.quantityText}>
                            {grupo.quantidade}
                          </Text>
                        )}
                      </View>
                      <TouchableOpacity
                        style={styles.quantityCtrlButton}
                        onPress={() => handleIncrementItem(grupo)}
                        disabled={
                          itemLoading[grupo.key] ||
                          deletingAllType === grupo.pizza_id ||
                          isFavoriting
                        }>
                        <Icon
                          name="plus"
                          size={16}
                          color={
                            itemLoading[grupo.key] ||
                            deletingAllType === grupo.pizza_id ||
                            isFavoriting
                              ? '#adb5bd'
                              : '#388E3C'
                          }
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                {/* Icons Column (Heart + Trash) */}
                <View style={styles.iconsColumn}>
                  <TouchableOpacity
                    onPress={() => handleFavorite(grupo)}
                    style={styles.iconButton}
                    disabled={
                      isFavoriting ||
                      itemLoading[grupo.key] ||
                      deletingAllType === grupo.pizza_id
                    }>
                    <View style={styles.heartIconCircle}>
                      <Icon
                        name={isFavoriting ? 'heart' : 'heart-o'}
                        size={18}
                        color={isFavoriting ? '#FF0000' : 'black'}
                      />
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.trashButtonContainer}
                    onPress={() =>
                      handleDeleteAllOfType(grupo.pizza_id, grupo.nome_pizza)
                    }
                    disabled={
                      deletingAllType === grupo.pizza_id ||
                      itemLoading[grupo.key] ||
                      isFavoriting
                    }>
                    <View style={styles.trashIconCircle}>
                      {deletingAllType === grupo.pizza_id ? (
                        <ActivityIndicator size="small" color="#515151" />
                      ) : (
                        <Icon name="trash" size={16} color="#495057" />
                      )}
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        }}
        ListFooterComponent={() => <View style={{height: 110}} />}
      />

      {/* Fixed Footer */}
      <View style={styles.footer}>
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total:</Text>
          <Text style={styles.totalValue}>R$ {total.toFixed(2)}</Text>
        </View>
        <TouchableOpacity
          style={[
            styles.checkoutButton,
            isCheckingOut && styles.checkoutButtonDisabled,
          ]}
          onPress={() => setIsModalVisible(true)}
          disabled={isCheckingOut || carrinho.length === 0}>
          {isCheckingOut ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.checkoutButtonText}>Finalizar Pedido</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Observation Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => {
          if (!isCheckingOut) {
            setIsModalVisible(false);
            setObservacao('');
          }
        }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Observações</Text>
            <Text style={styles.modalSubTitle}>
              Deseja adicionar alguma observação ao pedido?
            </Text>
            <TextInput
              style={styles.textInput}
              placeholder="Ex: Tirar a cebola, ponto da carne..."
              placeholderTextColor="#999"
              multiline={true}
              numberOfLines={4}
              value={observacao}
              onChangeText={setObservacao}
              textAlignVertical="top"
            />
            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setIsModalVisible(false);
                  setObservacao('');
                }}
                disabled={isCheckingOut}>
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.confirmButton,
                  isCheckingOut && styles.checkoutButtonDisabled,
                ]}
                onPress={() => proceedToCheckout(observacao)}
                disabled={isCheckingOut}>
                {isCheckingOut ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.confirmButtonText}>
                    {observacao.trim()
                      ? 'Salvar e Finalizar'
                      : 'Finalizar sem Obs.'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

// --- Styles ---
const IMAGE_SIZE = 55;
const IMAGE_BORDER_SPACE = 10;
const BORDER_THICKNESS = 2;
const IMAGE_CONTAINER_SIZE = IMAGE_SIZE + IMAGE_BORDER_SPACE * 2;
const TRASH_CIRCLE_SIZE = 32;
const TRASH_BORDER_WIDTH = 1;
const ICON_COLUMN_WIDTH = 40;
const HEART_CIRCLE_SIZE = 32;
const HEART_BORDER_THICKNESS = 2;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: Platform.OS === 'ios' ? 50 : 30,
    marginBottom: 15,
    color: '#343a40',
    textAlign: 'center',
  },
  itemContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginVertical: 7,
    marginHorizontal: 14,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.15,
    shadowRadius: 5,
    flexDirection: 'row',
    paddingVertical: 12,
    paddingLeft: 12,
    paddingRight: 10,
    alignItems: 'flex-start',
  },
  imageBorderContainer: {
    width: IMAGE_CONTAINER_SIZE,
    height: IMAGE_CONTAINER_SIZE,
    borderRadius: IMAGE_CONTAINER_SIZE / 2,
    borderWidth: BORDER_THICKNESS,
    borderColor: '#FFA500',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFEACE',
    marginRight: 12,
  },
  pizzaImage: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    borderRadius: IMAGE_SIZE / 2,
  },
  pizzaImagePlaceholderContent: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    borderRadius: IMAGE_SIZE / 2,
    backgroundColor: '#e9ecef',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentAreaRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoColumn: {
    flexDirection: 'column',
    flexShrink: 1,
    paddingRight: 8,
    justifyContent: 'space-between',
    minHeight: IMAGE_CONTAINER_SIZE - BORDER_THICKNESS * 2,
  },
  namePriceContainer: {},
  itemTextName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 3,
  },
  itemTextPrice: {
    fontSize: 14,
    color: '#e63946',
    fontWeight: '700',
  },
  quantityGroupContainer: {
    marginTop: 8,
  },
  quantityGroupBackground: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEACE',
    borderRadius: 18,
    paddingHorizontal: 5,
    height: 36,
    alignSelf: 'flex-start',
  },
  quantityCtrlButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  quantityTextContainer: {
    minWidth: 28,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  quantityText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#343a40',
    textAlign: 'center',
  },
  iconsColumn: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: ICON_COLUMN_WIDTH,
  },
  iconButton: {
    marginBottom: 4,
  },
  heartIconCircle: {
    width: HEART_CIRCLE_SIZE,
    height: HEART_CIRCLE_SIZE,
    borderRadius: HEART_CIRCLE_SIZE / 2,
    borderWidth: HEART_BORDER_THICKNESS,
    borderColor: '#FFA500',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  trashButtonContainer: {
    marginTop: 4,
  },
  trashIconCircle: {
    width: TRASH_CIRCLE_SIZE,
    height: TRASH_CIRCLE_SIZE,
    borderRadius: TRASH_CIRCLE_SIZE / 2,
    backgroundColor: '#e9ecef',
    borderWidth: TRASH_BORDER_WIDTH,
    borderColor: '#dee2e6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6c757d',
  },
  iconError: {
    marginBottom: 15,
  },
  error: {
    color: '#D32F2F',
    fontSize: 17,
    textAlign: 'center',
    marginBottom: 20,
  },
  iconEmpty: {
    marginBottom: 15,
  },
  message: {
    fontSize: 19,
    color: '#6c757d',
    textAlign: 'center',
    fontWeight: '500',
  },
  messageSub: {
    fontSize: 15,
    color: '#adb5bd',
    textAlign: 'center',
    marginTop: 8,
  },
  retryButton: {
    backgroundColor: '#007bff',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    elevation: 2,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#dee2e6',
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingBottom: Platform.OS === 'ios' ? 30 : 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -3},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  totalContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  totalLabel: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 2,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212529',
  },
  checkoutButton: {
    backgroundColor: '#28a745',
    paddingVertical: 14,
    paddingHorizontal: 35,
    borderRadius: 30,
    elevation: 3,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkoutButtonDisabled: {
    backgroundColor: '#94d3a2',
  },
  checkoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // --- MODAL STYLES ---
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  modalSubTitle: {
    fontSize: 15,
    color: '#555',
    textAlign: 'center',
    marginBottom: 20,
  },
  textInput: {
    width: '100%',
    height: 100,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingTop: 10,
    paddingBottom: 10,
    paddingHorizontal: 15,
    marginBottom: 25,
    fontSize: 15,
    textAlignVertical: 'top',
    backgroundColor: '#f8f8f8',
  },
  modalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 20,
    elevation: 2,
    flex: 1,
    marginHorizontal: 8,
    minWidth: 100,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  cancelButtonText: {
    color: '#495057',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 15,
  },
  confirmButton: {
    backgroundColor: '#28a745',
  },
  confirmButtonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 15,
  },
});

export default Carrinho;
