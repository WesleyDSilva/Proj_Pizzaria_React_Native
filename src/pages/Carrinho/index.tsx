import React, {useState, useContext, useCallback, useMemo} from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import axios from 'axios';
import {AuthContext} from '../../contexts/AuthContext';
import {useCarrinho, CarrinhoItem} from '../../contexts/CarrinhoContext'; // Ajuste import se CarrinhoItem for separado
import {useFocusEffect} from '@react-navigation/native';

// Interface para os itens AGRUPADOS na FlatList
interface GrupoCarrinhoItem {
  key: string;
  pizza_id: number;
  nome_pizza: string;
  tipo_pizza: string;
  precoUnitario: number;
  quantidade: number;
  precoTotalGrupo: number;
  primeiroItemId: number;
}

const Carrinho = () => {
  const {user} = useContext(AuthContext);
  const {carrinho, setCarrinho, removerPizza, removerTodasAsPizzasDoTipo} =
    useCarrinho();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [itemLoading, setItemLoading] = useState<{[key: string]: boolean}>({});
  const [deletingAllType, setDeletingAllType] = useState<number | null>(null);

  const fetchCarrinho = useCallback(async () => {
    if (!user?.id) {
      console.log('Fetch cancelado: usuário não logado.');
      setCarrinho([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(
        `https://devweb3.ok.etc.br/api/api_get_carrinho.php?cliente_id=${user.id}`,
      );
      if (Array.isArray(response.data)) {
        const rawData: any[] = response.data;
        const carrinhoData: CarrinhoItem[] = rawData.map((item: any) => ({
          id: Number(item.id),
          pizza_id: Number(item.pizza_id),
          preco: parseFloat(item.preco) || 0,
          nome_pizza: item.nome_pizza || 'Pizza Desconhecida',
          tipo_pizza: item.tipo_pizza || 'N/A',
          cliente_id: user.id ? Number(user.id) : undefined,
        }));
        setCarrinho(carrinhoData);
      } else {
        console.warn('API não retornou array:', response.data);
        setCarrinho([]);
        setError('Erro de formato da API.');
      }
    } catch (err) {
      console.error('Erro ao buscar carrinho:', err);
      setError('Não foi possível carregar.');
      setCarrinho([]);
    } finally {
      setLoading(false);
    }
  }, [user, setCarrinho]);

  useFocusEffect(
    useCallback(() => {
      fetchCarrinho();
    }, [fetchCarrinho]),
  );

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
        });
      }
    });
    return Array.from(grupos.values());
  }, [carrinho]);

  const total = useMemo(
    () => gruposCarrinho.reduce((acc, g) => acc + g.precoTotalGrupo, 0),
    [gruposCarrinho],
  );

  // --- Handlers ---
  const handleIncrementItem = async (grupo: GrupoCarrinhoItem) => {
    if (!user?.id) {
      Alert.alert('Erro', 'Login necessário.');
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
      if (res.data.success || res.status === 200) {
        await fetchCarrinho();
      } else {
        Alert.alert('Erro', res.data.message || 'Não adicionado.');
      }
    } catch (err) {
      console.error('Erro inc:', err);
      Alert.alert('Erro', 'Não adicionado.');
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
    const itemRem = carrinho.find(
      i => i.pizza_id === grupo.pizza_id && i.tipo_pizza === grupo.tipo_pizza,
    );
    if (!itemRem) {
      console.error(`Item não achado: ${grupo.key}`);
      Alert.alert('Erro', 'Erro ao remover.');
      return;
    }
    const idRem = itemRem.id;
    setItemLoading(prev => ({...prev, [grupo.key]: true}));
    try {
      const url = `https://devweb3.ok.etc.br/api/api_delete_carrinho_item.php?id=${idRem}`;
      const res = await axios.get(url);
      if (res.data.success || res.status === 200) {
        removerPizza(idRem);
      } else {
        console.error('Erro API rem:', res.data);
        Alert.alert('Erro', res.data.message || 'Erro ao remover.');
      }
    } catch (err) {
      console.error('Erro net/axios dec:', err);
      Alert.alert('Erro', 'Não removido.');
    } finally {
      setItemLoading(prev => ({...prev, [grupo.key]: false}));
    }
  };

  const handleDeleteAllOfType = async (
    pizza_id: number,
    nome_pizza: string,
  ) => {
    if (!user?.id) {
      Alert.alert('Erro', 'Login necessário.');
      return;
    }
    Alert.alert(
      'Remover Todas?',
      `Remover todas "${nome_pizza}"?`,
      [
        {text: 'Cancelar', style: 'cancel'},
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            setDeletingAllType(pizza_id);
            try {
              const url = `https://devweb3.ok.etc.br/api/api_delete_carrinho.php?pizza_id=${pizza_id}&cliente_id=${Number(
                user.id,
              )}`;
              const res = await axios.get(url);
              if (res.data.success || res.status === 200) {
                removerTodasAsPizzasDoTipo(pizza_id);
                console.log(`Pizzas "${nome_pizza}" removidas.`);
              } else {
                Alert.alert('Erro', res.data.message || 'Erro ao remover.');
              }
            } catch (err) {
              console.error(`Erro rem tipo ${pizza_id}:`, err);
              Alert.alert('Erro', 'Não removidas.');
            } finally {
              setDeletingAllType(null);
            }
          },
        },
      ],
      {cancelable: true}, // Permite cancelar clicando fora no Android
    );
  };

  const handleFavorite = async (grupo: GrupoCarrinhoItem) => {
    if (!user?.id) {
      Alert.alert('Erro', 'Login necessário.');
      return;
    }
    try {
      const p = {
        cliente_id: Number(user.id),
        pizza_id: grupo.pizza_id,
        nome_pizza: grupo.nome_pizza,
        preco: grupo.precoUnitario,
      };
      if (!p.cliente_id || !p.pizza_id || !p.nome_pizza || !p.preco) {
        Alert.alert('Erro', 'Dados incompletos.');
        return;
      }
      const res = await axios.post(
        'https://devweb3.ok.etc.br/api/api_pedido_favorito.php',
        {pizzas: [p]},
      );
      if (res.data.success) {
        Alert.alert('Sucesso', 'Favoritada!');
      } else {
        Alert.alert('Erro', res.data.message || 'Erro ao favoritar.');
      }
    } catch (err) {
      console.error('Erro fav:', err);
      Alert.alert('Erro', 'Erro ao favoritar.');
    }
  };

  // --- Renderização ---

  if (loading && gruposCarrinho.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#FFA500" />
      </View>
    );
  }
  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>{error}</Text>
        <TouchableOpacity onPress={fetchCarrinho} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>Tentar Novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }
  if (gruposCarrinho.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.message}>Seu carrinho está vazio.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>MEU CARRINHO</Text>
      <FlatList
        data={gruposCarrinho}
        extraData={carrinho}
        keyExtractor={item => item.key}
        renderItem={({item: grupo}) => (
          <View style={styles.itemContainer}>
            <View style={[styles.triangle, styles.topLeftTriangle]} />
            <View style={[styles.triangle, styles.bottomRightTriangle]} />
            <View style={styles.itemContent}>
              {/* Botão Favorito */}
              <TouchableOpacity
                onPress={() => handleFavorite(grupo)}
                style={styles.iconButton}
                disabled={
                  itemLoading[grupo.key] || deletingAllType === grupo.pizza_id
                }>
                <Icon
                  name="heart"
                  size={20}
                  color={
                    itemLoading[grupo.key] || deletingAllType === grupo.pizza_id
                      ? '#ccc'
                      : '#FF6347'
                  }
                />
              </TouchableOpacity>
              {/* Detalhes */}
              <View style={styles.itemDetails}>
                <Text
                  style={styles.itemTextName}
                  numberOfLines={1}
                  ellipsizeMode="tail">
                  {grupo.nome_pizza} - {grupo.tipo_pizza}
                </Text>
                <Text style={styles.itemTextPrice}>
                  {' '}
                  R$ {grupo.precoUnitario.toFixed(2)} / Unid.{' '}
                </Text>
              </View>
              {/* Controles de Quantidade Agrupados */}
              <View style={styles.quantityControls}>
                {/* View com Background Laranja Claro */}
                <View style={styles.quantityGroupBackground}>
                  {/* Botão Menos (-) */}
                  <TouchableOpacity
                    style={styles.quantityCtrlButton} // Estilo para botão dentro do grupo
                    onPress={() => handleDecrementItem(grupo)}
                    disabled={
                      itemLoading[grupo.key] ||
                      deletingAllType === grupo.pizza_id ||
                      grupo.quantidade === 0
                    }>
                    <Icon
                      name="minus"
                      size={16}
                      color={
                        itemLoading[grupo.key] ||
                        deletingAllType === grupo.pizza_id ||
                        grupo.quantidade === 0
                          ? '#a0a0a0'
                          : '#D32F2F'
                      } // Vermelho mais escuro
                    />
                  </TouchableOpacity>

                  {/* Texto da Quantidade */}
                  <Text style={styles.quantityText}>{grupo.quantidade}</Text>

                  {/* Botão Mais (+) */}
                  <TouchableOpacity
                    style={styles.quantityCtrlButton} // Estilo para botão dentro do grupo
                    onPress={() => handleIncrementItem(grupo)}
                    disabled={
                      itemLoading[grupo.key] ||
                      deletingAllType === grupo.pizza_id
                    }>
                    <Icon
                      name="plus"
                      size={16}
                      color={
                        itemLoading[grupo.key] ||
                        deletingAllType === grupo.pizza_id
                          ? '#a0a0a0'
                          : '#388E3C'
                      } // Verde mais escuro
                    />
                  </TouchableOpacity>
                </View>

                {/* Botão Lixeira (Trash) - Separado */}
                <TouchableOpacity
                  style={styles.trashButtonContainer}
                  onPress={() =>
                    handleDeleteAllOfType(grupo.pizza_id, grupo.nome_pizza)
                  }
                  disabled={
                    deletingAllType === grupo.pizza_id || itemLoading[grupo.key]
                  }>
                  <View style={styles.trashIconCircle}>
                    {deletingAllType === grupo.pizza_id ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Icon name="trash" size={16} color="#515151" />
                    )}
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      />
      <View style={styles.totalContainer}>
        <Text style={styles.totalText}>Total: R$ {total.toFixed(2)}</Text>
      </View>
    </View>
  );
};

