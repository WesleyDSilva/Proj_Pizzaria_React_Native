// Arquivo: src/pages/Carrinho/index.tsx

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
  Modal,
  TextInput,
  KeyboardAvoidingView,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import axios from 'axios';
import {Picker} from '@react-native-picker/picker';
import {AuthContext} from '../../contexts/AuthContext';
import {useCarrinho, CarrinhoItem} from '../../contexts/CarrinhoContext'; // CarrinhoItem do contexto já inclui 'quantidade'
import {useFocusEffect} from '@react-navigation/native';

// Interface para os itens como vêm da API PHP (api_get_carrinho.php)
interface ItemDaApi {
  id_item_pedido: number;
  cliente_id?: number;
  produto_id: number;
  tamanho_pedido: string | null; // Este é o 'tamanho' que usaremos para agrupar meias
  tipo_tamanho_pedido: string | null; // Este é o 'tipo_tamanho' que usaremos
  total_item_pedido: number; // Preço unitário
  nome_produto: string;
  caminho_imagem_produto?: string;
  status_item_pedido: string;
  quantidade: number; // Essencial que a API retorne este campo
  // categoria_produto?: string; // Opcional: se sua API de carrinho retornar categoria
}

// Interface para itens agrupados na FlatList para exibição
interface GrupoCarrinhoItem {
  key: string;
  produto_id: number;
  nome_produto: string;
  tipo_tamanho: string; // normalizado para minúsculas ou 'n/a'
  tamanho: string; // normalizado para minúsculas ou 'n/a'
  precoUnitario: number;
  quantidade: number; // Quantidade total deste item agrupado
  precoTotalGrupo: number;
  primeiroItemIdNoPedido: number;
  caminho_imagem?: string;
  status_item: string;
  // categoria_produto?: string; // Se for usar
}

const API_GET_CARRINHO_URL =
  'https://devweb3.ok.etc.br/api_mobile/api_get_carrinho.php';
const API_REGISTRAR_ITEM_PEDIDO_URL =
  'https://devweb3.ok.etc.br/api_mobile/api_registrar_item_pedido.php';
const API_DELETAR_ITEM_PEDIDO_URL =
  'https://devweb3.ok.etc.br/api/api_delete_carrinho_item.php';
const API_DELETAR_ITENS_POR_PRODUTO_URL =
  'https://devweb3.ok.etc.br/api/api_delete_carrinho.php';
const API_FINALIZAR_PEDIDO_URL =
  'https://devweb3.ok.etc.br/api/api_registrar_pedido.php';
const API_PEDIDO_FAVORITO_URL =
  'https://devweb3.ok.etc.br/api/api_pedido_favorito.php';

