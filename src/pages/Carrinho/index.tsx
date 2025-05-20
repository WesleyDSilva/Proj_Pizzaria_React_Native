// Arquivo: src/pages/Carrinho/index.tsx

import React, {
  useState,
  useContext,
  useCallback,
  useMemo,
  Dispatch, // Importado para tipagem correta de setCarrinho
  SetStateAction, // Importado para tipagem correta de setCarrinho
} from 'react';
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
  Modal,
  TextInput,
  KeyboardAvoidingView,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import axios from 'axios'; // Import do Axios
import {AuthContext} from '../../contexts/AuthContext';
// Importa CarrinhoItem do contexto. ELA DEVE ESTAR ATUALIZADA NO ARQUIVO DO CONTEXTO!
import {useCarrinho, CarrinhoItem} from '../../contexts/CarrinhoContext';
import {useFocusEffect} from '@react-navigation/native';
// import { useNavigation } from '@react-navigation/native'; // Descomente se precisar de navegação

// Interface para os itens como vêm da API PHP (api_get_carrinho.php)
interface ItemDaApi {
  id_item_pedido: number;
  cliente_id?: number;
  produto_id: number;
  tamanho_pedido: string | null;
  tipo_tamanho_pedido: string | null;
  total_item_pedido: number;
  nome_produto: string;
  caminho_imagem_produto?: string;
  status_item_pedido: string;
}

// Interface para itens agrupados na FlatList
interface GrupoCarrinhoItem {
  key: string;
  produto_id: number;
  nome_produto: string;
  tipo_tamanho: string;
  tamanho: string;
  precoUnitario: number;
  quantidade: number;
  precoTotalGrupo: number;
  primeiroItemIdNoPedido: number;
  caminho_imagem?: string;
  status_item: string;
}

// --- URLs DAS APIs ---
const API_GET_CARRINHO_URL =
  'https://devweb3.ok.etc.br/api_mobile/api_get_carrinho.php';
const API_REGISTRAR_ITEM_PEDIDO_URL =
  'https://devweb3.ok.etc.br/api_mobile/api_registrar_item_pedido.php';
const API_DELETAR_ITEM_PEDIDO_URL =
  'https://devweb3.ok.etc.br/api/api_delete_carrinho_item.php';
const API_DELETAR_ITENS_POR_PRODUTO_URL =
  'https://devweb3.ok.etc.br/api/api_delete_carrinho.php';
const API_CRIAR_PEDIDO_URL =
  'https://devweb3.ok.etc.br/api/api_criar_pedido.php';
const API_PEDIDO_FAVORITO_URL =
  'https://devweb3.ok.etc.br/api/api_pedido_favorito.php';