// --- Estilos ---
const TRIANGLE_SIZE = 15;
const TRASH_CIRCLE_SIZE = 30;
const TRASH_BORDER_WIDTH = 2;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 20,
    paddingHorizontal: 10,
    backgroundColor: '#f8f8f8',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
    textAlign: 'center',
  },
  itemContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.15,
    shadowRadius: 2,
    position: 'relative',
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  itemDetails: {
    flex: 1,
    marginHorizontal: 8,
  },
  itemTextName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#444',
    marginBottom: 3,
  },
  itemTextPrice: {
    fontSize: 14,
    color: '#00897B',
    fontWeight: '500',
  },
  iconButton: {
    padding: 8,
  },
  quantityControls: {
    // Container geral para os controles (agrupado + lixeira)
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto', // Empurra para a direita
  },
  // View que agrupa -, quantidade, + com fundo laranja claro
  quantityGroupBackground: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE0B2', // Laranja bem claro
    borderRadius: 15, // Bordas arredondadas para o grupo
    paddingHorizontal: 8, // Padding interno horizontal
    paddingVertical: 4, // Padding interno vertical
    height: 30, // Altura fixa para o grupo
  },
  // Estilo para os botões +/- DENTRO do grupo laranja
  quantityCtrlButton: {
    paddingHorizontal: 5, // Espaçamento interno do botão
  },
  quantityText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginHorizontal: 10, // Espaço entre botões e número
    color: '#5D4037', // Cor marrom escuro para o número
    minWidth: 20, // Largura mínima
    textAlign: 'center',
  },
  // Container do botão da lixeira
  trashButtonContainer: {
    marginLeft: 10, // Espaço entre o grupo +/- e a lixeira
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Círculo da lixeira (mantido)
  trashIconCircle: {
    width: TRASH_CIRCLE_SIZE,
    height: TRASH_CIRCLE_SIZE,
    borderRadius: TRASH_CIRCLE_SIZE / 2,
    backgroundColor: '#FFEACE',
    borderWidth: TRASH_BORDER_WIDTH,
    borderColor: '#FFA831',
    justifyContent: 'center',
    alignItems: 'center',
  },
  triangle: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    position: 'absolute',
    zIndex: -1,
  },
  topLeftTriangle: {
    top: 0,
    left: 0,
    borderTopWidth: TRIANGLE_SIZE,
    borderRightWidth: TRIANGLE_SIZE,
    borderTopColor: '#FFFFFF',
    borderRightColor: 'transparent',
  },
  bottomRightTriangle: {
    bottom: 0,
    right: 0,
    borderBottomWidth: TRIANGLE_SIZE,
    borderLeftWidth: TRIANGLE_SIZE,
    borderBottomColor: '#FFFFFF',
    borderLeftColor: 'transparent',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  error: {color: 'red', fontSize: 18, textAlign: 'center', marginBottom: 10},
  message: {fontSize: 18, color: '#666', textAlign: 'center'},
  retryButton: {
    marginTop: 15,
    backgroundColor: '#FFA500',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  retryButtonText: {color: '#fff', fontSize: 16, fontWeight: 'bold'},
  totalContainer: {
    marginTop: 'auto',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    backgroundColor: '#fff',
  },
  totalText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'right',
    color: '#333',
  },
  controlTarget: {},
  controlType: {}, // Estilos placeholder não usados
});

export default Carrinho;