const CarrinhoScreen = () => {
  const {user} = useContext(AuthContext);
  const {carrinho, setCarrinho, limparCarrinho} = useCarrinho(); // carrinho aqui é CarrinhoItem[]

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
  const [formaPagamento, setFormaPagamento] = useState<
    'PIX' | 'Cartão' | 'Dinheiro'
  >('Cartão');
  const [trocoPara, setTrocoPara] = useState<string>('');
  const [mostrarCampoTroco, setMostrarCampoTroco] = useState<boolean>(false);

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
        const carrinhoDataParaContexto: CarrinhoItem[] = response.data.map(
          apiItem => ({
            id: apiItem.id_item_pedido,
            produto_id: apiItem.produto_id,
            preco: apiItem.total_item_pedido || 0,
            nome_produto: apiItem.nome_produto || 'Item Desconhecido',
            tipo_tamanho: apiItem.tipo_tamanho_pedido, // Mapeia tipo_tamanho_pedido para tipo_tamanho
            tamanho: apiItem.tamanho_pedido, // Mapeia tamanho_pedido para tamanho
            caminho_imagem: apiItem.caminho_imagem_produto || undefined,
            status_pedido: apiItem.status_item_pedido || 'PENDENTE',
            quantidade: apiItem.quantidade,
            // categoria: apiItem.categoria_produto, // Se vier da API e for usar
          }),
        );
        setCarrinho(carrinhoDataParaContexto);
      } else if (
        response.data &&
        ((response.data as any).message
          ?.toLowerCase()
          .includes('nenhum item encontrado') ||
          (typeof response.data === 'object' &&
            Object.keys(response.data).length === 0) ||
          response.data === null ||
          response.data === '')
      ) {
        setCarrinho([]);
      } else if (
        (response.data as any)?.success === false ||
        (response.data as any)?.error === true
      ) {
        setError((response.data as any).message || 'Erro API (carrinho).');
        setCarrinho([]);
      } else {
        console.warn('Get Carrinho: Resp. Inesperada:', response.data);
        setError('Formato inesperado (carrinho).');
        setCarrinho([]);
      }
    } catch (err: any) {
      let msg = 'Falha ao carregar carrinho.';
      if (axios.isAxiosError(err) && err.response)
        msg = String(
          err.response.data?.message ||
            err.response.statusText ||
            'Erro servidor.',
        );
      else if (err.request) msg = 'Sem resposta do servidor.';
      else msg = String(err.message || 'Erro desconhecido.');
      console.error('Erro fetchCarrinhoData:', msg, err);
      setError(msg);
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
    if (!Array.isArray(carrinho) || carrinho.length === 0) return [];
    carrinho.forEach((itemDoContexto: CarrinhoItem) => {
      if (
        typeof itemDoContexto.produto_id !== 'number' ||
        typeof itemDoContexto.preco !== 'number' ||
        typeof itemDoContexto.quantidade !== 'number' ||
        itemDoContexto.quantidade < 0
      ) {
        console.warn(
          'gruposCarrinho: Item inválido no contexto:',
          itemDoContexto,
        );
        return;
      }
      const tipoKey = itemDoContexto.tipo_tamanho?.toLowerCase() || 'n/a';
      const tamanhoKey = itemDoContexto.tamanho?.toLowerCase() || 'n/a'; // 'tamanho' de CarrinhoItem
      const groupKey = `${itemDoContexto.produto_id}-${tipoKey}-${tamanhoKey}`;

      if (grupos.has(groupKey)) {
        const g = grupos.get(groupKey)!;
        g.quantidade += itemDoContexto.quantidade;
        g.precoTotalGrupo +=
          (itemDoContexto.preco || 0) * itemDoContexto.quantidade;
      } else {
        grupos.set(groupKey, {
          key: groupKey,
          produto_id: itemDoContexto.produto_id,
          nome_produto: itemDoContexto.nome_produto,
          tipo_tamanho: tipoKey,
          tamanho: tamanhoKey,
          precoUnitario: itemDoContexto.preco || 0,
          quantidade: itemDoContexto.quantidade,
          precoTotalGrupo:
            (itemDoContexto.preco || 0) * itemDoContexto.quantidade,
          primeiroItemIdNoPedido: itemDoContexto.id,
          caminho_imagem: itemDoContexto.caminho_imagem,
          status_item: itemDoContexto.status_pedido || 'PENDENTE',
          // categoria_produto: itemDoContexto.categoria,
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
    const payload = {
      cliente_id: Number(user.id),
      produto_id: grupo.produto_id,
      preco: grupo.precoUnitario,
      tamanho_selecionado: grupo.tamanho === 'n/a' ? 'pequena' : grupo.tamanho,
      tipo_tamanho:
        grupo.tipo_tamanho === 'n/a' ? 'inteira' : grupo.tipo_tamanho,
      quantidade: 1,
    };
    console.log(
      'Carrinho: Payload handleIncrementItem:',
      JSON.stringify(payload),
    );
    try {
      const res = await axios.post(API_REGISTRAR_ITEM_PEDIDO_URL, payload);
      if (res.data.success) await fetchCarrinhoData();
      else
        Alert.alert(
          'Erro ao Adicionar',
          res.data.message || 'Não foi possível adicionar.',
        );
    } catch (err: any) {
      const msg =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : err.message || 'Falha ao adicionar.';
      Alert.alert('Erro de Rede', msg);
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
      if (res.data.success) await fetchCarrinhoData();
      else
        Alert.alert(
          'Erro ao Remover',
          res.data.message || 'Não foi possível remover.',
        );
    } catch (err: any) {
      const msg =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : err.message || 'Falha ao remover.';
      Alert.alert('Erro de Rede', msg);
    } finally {
      setItemLoading(prev => ({...prev, [grupo.key]: false}));
    }
  };

  const handleDeleteAllOfType = async (
    produto_id: number,
    nome_produto: string,
  ) => {
    if (!user?.id) {
      Alert.alert('Erro', 'Login necessário.');
      return;
    }
    Alert.alert(
      'Remover Todos?',
      `Remover todos os "${nome_produto}"?`,
      [
        {text: 'Cancelar'},
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            setDeletingAllType(produto_id);
            try {
              const url = `${API_DELETAR_ITENS_POR_PRODUTO_URL}?cliente_id=${user.id}&produto_id=${produto_id}`;
              const res = await axios.get(url);
              if (res.data.success) await fetchCarrinhoData();
              else Alert.alert('Erro', res.data.message || 'Falha.');
            } catch (err: any) {
              Alert.alert(
                'Erro Rede',
                axios.isAxiosError(err) && err.response?.data?.message
                  ? err.response.data.message
                  : err.message,
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
    if (!payload.pizzas[0].pizza_id) {
      Alert.alert('Erro', 'Dados incompletos.');
      setFavoritingItemKey(null);
      return;
    }
    try {
      const res = await axios.post(API_PEDIDO_FAVORITO_URL, payload);
      if (res.data.success)
        Alert.alert('Favoritado!', `"${grupo.nome_produto}" adicionado.`);
      else Alert.alert('Erro', res.data.message || 'Falha.');
    } catch (err: any) {
      Alert.alert(
        'Erro Rede',
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : err.message,
      );
    } finally {
      setTimeout(() => setFavoritingItemKey(null), 300);
    }
  };

  const proceedToCheckout = async () => {
    if (!user?.id) {
      Alert.alert('Erro', 'Usuário não identificado.');
      setIsModalVisible(false);
      return;
    }
    if (gruposCarrinho.length === 0) {
      Alert.alert('Carrinho Vazio', 'Adicione itens antes de finalizar.');
      setIsModalVisible(false);
      return;
    }
    if (!['PIX', 'Cartão', 'Dinheiro'].includes(formaPagamento)) {
      Alert.alert(
        'Forma de Pagamento Inválida',
        'Selecione uma forma de pagamento.',
      );
      return;
    }

    const meiasPizzasPorTamanho: Record<string, number> = {};
    let existemMeiasPizzas = false;

    carrinho.forEach((item: CarrinhoItem) => {
      const ehPizza = item.nome_produto.toLowerCase().includes('pizza'); // Ou item.categoria === 'Pizza'
      const tipoTamanhoNormalizado = item.tipo_tamanho?.toLowerCase() || 'n/a';
      const tamanhoNormalizado = item.tamanho?.toLowerCase() || 'n/a'; // Usa 'tamanho' de CarrinhoItem

      if (ehPizza && tipoTamanhoNormalizado === 'meia') {
        existemMeiasPizzas = true;
        if (tamanhoNormalizado !== 'n/a') {
          meiasPizzasPorTamanho[tamanhoNormalizado] =
            (meiasPizzasPorTamanho[tamanhoNormalizado] || 0) + item.quantidade;
        } else {
          console.warn(
            'Meia pizza encontrada sem tamanho definido no CarrinhoItem:',
            item,
          );
        }
      }
    });

    console.log(
      'CarrinhoScreen: Contagem de meias pizzas por tamanho:',
      meiasPizzasPorTamanho,
    );

    if (existemMeiasPizzas) {
      for (const tamanhoKey in meiasPizzasPorTamanho) {
        // tamanhoKey aqui é ex: "media", "grande"
        if (meiasPizzasPorTamanho[tamanhoKey] % 2 !== 0) {
          Alert.alert(
            'Atenção - Pizzas Meia/Meia Incompatíveis',
            `Você tem ${meiasPizzasPorTamanho[tamanhoKey]} parte(s) de pizza "meia" do tamanho "${tamanhoKey}". ` +
              `Para formar pizzas inteiras, as "meias" devem ser combinadas em pares do mesmo tamanho. ` +
              `Por favor, ajuste seu pedido.`,
          );
          return;
        }
      }
    }

    setIsCheckingOut(true);
    const payloadRequest: any = {
      cliente_id: Number(user.id),
      forma_pagamento: formaPagamento,
    };
    if (formaPagamento === 'Dinheiro' && trocoPara.trim() !== '') {
      const trocoValor = parseFloat(trocoPara.replace(',', '.'));
      if (!isNaN(trocoValor) && trocoValor > 0)
        payloadRequest.troco_para = trocoValor;
      else if (trocoPara.trim() !== '')
        Alert.alert(
          'Atenção Troco',
          'Valor do troco inválido. Pedido finalizado sem essa informação.',
        );
    }
    if (observacao.trim() !== '')
      console.log(
        'Observação (não enviada para API de finalizar):',
        observacao,
      );
    console.log(
      'CarrinhoScreen: Payload proceedToCheckout:',
      JSON.stringify(payloadRequest),
    );
    try {
      const response = await axios.post(
        API_FINALIZAR_PEDIDO_URL,
        payloadRequest,
      );
      if (response.data && response.data.success) {
        Alert.alert(
          'Pedido Confirmado!',
          `Pedido (${response.data.n_pedido || ''}) confirmado. Itens: ${
            response.data.itens_afetados || 0
          }`,
        );
        if (limparCarrinho) limparCarrinho();
        else setCarrinho([]);
        setObservacao('');
        setTrocoPara('');
        setFormaPagamento('Cartão');
        setIsModalVisible(false);
      } else {
        let msgErro =
          response.data.message || 'Não foi possível finalizar o pedido.';
        if (
          response.data.itens_afetados === 0 &&
          response.data.success === true
        )
          msgErro = 'Carrinho vazio no servidor ou itens já processados.';
        else if (
          response.data.itens_afetados === 0 &&
          response.data.success === false
        )
          msgErro =
            response.data.message || 'Nenhum item pendente para finalizar.';
        Alert.alert('Erro ao Finalizar', msgErro);
      }
    } catch (err: any) {
      const msg =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : err.message || 'Falha ao finalizar.';
      Alert.alert('Erro de Rede', msg);
    } finally {
      setIsCheckingOut(false);
    }
  };

  if (loading && carrinho.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#FFA500" />
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    );
  }
  if (error) {
    return (
      <View style={styles.centered}>
        <Icon name="exclamation-triangle" size={40} color="#D32F2F" />
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
        <Icon name="shopping-cart" size={50} color="#adb5bd" />
        <Text style={styles.message}>Seu carrinho está vazio.</Text>
        <Text style={styles.messageSub}>Adicione itens!</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>MEU PEDIDO</Text>
      <FlatList
        data={gruposCarrinho}
        keyExtractor={item => item.key}
        renderItem={({item: grupo}) => {
          const isLoading =
            itemLoading[grupo.key] ||
            deletingAllType === grupo.produto_id ||
            favoritingItemKey === grupo.key;
          const decDisabled = isLoading || grupo.quantidade <= 1;
          const displayTamanho = grupo.tamanho === 'n/a' ? '' : grupo.tamanho;
          const displayTipoTamanho =
            grupo.tipo_tamanho === 'n/a' ? '' : grupo.tipo_tamanho;
          const temDetalhesTamanho = displayTamanho || displayTipoTamanho;

          return (
            <View style={styles.itemContainer}>
              <View style={styles.imageBorderContainer}>
                {grupo.caminho_imagem ? (
                  <Image
                    source={{uri: grupo.caminho_imagem}}
                    style={styles.pizzaImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.pizzaImagePlaceholderContent}>
                    <Icon name="camera" size={20} color="#ced4da" />
                  </View>
                )}
              </View>
              <View style={styles.contentAreaRow}>
                <View style={styles.infoColumn}>
                  <View>
                    <Text style={styles.itemTextName} numberOfLines={2}>
                      {grupo.nome_produto}
                      {temDetalhesTamanho
                        ? ` (${displayTamanho}${
                            displayTamanho && displayTipoTamanho ? ' ' : ''
                          }${displayTipoTamanho})`.trim()
                        : ''}
                    </Text>
                    <Text style={styles.itemTextPrice}>
                      R$ {grupo.precoUnitario.toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.quantityGroupContainer}>
                    <View style={styles.quantityGroupBackground}>
                      <TouchableOpacity
                        style={styles.quantityCtrlButton}
                        onPress={() => handleDecrementItem(grupo)}
                        disabled={decDisabled}>
                        <Icon
                          name="minus"
                          size={16}
                          color={decDisabled ? '#adb5bd' : '#D32F2F'}
                        />
                      </TouchableOpacity>
                      <View style={styles.quantityTextContainer}>
                        {isLoading && !deletingAllType && !favoritingItemKey ? (
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
                        disabled={isLoading}>
                        <Icon
                          name="plus"
                          size={16}
                          color={isLoading ? '#adb5bd' : '#388E3C'}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
                <View style={styles.iconsColumn}>
                  <TouchableOpacity
                    onPress={() => handleFavorite(grupo)}
                    style={styles.iconButton}
                    disabled={isLoading}>
                    <View style={styles.heartIconCircle}>
                      <Icon
                        name={
                          favoritingItemKey === grupo.key ? 'heart' : 'heart-o'
                        }
                        size={18}
                        color={
                          favoritingItemKey === grupo.key
                            ? '#FF0000'
                            : isLoading
                            ? '#adb5bd'
                            : '#FFA500'
                        }
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
                      isLoading || deletingAllType === grupo.produto_id
                    }>
                    <View style={styles.trashIconCircle}>
                      {deletingAllType === grupo.produto_id ? (
                        <ActivityIndicator size="small" color="#D32F2F" />
                      ) : (
                        <Icon
                          name="trash"
                          size={16}
                          color={
                            isLoading || deletingAllType === grupo.produto_id
                              ? '#adb5bd'
                              : '#495057'
                          }
                        />
                      )}
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        }}
        ListFooterComponent={() => (
          <View style={{height: Platform.OS === 'ios' ? 150 : 130}} />
        )}
      />
      <View style={styles.footer}>
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total:</Text>
          <Text style={styles.totalValue}>R$ {total.toFixed(2)}</Text>
        </View>
        <TouchableOpacity
          style={[
            styles.checkoutButton,
            (isCheckingOut || gruposCarrinho.length === 0) &&
              styles.checkoutButtonDisabled,
          ]}
          onPress={() => setIsModalVisible(true)}
          disabled={isCheckingOut || gruposCarrinho.length === 0}>
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
            setTrocoPara('');
            setFormaPagamento('Cartão');
          }
        }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Finalizar Pedido</Text>
            <Text style={styles.modalLabel}>Forma de Pagamento:</Text>
            <View style={styles.pickerContainerModal}>
              <Picker
                selectedValue={formaPagamento}
                style={styles.pickerModal}
                onValueChange={itemValue => {
                  setFormaPagamento(itemValue);
                  setMostrarCampoTroco(itemValue === 'Dinheiro');
                  if (itemValue !== 'Dinheiro') setTrocoPara('');
                }}
                mode="dropdown"
                dropdownIconColor="#FFA500">
                <Picker.Item
                  label="Cartão de Crédito/Débito"
                  value="Cartão"
                  style={styles.pickerItemModal}
                />
                <Picker.Item
                  label="PIX"
                  value="PIX"
                  style={styles.pickerItemModal}
                />
                <Picker.Item
                  label="Dinheiro"
                  value="Dinheiro"
                  style={styles.pickerItemModal}
                />
              </Picker>
            </View>
            {mostrarCampoTroco && (
              <>
                <Text style={styles.modalLabel}>Troco para (R$):</Text>
                <TextInput
                  style={styles.textInputShort}
                  placeholder="Ex: 50 ou 50.00"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                  value={trocoPara}
                  onChangeText={setTrocoPara}
                />
              </>
            )}
            <Text style={styles.modalLabel}>Observações (opcional):</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Ex: Sem cebola..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={3}
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
                  setTrocoPara('');
                  setFormaPagamento('Cartão');
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
                onPress={proceedToCheckout}
                disabled={isCheckingOut}>
                {isCheckingOut ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.confirmButtonText}>Confirmar Pedido</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

// --- Constantes de Estilo ---
const IMAGE_SIZE = 55;
const IMAGE_BORDER_SPACE = 10;
const BORDER_THICKNESS = 2;
const IMAGE_CONTAINER_SIZE = IMAGE_SIZE + IMAGE_BORDER_SPACE * 2;
const TRASH_CIRCLE_SIZE = 32;
const TRASH_BORDER_WIDTH = 1;
const ICON_COLUMN_WIDTH = 40;
const HEART_CIRCLE_SIZE = 32;
const HEART_BORDER_THICKNESS = 1;

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#f8f9fa'},
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
    marginVertical: 8,
    marginHorizontal: 16,
    elevation: 4,
    shadowColor: '#000000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
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
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 4,
  },
  itemTextPrice: {fontSize: 15, color: '#e63946', fontWeight: '700'},
  quantityGroupContainer: {marginTop: 10},
  quantityGroupBackground: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff0e1',
    borderRadius: 20,
    paddingHorizontal: 6,
    height: 38,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#FFA500',
  },
  quantityCtrlButton: {paddingHorizontal: 12, paddingVertical: 8},
  quantityTextContainer: {
    minWidth: 30,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#495057',
    textAlign: 'center',
  },
  iconsColumn: {
    flexDirection: 'column',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: ICON_COLUMN_WIDTH,
  },
  iconButton: {},
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
  trashButtonContainer: {},
  trashIconCircle: {
    width: TRASH_CIRCLE_SIZE,
    height: TRASH_CIRCLE_SIZE,
    borderRadius: TRASH_CIRCLE_SIZE / 2,
    backgroundColor: '#f1f3f5',
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
  loadingText: {marginTop: 12, fontSize: 17, color: '#6c757d'},
  iconError: {marginBottom: 15},
  error: {
    color: '#D32F2F',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  iconEmpty: {marginBottom: 15},
  message: {
    fontSize: 20,
    color: '#495057',
    textAlign: 'center',
    fontWeight: '500',
  },
  messageSub: {
    fontSize: 16,
    color: '#adb5bd',
    textAlign: 'center',
    marginTop: 10,
  },
  retryButton: {
    backgroundColor: '#007bff',
    paddingVertical: 12,
    paddingHorizontal: 35,
    borderRadius: 25,
    elevation: 2,
    marginTop: 10,
  },
  retryButtonText: {color: '#fff', fontSize: 16, fontWeight: 'bold'},
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
  totalContainer: {flexDirection: 'column', alignItems: 'flex-start', flex: 1},
  totalLabel: {fontSize: 15, color: '#6c757d', marginBottom: 2},
  totalValue: {fontSize: 22, fontWeight: 'bold', color: '#212529'},
  checkoutButton: {
    backgroundColor: '#28a745',
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 30,
    elevation: 3,
    minHeight: 50,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 150,
  },
  checkoutButtonDisabled: {backgroundColor: '#a3d9b1', elevation: 0},
  checkoutButtonText: {color: '#fff', fontSize: 17, fontWeight: 'bold'},
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: 'white',
    borderRadius: 15,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 25,
    alignItems: 'stretch',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
    textAlign: 'center',
  },
  modalLabel: {
    fontSize: 16,
    color: '#454545',
    marginBottom: 6,
    fontWeight: '500',
    alignSelf: 'flex-start',
  },
  pickerContainerModal: {
    width: '100%',
    height: 50,
    borderColor: '#ced4da',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 15,
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
    overflow: 'hidden',
  },
  pickerModal: {height: '100%', width: '100%', color: '#333'},
  pickerItemModal: {fontSize: Platform.OS === 'android' ? 16 : 18},
  textInput: {
    width: '100%',
    minHeight: 80,
    borderColor: '#ced4da',
    borderWidth: 1,
    borderRadius: 8,
    paddingTop: 10,
    paddingBottom: 10,
    paddingHorizontal: 15,
    marginBottom: 20,
    fontSize: 15,
    textAlignVertical: 'top',
    backgroundColor: '#f8f9fa',
  },
  textInputShort: {
    width: '100%',
    height: 50,
    borderColor: '#ced4da',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 15,
    backgroundColor: '#f8f9fa',
  },
  modalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 10,
  },
  modalButton: {
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 15,
    elevation: 2,
    flex: 1,
    marginHorizontal: 5,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {backgroundColor: '#6c757d', borderWidth: 0},
  cancelButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 15,
  },
  confirmButton: {backgroundColor: '#28a745'},
  confirmButtonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 15,
  },
});

export default CarrinhoScreen;
