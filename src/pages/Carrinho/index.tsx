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
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import axios from 'axios';
import {AuthContext} from '../../contexts/AuthContext';
import {useCarrinho, CarrinhoItem} from '../../contexts/CarrinhoContext';
import {useFocusEffect} from '@react-navigation/native';

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

// API URL to fetch the cart
const API_GET_CARRINHO_URL =
  'https://devweb3.ok.etc.br/api/api_get_carrinho.php';

const Carrinho = () => {
  const {user} = useContext(AuthContext);
  const {carrinho, setCarrinho, removerPizza, removerTodasAsPizzasDoTipo} =
    useCarrinho();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [itemLoading, setItemLoading] = useState<{[key: string]: boolean}>({});
  const [deletingAllType, setDeletingAllType] = useState<number | null>(null);
  // --- NEW STATE for heart flash ---
  const [favoritingItemKey, setFavoritingItemKey] = useState<string | null>(
    null,
  );

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
        // console.log('API Raw Data:', JSON.stringify(rawData, null, 2));
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
        response.data.message
      ) {
        console.log('Cart empty (API response):', response.data.message);
        setCarrinho([]);
      } else if (response.data && response.data.error === true) {
        console.error('API Error fetching cart:', response.data.message);
        setError(response.data.message || 'Error returned by API.');
        setCarrinho([]);
      } else {
        console.warn('Unexpected API response:', response.data);
        setCarrinho([]);
        setError('Error in API response format.');
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
    const grupos: Map<string, GrupoCarrinhoItem> = new Map();
    carrinho.forEach(item => {
      const groupKey = `${item.pizza_id}-${item.tipo_pizza}`;
      if (grupos.has(groupKey)) {
        const g = grupos.get(groupKey)!;
        g.quantidade += 1;
        g.precoTotalGrupo += item.preco || 0;
      } else {
        grupos.set(groupKey, {
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

  // --- UPDATED handleFavorite with FLASH ---
  const handleFavorite = async (grupo: GrupoCarrinhoItem) => {
    if (!user?.id) {
      Alert.alert('Error', 'Login required to favorite.');
      return;
    }
    // --- Start Flash ---
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
      // --- End Flash on early return ---
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
      // --- End Flash ---
      // Optional: add a small delay so the flash is visible
      setTimeout(() => {
        setFavoritingItemKey(null);
      }, 300); // 300ms delay example
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

  if (!loading && gruposCarrinho.length === 0) {
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
        data={gruposCarrinho}
        keyExtractor={item => item.key}
        renderItem={({item: grupo}) => {
          // --- Determine if this item's heart is flashing ---
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
                          isFavoriting // Disable during flash
                        }>
                        <Icon
                          name="minus"
                          size={16}
                          color={
                            itemLoading[grupo.key] ||
                            deletingAllType === grupo.pizza_id ||
                            grupo.quantidade <= 1 ||
                            isFavoriting // Dim color during flash
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
                          isFavoriting // Disable during flash
                        }>
                        <Icon
                          name="plus"
                          size={16}
                          color={
                            itemLoading[grupo.key] ||
                            deletingAllType === grupo.pizza_id ||
                            isFavoriting // Dim color during flash
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
                  {/* --- UPDATED HEART ICON AREA --- */}
                  <TouchableOpacity
                    onPress={() => handleFavorite(grupo)}
                    style={styles.iconButton} // Container for the circle
                    disabled={
                      isFavoriting || // Disable while flashing this one
                      itemLoading[grupo.key] ||
                      deletingAllType === grupo.pizza_id
                    }>
                    <View style={styles.heartIconCircle}>
                      <Icon
                        // Use 'heart' (filled) when flashing, 'heart-o' (outline) otherwise
                        name={isFavoriting ? 'heart' : 'heart-o'}
                        size={18} // Adjust size to fit well
                        // Red when flashing, Orange outline otherwise
                        color={isFavoriting ? '#FF0000' : 'black'}
                      />
                    </View>
                  </TouchableOpacity>
                  {/* --- END UPDATED HEART ICON AREA --- */}

                  {/* Trash Icon */}
                  <TouchableOpacity
                    style={styles.trashButtonContainer}
                    onPress={() =>
                      handleDeleteAllOfType(grupo.pizza_id, grupo.nome_pizza)
                    }
                    disabled={
                      deletingAllType === grupo.pizza_id ||
                      itemLoading[grupo.key] ||
                      isFavoriting // Disable trash during favorite flash
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
                {/* End Icons Column */}
              </View>
              {/* End Content Area Row */}
            </View>
          );
          // --- End List Item ---
        }}
        ListFooterComponent={() => <View style={{height: 110}} />} // Space at the bottom
      />

      {/* Fixed Footer */}
      <View style={styles.footer}>
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total:</Text>
          <Text style={styles.totalValue}>R$ {total.toFixed(2)}</Text>
        </View>
        <TouchableOpacity
          style={styles.checkoutButton}
          onPress={() =>
            Alert.alert(
              'Finalizar Pedido',
              'Funcionalidade ainda não implementada.',
            )
          }>
          <Text style={styles.checkoutButtonText}>Finalizar Pedido</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// --- Styles ---
const IMAGE_SIZE = 55;
const IMAGE_BORDER_SPACE = 10; // Space around image inside border
const BORDER_THICKNESS = 2;
const IMAGE_CONTAINER_SIZE = IMAGE_SIZE + IMAGE_BORDER_SPACE * 2; // Outer container size
const TRASH_CIRCLE_SIZE = 32;
const TRASH_BORDER_WIDTH = 1;
const ICON_COLUMN_WIDTH = 40; // Width for the rightmost icons column
const HEART_CIRCLE_SIZE = 32; // Size for the heart's circle
const HEART_BORDER_THICKNESS = 2; // Border for the heart's circle

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
  // --- Item Row Container ---
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
    flexDirection: 'row', // Image | contentAreaRow
    paddingVertical: 12,
    paddingLeft: 12,
    paddingRight: 10, // Reduced right padding
    alignItems: 'flex-start', // Align image and content area to top
  },
  // --- Image Styles ---
  imageBorderContainer: {
    width: IMAGE_CONTAINER_SIZE,
    height: IMAGE_CONTAINER_SIZE,
    borderRadius: IMAGE_CONTAINER_SIZE / 2,
    borderWidth: BORDER_THICKNESS,
    borderColor: '#FFA500', // Orange
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFEACE', // Light orange background
    marginRight: 12, // Space after image before content area
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

  // --- Content Area (Row: Info | Icons) ---
  contentAreaRow: {
    flex: 1, // Take remaining space
    flexDirection: 'row', // Info Column | Icons Column
    justifyContent: 'space-between', // Pushes Icons column to the right
  },

  // --- Info Column (Name/Price + Quantity Group) ---
  infoColumn: {
    flexDirection: 'column', // Arrange vertically
    flexShrink: 1, // Allow this column to shrink if needed
    paddingRight: 8, // Space before the icons column
    justifyContent: 'space-between', // Distribute space between name/price and quantity
    minHeight: IMAGE_CONTAINER_SIZE - BORDER_THICKNESS * 2, // Match image height approx
  },
  namePriceContainer: {
    // Contains Name and Price
    // No specific styles needed here now
  },
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
    // Container for the +/- group
    marginTop: 8, // Add space above quantity if needed
  },
  quantityGroupBackground: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEACE', // Light orange background
    borderRadius: 18,
    paddingHorizontal: 5,
    height: 36,
    alignSelf: 'flex-start', // Make group only as wide as needed
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

  // --- Icons Column (Heart + Trash) ---
  iconsColumn: {
    flexDirection: 'column',
    justifyContent: 'space-between', // Space out Heart and Trash vertically
    alignItems: 'center', // Center icons horizontally in this column
    width: ICON_COLUMN_WIDTH, // Fixed width for alignment
  },
  // --- UPDATED Heart Icon Styles ---
  iconButton: {
    // Container for the heart circle touchable
    // Layout handled by iconsColumn
    marginBottom: 4, // Add space between heart and trash
  },
  heartIconCircle: {
    // The orange circle itself
    width: HEART_CIRCLE_SIZE,
    height: HEART_CIRCLE_SIZE,
    borderRadius: HEART_CIRCLE_SIZE / 2,
    borderWidth: HEART_BORDER_THICKNESS,
    borderColor: '#FFA500', // Orange border
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFA500', // White background inside circle
  },
  // --- Trash Icon Styles ---
  trashButtonContainer: {
    // Container for the trash circle touchable
    // Layout handled by iconsColumn
    marginTop: 4, // Add space between heart and trash
  },
  trashIconCircle: {
    width: TRASH_CIRCLE_SIZE,
    height: TRASH_CIRCLE_SIZE,
    borderRadius: TRASH_CIRCLE_SIZE / 2,
    backgroundColor: '#FFEACE',
    borderWidth: TRASH_BORDER_WIDTH,
    borderColor: '#FFA500',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // --- Centered States ---
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
  // --- Footer ---
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
  },
  checkoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default Carrinho;