const CarrinhoScreen = () => {
  const {user} = useContext(AuthContext);
  const {carrinho, setCarrinho, limparCarrinho} = useCarrinho();
  // const navigation = useNavigation();

  // Estados que estavam faltando devido à ausência de imports
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [itemLoading, setItemLoading] = useState<{[key: string]: boolean}>({});
  const [deletingAllType, setDeletingAllType] = useState<number | null>(null);
  const [favoritingItemKey, setFavoritingItemKey] = useState<string | null>(
    null,
  );
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [observacao, setObservacao] = useState('');
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const fetchCarrinhoData = useCallback(async () => {
    if (!user?.id) {
      setCarrinho([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get<ItemDaApi[]>(
        `${API_GET_CARRINHO_URL}?cliente_id=${user.id}`,
      );

      if (Array.isArray(response.data)) {
        const rawDataFromApi: ItemDaApi[] = response.data;
        const carrinhoDataParaContexto: CarrinhoItem[] = rawDataFromApi.map(
          (apiItem): CarrinhoItem => ({
            id: apiItem.id_item_pedido,
            produto_id: apiItem.produto_id,
            preco: apiItem.total_item_pedido || 0,
            nome_produto: apiItem.nome_produto || 'Item Desconhecido',
            tipo_tamanho: apiItem.tipo_tamanho_pedido,
            tamanho: apiItem.tamanho_pedido,
            caminho_imagem: apiItem.caminho_imagem_produto || undefined,
            status_pedido: apiItem.status_item_pedido || 'PENDENTE',
          }),
        );
        setCarrinho(carrinhoDataParaContexto);
      } else if (
        response.data &&
        ((response.data as any).message ===
          'Nenhum item encontrado no carrinho para este cliente.' ||
          (typeof response.data === 'object' &&
            Object.keys(response.data).length === 0) ||
          response.data === null ||
          response.data === '')
      ) {
        setCarrinho([]);
      } else if ((response.data as any)?.error === true) {
        setError((response.data as any).message || 'Erro da API.');
        setCarrinho([]);
      } else {
        setError('Formato de resposta inesperado.');
        setCarrinho([]);
      }
    } catch (err: any) {
      let errorMessage = 'Falha ao carregar itens.';
      if (
        err.message &&
        err.message.includes('Text strings must be rendered')
      ) {
        errorMessage = 'Erro de renderização. Verifique o console.';
      } else if (err.response) {
        errorMessage = String(
          err.response.data?.message ||
            err.response.statusText ||
            'Erro do servidor.',
        );
      } else if (err.request) {
        errorMessage = 'Sem resposta do servidor.';
      } else {
        errorMessage = String(err.message || 'Erro desconhecido.');
      }
      setError(errorMessage);
      setCarrinho([]);
    } finally {
      setLoading(false);
    }
  }, [user, setCarrinho]);

  useFocusEffect(
    useCallback(() => {
      fetchCarrinhoData();
    }, [fetchCarrinhoData]),
  );

  const gruposCarrinho = useMemo((): GrupoCarrinhoItem[] => {
    const grupos: Map<string, GrupoCarrinhoItem> = new Map();
    if (!Array.isArray(carrinho)) return [];
    carrinho.forEach((item: CarrinhoItem) => {
      const tipoKey = item.tipo_tamanho || 'N/A';
      const tamanhoKey = item.tamanho || 'N/A';
      const groupKey = `${item.produto_id}-${tipoKey}-${tamanhoKey}`;

      if (grupos.has(groupKey)) {
        const g = grupos.get(groupKey)!;
        g.quantidade += 1;
        g.precoTotalGrupo += item.preco || 0;
      } else {
        grupos.set(groupKey, {
          key: groupKey,
          produto_id: item.produto_id,
          nome_produto: item.nome_produto,
          tipo_tamanho: tipoKey,
          tamanho: tamanhoKey,
          precoUnitario: item.preco || 0,
          quantidade: 1,
          precoTotalGrupo: item.preco || 0,
          primeiroItemIdNoPedido: item.id,
          caminho_imagem: item.caminho_imagem,
          status_item: item.status_pedido || 'PENDENTE',
        });
      }
    });
    return Array.from(grupos.values());
  }, [carrinho]);

  const total = useMemo(
    () => gruposCarrinho.reduce((acc, grupo) => acc + grupo.precoTotalGrupo, 0),
    [gruposCarrinho],
  );

  const handleIncrementItem = async (grupo: GrupoCarrinhoItem) => {
    if (!user?.id) {
      Alert.alert('Erro', 'Login necessário.');
      return;
    }
    setItemLoading(prev => ({...prev, [grupo.key]: true}));
    try {
      const payload = {
        cliente_id: Number(user.id),
        pizza_id: grupo.produto_id,
        preco: grupo.precoUnitario,
        tamanho_selecionado:
          grupo.tamanho === 'N/A' ? 'pequena' : grupo.tamanho,
        tipo_pizza:
          grupo.tipo_tamanho === 'N/A' ? 'inteira' : grupo.tipo_tamanho,
      };
      const res = await axios.post(API_REGISTRAR_ITEM_PEDIDO_URL, payload);
      if (res.data.success) {
        await fetchCarrinhoData();
      } else {
        Alert.alert(
          'Erro ao Adicionar',
          res.data.message || 'Não foi possível adicionar.',
        );
      }
    } catch (err: any) {
      Alert.alert(
        'Erro de Rede',
        err.response?.data?.message || 'Não foi possível adicionar.',
      );
    } finally {
      setItemLoading(prev => ({...prev, [grupo.key]: false}));
    }
  };

  const handleDecrementItem = async (grupo: GrupoCarrinhoItem) => {
    if (!user?.id) {
      Alert.alert('Erro', 'Login necessário.');
      return;
    }
    if (grupo.quantidade <= 0) return;
    const idItemPedidoParaRemover = grupo.primeiroItemIdNoPedido;

    setItemLoading(prev => ({...prev, [grupo.key]: true}));
    try {
      const url = `${API_DELETAR_ITEM_PEDIDO_URL}?pedido_id=${idItemPedidoParaRemover}`;
      const res = await axios.delete(url);
      if (res.data.success) {
        await fetchCarrinhoData();
      } else {
        Alert.alert(
          'Erro ao Remover',
          res.data.message || 'Não foi possível remover.',
        );
      }
    } catch (err: any) {
      Alert.alert(
        'Erro de Rede',
        err.response?.data?.message || 'Não foi possível remover.',
      );
    } finally {
      setItemLoading(prev => ({...prev, [grupo.key]: false}));
    }
  };

  const handleDeleteAllOfType = async (
    produto_id_do_grupo: number,
    nome_produto_do_grupo: string,
  ) => {
    if (!user?.id) {
      /* ... */ return;
    }
    Alert.alert(
      'Remover Todos?',
      `Tem certeza que deseja remover todos os itens de "${nome_produto_do_grupo}" do pedido?`,
      [
        {text: 'Cancelar', style: 'cancel'},
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            setDeletingAllType(produto_id_do_grupo);
            try {
              const url = `${API_DELETAR_ITENS_POR_PRODUTO_URL}?cliente_id=${user.id}&produto_id=${produto_id_do_grupo}`;
              console.log('Chamando API (com GET) para deletar tipo:', url);

              // ***** MUDANÇA AQUI *****
              const res = await axios.get(url); // Mudar de axios.delete para axios.get

              console.log('Resposta da API (deletar tipo):', res.data);
              if (res.data.success) {
                Alert.alert(
                  'Sucesso',
                  res.data.message ||
                    `Todos os itens de "${nome_produto_do_grupo}" foram removidos.`,
                );
                await fetchCarrinhoData();
              } else {
                Alert.alert(
                  'Erro ao Remover',
                  res.data.message || 'Não foi possível remover os itens.',
                );
              }
            } catch (err: any) {
              console.error('Erro de rede ao deletar tipo:', err);
              let errorMessage = 'Não foi possível remover os itens.';
              if (
                err.response &&
                err.response.data &&
                err.response.data.message
              ) {
                errorMessage = err.response.data.message;
              } else if (err.message) {
                errorMessage = err.message;
              }
              Alert.alert('Erro de Rede', errorMessage);
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
    if (!user?.id) {
      Alert.alert('Erro', 'Login necessário.');
      return;
    }
    setFavoritingItemKey(grupo.key);
    const payload = {
      pizzas: [
        {
          cliente_id: Number(user.id),
          pizza_id: grupo.produto_id,
          nome_pizza: grupo.nome_produto,
          preco: grupo.precoUnitario,
        },
      ],
    };
    if (!payload.pizzas[0].pizza_id || !payload.pizzas[0].nome_pizza) {
      Alert.alert('Erro Interno', 'Dados para favoritar incompletos.');
      setFavoritingItemKey(null);
      return;
    }
    try {
      const res = await axios.post(API_PEDIDO_FAVORITO_URL, payload);
      if (res.data.success) {
        Alert.alert(
          'Favoritado!',
          `"${grupo.nome_produto}" adicionado aos favoritos.`,
        );
      } else {
        Alert.alert(
          'Erro ao Favoritar',
          res.data.message || 'Não foi possível favoritar.',
        );
      }
    } catch (err: any) {
      Alert.alert(
        'Erro de Rede',
        err.response?.data?.message || 'Não foi possível favoritar.',
      );
    } finally {
      setTimeout(() => setFavoritingItemKey(null), 300);
    }
  };

  const proceedToCheckout = async (obs: string) => {
    if (!user?.id) {
      Alert.alert('Erro', 'Usuário não identificado.');
      setIsModalVisible(false);
      return;
    }
    if (carrinho.length === 0) {
      Alert.alert('Carrinho Vazio', 'Adicione itens antes de finalizar.');
      setIsModalVisible(false);
      return;
    }
    setIsCheckingOut(true);
    setIsModalVisible(false);
    try {
      const response = await axios.post(API_CRIAR_PEDIDO_URL, {
        cliente_id: user.id,
        observacao: obs.trim(),
      });
      if (response.data && response.data.success) {
        Alert.alert(
          'Pedido Finalizado',
          `Seu pedido (${response.data.n_pedido || ''}) foi enviado!`,
        );
        if (limparCarrinho) {
          limparCarrinho();
        } else {
          setCarrinho([]);
        }
        setObservacao('');
      } else {
        Alert.alert(
          'Erro ao Finalizar',
          response.data.message || 'Não foi possível registrar o pedido.',
        );
      }
    } catch (checkoutError: any) {
      Alert.alert(
        'Erro de Rede',
        checkoutError.response?.data?.message ||
          'Não foi possível conectar ao servidor.',
      );
    } finally {
      setIsCheckingOut(false);
    }
  };

  if (loading && carrinho.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#FFA500" />
        <Text style={styles.loadingText}>Carregando seu pedido...</Text>
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
        <Text style={styles.error}>{String(error)}</Text>
        <TouchableOpacity
          onPress={fetchCarrinhoData}
          style={styles.retryButton}>
          <Text style={styles.retryButtonText}>Tentar Novamente</Text>
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
        <Text style={styles.message}>Seu pedido está vazio.</Text>
        <Text style={styles.messageSub}>Adicione alguns itens saborosos!</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>MEU PEDIDO</Text>
      <FlatList
        data={gruposCarrinho}
        keyExtractor={item => item.key}
        renderItem={({item: grupo}: {item: GrupoCarrinhoItem}) => {
          const isFavoriting = favoritingItemKey === grupo.key;
          return (
            <View style={styles.itemContainer}>
              <View style={styles.imageBorderContainer}>
                {grupo.caminho_imagem ? (
                  <Image
                    source={{uri: grupo.caminho_imagem}}
                    style={styles.pizzaImage}
                    resizeMode="cover"
                    onError={e =>
                      console.warn(
                        `Erro img ${grupo.caminho_imagem}:`,
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
              <View style={styles.contentAreaRow}>
                <View style={styles.infoColumn}>
                  <View style={styles.namePriceContainer}>
                    <Text
                      style={styles.itemTextName}
                      numberOfLines={2}
                      ellipsizeMode="tail">
                      {grupo.nome_produto}
                      {(grupo.tamanho && grupo.tamanho !== 'N/A') ||
                      (grupo.tipo_tamanho && grupo.tipo_tamanho !== 'N/A')
                        ? ` (${
                            grupo.tamanho && grupo.tamanho !== 'N/A'
                              ? grupo.tamanho
                              : ''
                          }${
                            grupo.tamanho &&
                            grupo.tamanho !== 'N/A' &&
                            grupo.tipo_tamanho &&
                            grupo.tipo_tamanho !== 'N/A'
                              ? ' '
                              : ''
                          }${
                            grupo.tipo_tamanho && grupo.tipo_tamanho !== 'N/A'
                              ? grupo.tipo_tamanho
                              : ''
                          })`.trim()
                        : ''}
                    </Text>
                    <Text style={styles.itemTextPrice}>
                      R$ {grupo.precoUnitario.toFixed(2)}
                    </Text>
                    {/* <Text style={styles.itemStatus}>Status: {grupo.status_item}</Text> */}
                  </View>
                  <View style={styles.quantityGroupContainer}>
                    <View style={styles.quantityGroupBackground}>
                      <TouchableOpacity
                        style={styles.quantityCtrlButton}
                        onPress={() => handleDecrementItem(grupo)}
                        disabled={
                          itemLoading[grupo.key] ||
                          deletingAllType === grupo.produto_id ||
                          grupo.quantidade <= 1 ||
                          isFavoriting
                        }>
                        <Icon
                          name="minus"
                          size={16}
                          color={
                            itemLoading[grupo.key] ||
                            deletingAllType === grupo.produto_id ||
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
                          deletingAllType === grupo.produto_id ||
                          isFavoriting
                        }>
                        <Icon
                          name="plus"
                          size={16}
                          color={
                            itemLoading[grupo.key] ||
                            deletingAllType === grupo.produto_id ||
                            isFavoriting
                              ? '#adb5bd'
                              : '#388E3C'
                          }
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
                <View style={styles.iconsColumn}>
                  <TouchableOpacity
                    onPress={() => handleFavorite(grupo)}
                    style={styles.iconButton}
                    disabled={
                      isFavoriting ||
                      itemLoading[grupo.key] ||
                      deletingAllType === grupo.produto_id
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
                      handleDeleteAllOfType(
                        grupo.produto_id,
                        grupo.nome_produto,
                      )
                    }
                    disabled={
                      deletingAllType === grupo.produto_id ||
                      itemLoading[grupo.key] ||
                      isFavoriting
                    }>
                    <View style={styles.trashIconCircle}>
                      {deletingAllType === grupo.produto_id ? (
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
        ListFooterComponent={() => <View style={{height: 120}} />}
      />

      <View style={styles.footer}>
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total:</Text>
          <Text style={styles.totalValue}>R$ {total.toFixed(2)}</Text>
        </View>
        <TouchableOpacity
          style={[
            styles.checkoutButton,
            (isCheckingOut || carrinho.length === 0) &&
              styles.checkoutButtonDisabled,
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
              placeholder="Ex: Sem cebola, ponto da carne mal passado..."
              placeholderTextColor="#999"
              multiline
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
// (Copie e cole seus estilos aqui como estavam antes)
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
  itemStatus: {
    // Estilo opcional para o status
    fontSize: 12,
    color: '#6c757d',
    fontStyle: 'italic',
    marginTop: 4,
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

export default CarrinhoScreen;
