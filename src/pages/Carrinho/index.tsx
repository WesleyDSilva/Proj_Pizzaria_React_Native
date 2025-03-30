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
// Importa do CONTEXTO agora, incluindo CarrinhoItem se estiver definido lá
import {useCarrinho, CarrinhoItem} from '../../contexts/CarrinhoContext';
// Se CarrinhoItem estiver em arquivo separado:
// import {CarrinhoItem} from '../../contexts/CarrinhoItem';
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
  primeiroItemId: number; // ID do primeiro item original (para decrementar)
}

const Carrinho = () => {
  const {user} = useContext(AuthContext);
  const {carrinho, setCarrinho, removerPizza, removerTodasAsPizzasDoTipo} =
    useCarrinho();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [itemLoading, setItemLoading] = useState<{[key: string]: boolean}>({}); // Usar a chave do grupo (string)
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
        // Dados brutos da API
        const rawData: any[] = response.data;
        // Mapeia e garante a tipagem correta para CarrinhoItem
        const carrinhoData: CarrinhoItem[] = rawData.map((item: any) => ({
          id: Number(item.id),
          pizza_id: Number(item.pizza_id),
          preco: parseFloat(item.preco) || 0,
          nome_pizza: item.nome_pizza || 'Pizza Desconhecida',
          tipo_pizza: item.tipo_pizza || 'N/A',
          // *** CORREÇÃO DO TIPO cliente_id ***
          cliente_id: user.id ? Number(user.id) : undefined,
        }));
        setCarrinho(carrinhoData); // Atualiza o contexto
      } else {
        console.warn('Resposta da API não é um array:', response.data);
        setCarrinho([]);
        setError('Formato de resposta inesperado da API.');
      }
    } catch (err) {
      console.error('Erro ao buscar os dados do carrinho:', err);
      setError('Não foi possível carregar o carrinho.');
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

  // Agrupamento dos itens do carrinho
  const gruposCarrinho = useMemo(() => {
    const grupos: Map<string, GrupoCarrinhoItem> = new Map();
    carrinho.forEach(item => {
      const groupKey = `${item.pizza_id}-${item.tipo_pizza}`;
      if (grupos.has(groupKey)) {
        const grupoExistente = grupos.get(groupKey)!;
        grupoExistente.quantidade += 1;
        grupoExistente.precoTotalGrupo += item.preco || 0;
        // Não atualizamos primeiroItemId aqui, mantemos o do primeiro
      } else {
        grupos.set(groupKey, {
          key: groupKey,
          pizza_id: item.pizza_id,
          nome_pizza: item.nome_pizza || 'Pizza Desconhecida',
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

  // Cálculo do total
  const total = useMemo(
    () => gruposCarrinho.reduce((acc, grupo) => acc + grupo.precoTotalGrupo, 0),
    [gruposCarrinho],
  );

  // --- Handlers ---

  const handleIncrementItem = async (grupo: GrupoCarrinhoItem) => {
    if (!user?.id) {
      Alert.alert('Erro', 'Você precisa estar logado.');
      return;
    }
    setItemLoading(prev => ({...prev, [grupo.key]: true}));
    try {
      const response = await axios.post(
        'https://devweb3.ok.etc.br/api/api_registrar_carrinho.php',
        {
          cliente_id: Number(user.id), // Converte para número
          pizza_id: grupo.pizza_id,
          preco: grupo.precoUnitario,
          nome_pizza: grupo.nome_pizza,
          tipo_pizza: grupo.tipo_pizza,
        },
      );
      if (response.data.success || response.status === 200) {
        await fetchCarrinho();
      } else {
        Alert.alert(
          'Erro',
          response.data.message || 'Não foi possível adicionar.',
        );
      }
    } catch (err) {
      console.error('Erro ao incrementar item:', err);
      Alert.alert('Erro', 'Não foi possível adicionar.');
    } finally {
      setItemLoading(prev => ({...prev, [grupo.key]: false}));
    }
  };

  const handleDecrementItem = async (grupo: GrupoCarrinhoItem) => {
    if (!user?.id) {
      Alert.alert('Erro', 'Você precisa estar logado.');
      return;
    }
    if (grupo.quantidade <= 0) return;

    const itemIdToRemove = grupo.primeiroItemId; // ID único a ser removido
    setItemLoading(prev => ({...prev, [grupo.key]: true}));
    try {
      // *** AJUSTE A URL SE NECESSÁRIO PARA REMOVER POR ID ÚNICO ***
      const url = `https://devweb3.ok.etc.br/api/api_delete_carrinho_item.php?id=${itemIdToRemove}`;
      const response = await axios.get(url);
      if (response.data.success || response.status === 200) {
        removerPizza(itemIdToRemove); // Remove do contexto pelo ID único
      } else {
        Alert.alert('Erro', response.data.message || 'Erro ao remover.');
      }
    } catch (err) {
      console.error('Erro ao decrementar item:', err);
      Alert.alert('Erro', 'Não foi possível remover.');
    } finally {
      setItemLoading(prev => ({...prev, [grupo.key]: false}));
    }
  };

  const handleDeleteAllOfType = async (
    pizza_id: number,
    nome_pizza: string,
  ) => {
    if (!user?.id) {
      Alert.alert('Erro', 'Você precisa estar logado.');
      return;
    }
    Alert.alert(
      'Remover Todas?',
      `Tem certeza que deseja remover todas as pizzas "${nome_pizza}" do carrinho?`,
      [
        {text: 'Cancelar', style: 'cancel'},
        {
          text: 'Remover Todas',
          style: 'destructive',
          onPress: async () => {
            setDeletingAllType(pizza_id);
            try {
              const url = `https://devweb3.ok.etc.br/api/api_delete_carrinho.php?pizza_id=${pizza_id}&cliente_id=${Number(
                user.id,
              )}`; // Converte para número
              const response = await axios.get(url);
              if (response.data.success || response.status === 200) {
                removerTodasAsPizzasDoTipo(pizza_id); // Remove do contexto pelo pizza_id
                Alert.alert(
                  'Sucesso',
                  `Todas as pizzas "${nome_pizza}" foram removidas.`,
                );
              } else {
                Alert.alert(
                  'Erro',
                  response.data.message || 'Erro ao remover.',
                );
              }
            } catch (err) {
              console.error(`Erro ao remover tipo ${pizza_id}:`, err);
              Alert.alert('Erro', 'Não foi possível remover todas as pizzas.');
            } finally {
              setDeletingAllType(null);
            }
          },
        },
      ],
    );
  };

  const handleFavorite = async (grupo: GrupoCarrinhoItem) => {
    if (!user?.id) {
      Alert.alert('Erro', 'Você precisa estar logado.');
      return;
    }
    try {
      const pizza = {
        cliente_id: Number(user.id), // Converte para número
        pizza_id: grupo.pizza_id,
        nome_pizza: grupo.nome_pizza,
        preco: grupo.precoUnitario,
      };
      if (
        !pizza.cliente_id ||
        !pizza.pizza_id ||
        !pizza.nome_pizza ||
        !pizza.preco
      ) {
        Alert.alert('Erro', 'Dados incompletos para favoritar.');
        return;
      }
      const response = await axios.post(
        'https://devweb3.ok.etc.br/api/api_pedido_favorito.php',
        {pizzas: [pizza]},
      );
      if (response.data.success) {
        Alert.alert('Sucesso', 'Adicionada aos favoritos!');
      } else {
        Alert.alert('Erro', response.data.message || 'Erro ao favoritar.');
      }
    } catch (error) {
      console.error('Erro ao favoritar:', error);
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
        data={gruposCarrinho} // Usa os grupos
        extraData={carrinho} // Re-renderiza se o carrinho original mudar
        keyExtractor={item => item.key} // Usa a chave do grupo
        renderItem={({item: grupo}) => (
          <View style={styles.itemContainer}>
            <View style={[styles.triangle, styles.topLeftTriangle]} />
            <View style={[styles.triangle, styles.bottomRightTriangle]} />
            <View style={styles.itemContent}>
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
              <View style={styles.quantityControls}>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() =>
                    grupo.quantidade > 0 && handleDecrementItem(grupo)
                  }
                  disabled={
                    itemLoading[grupo.key] ||
                    deletingAllType === grupo.pizza_id ||
                    grupo.quantidade === 0
                  }>
                  <Icon
                    name="minus-circle"
                    size={24}
                    color={
                      itemLoading[grupo.key] ||
                      deletingAllType === grupo.pizza_id ||
                      grupo.quantidade === 0
                        ? '#ccc'
                        : '#ff6347'
                    }
                  />
                </TouchableOpacity>
                <Text style={styles.quantityText}>{grupo.quantidade}</Text>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => handleIncrementItem(grupo)}
                  disabled={
                    itemLoading[grupo.key] || deletingAllType === grupo.pizza_id
                  }>
                  <Icon
                    name="plus-circle"
                    size={24}
                    color={
                      itemLoading[grupo.key] ||
                      deletingAllType === grupo.pizza_id
                        ? '#ccc'
                        : '#32cd32'
                    }
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.trashButton}
                  onPress={() =>
                    handleDeleteAllOfType(grupo.pizza_id, grupo.nome_pizza)
                  }
                  disabled={
                    deletingAllType === grupo.pizza_id || itemLoading[grupo.key]
                  }>
                  {deletingAllType === grupo.pizza_id ? (
                    <ActivityIndicator size="small" color="#dc3545" />
                  ) : (
                    <Icon
                      name="trash"
                      size={22}
                      color={
                        deletingAllType === grupo.pizza_id ||
                        itemLoading[grupo.key]
                          ? '#ccc'
                          : '#dc3545'
                      }
                    />
                  )}
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
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
  },
  quantityButton: {
    paddingHorizontal: 5,
    paddingVertical: 5,
  },
  quantityText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginHorizontal: 8,
    color: '#333',
    minWidth: 25,
    textAlign: 'center',
  },
  trashButton: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    marginLeft: 4,
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
  error: {
    color: 'red',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 10,
  },
  message: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 15,
    backgroundColor: '#FFA500',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
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
  controlType: {},
});

export default Carrinho;
