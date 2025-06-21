// src/pages/Pedidos/index.tsx
import React, {useState, useEffect, useContext, useCallback} from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  SafeAreaView,
  ScrollView,
  Pressable,
} from 'react-native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import axios from 'axios';
import Icon from 'react-native-vector-icons/Feather'; // Para o botão voltar

import {AuthContext} from '../../contexts/AuthContext'; // Ajuste o caminho
// Importe de seu arquivo centralizado de tipos de navegação
import {
  RootStackParamList,
  PedidoHistorico,
  ItemDetalhePedido,
} from '../../types/navigation'; // Ajuste o caminho

// Tipagem para a prop de navegação da tela "Pedidos"
// Mesmo que ela não navegue para "DetalhesDoPedido" como uma rota separada,
// ela ainda faz parte do RootStack e pode precisar navegar para outros lugares.
type PedidosScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Pedidos'
>;

interface PedidosProps {
  navigation: PedidosScreenNavigationProp;
}

const API_HISTORICO_URL =
  'https://devweb3.ok.etc.br/api/api_get_historico_pedidos.php';

// --- Componente Interno para Renderizar Detalhes do Pedido ---
const DetalhesPedidoView = ({
  pedido,
  onVoltar,
}: {
  pedido: PedidoHistorico;
  onVoltar: () => void;
}) => {
  const getStatusStyle = (status: string) => {
    const statusUpper = status.toUpperCase();
    switch (statusUpper) {
      case 'ENTREGUE':
        return {backgroundColor: '#2ecc71', color: '#fff'};
      case 'PREPARAÇÃO':
        return {backgroundColor: '#f39c12', color: '#fff'};
      case 'CANCELADO':
        return {backgroundColor: '#e74c3c', color: '#fff'};
      case 'PENDENTE':
        return {backgroundColor: '#3498db', color: '#fff'};
      default:
        return {backgroundColor: '#95a5a6', color: '#fff'};
    }
  };

  return (
    <SafeAreaView style={stylesDetalhes.safeArea}>
      <ScrollView style={stylesDetalhes.container}>
        <View style={stylesDetalhes.voltarHeader}>
          <Pressable onPress={onVoltar} style={stylesDetalhes.voltarButton}>
            <Icon name="arrow-left" size={24} color="#007bff" />
            <Text style={stylesDetalhes.voltarButtonText}>
              Voltar para Lista
            </Text>
          </Pressable>
        </View>

        <View style={stylesDetalhes.headerContainer}>
          <Text style={stylesDetalhes.title}>Detalhes do Pedido</Text>
          <Text style={stylesDetalhes.pedidoNumero}>Nº: {pedido.n_pedido}</Text>
        </View>

        <View style={stylesDetalhes.card}>
          <Text style={stylesDetalhes.cardTitle}>Informações Gerais</Text>
          <View style={stylesDetalhes.infoRow}>
            <Text style={stylesDetalhes.label}>Data:</Text>
            <Text style={stylesDetalhes.value}>{pedido.data_pedido}</Text>
          </View>
          <View style={stylesDetalhes.infoRow}>
            <Text style={stylesDetalhes.label}>Status:</Text>
            <Text
              style={[
                stylesDetalhes.statusBadge,
                getStatusStyle(pedido.status),
              ]}>
              {pedido.status}
            </Text>
          </View>
          <View style={stylesDetalhes.infoRow}>
            <Text style={stylesDetalhes.label}>Pagamento:</Text>
            <Text style={stylesDetalhes.value}>{pedido.forma_pagamento}</Text>
          </View>
          <View style={stylesDetalhes.infoRow}>
            <Text style={stylesDetalhes.labelTotal}>Total do Pedido:</Text>
            <Text style={stylesDetalhes.valueTotal}>
              R$ {pedido.total_geral_pedido.toFixed(2)}
            </Text>
          </View>
        </View>

        <View style={stylesDetalhes.card}>
          <Text style={stylesDetalhes.cardTitle}>Itens do Pedido</Text>
          {pedido.itens.map(
            (
              item: ItemDetalhePedido, // Adicionada tipagem para item
            ) => (
              <View
                key={item.item_pedido_id}
                style={stylesDetalhes.itemContainer}>
                {item.caminho_imagem_produto && (
                  <Image
                    source={{uri: item.caminho_imagem_produto}}
                    style={stylesDetalhes.itemImage}
                  />
                )}
                <View style={stylesDetalhes.itemInfo}>
                  <Text style={stylesDetalhes.itemName} numberOfLines={2}>
                    {item.nome_produto}
                  </Text>
                  <Text style={stylesDetalhes.itemDetail}>
                    Qtde: {item.quantidade} x R${' '}
                    {item.preco_unitario_no_pedido.toFixed(2)}
                  </Text>
                  {item.tamanho_item !== 'N/A' && item.tamanho_item && (
                    <Text style={stylesDetalhes.itemDetail}>
                      Tamanho: {item.tamanho_item}
                      {item.tipo_tamanho_item &&
                      item.tipo_tamanho_item !== 'N/A'
                        ? ` (${item.tipo_tamanho_item})`
                        : ''}
                    </Text>
                  )}
                  <Text style={stylesDetalhes.itemSubtotal}>
                    Subtotal: R$ {item.subtotal_item.toFixed(2)}
                  </Text>
                  {item.observacao_item && (
                    <Text style={stylesDetalhes.itemObservacao}>
                      Obs: {item.observacao_item}
                    </Text>
                  )}
                </View>
              </View>
            ),
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// --- Componente Principal da Tela de Pedidos (Listagem e Detalhes) ---
export default function PedidosScreen({navigation}: PedidosProps) {
  const {user} = useContext(AuthContext);
  const [pedidosLista, setPedidosLista] = useState<PedidoHistorico[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [pedidoSelecionado, setPedidoSelecionado] =
    useState<PedidoHistorico | null>(null);

  const fetchHistoricoPedidos = useCallback(async () => {
    if (!user || !user.id) {
      setError('Usuário não autenticado.');
      setLoading(false);
      setPedidosLista([]);
      return;
    }
    setLoading(true);
    setError(null);
    // Não resetar pedidoSelecionado aqui, pois o foco pode ser para voltar dos detalhes
    try {
      const response = await axios.get<
        PedidoHistorico[] | {success: false; message: string}
      >(`${API_HISTORICO_URL}?cliente_id=${user.id}`);
      if (Array.isArray(response.data)) {
        setPedidosLista(response.data);
      } else if (
        response.data &&
        (response.data as any).success === false &&
        (response.data as any).message
          ?.toLowerCase()
          .includes('nenhum pedido encontrado')
      ) {
        setPedidosLista([]);
      } else if (response.data && (response.data as any).success === false) {
        setError((response.data as any).message || 'Erro ao buscar pedidos.');
        setPedidosLista([]);
      } else {
        setError('Resposta inesperada da API.');
        setPedidosLista([]);
      }
    } catch (err) {
      console.error('Erro ao buscar histórico:', err);
      setError('Falha ao carregar histórico.');
      setPedidosLista([]);
    } finally {
      setLoading(false);
    }
  }, [user]); // Adicionado user como dependência

  useEffect(() => {
    // Recarregar a lista quando a tela recebe foco,
    // mas só se não houver um pedido selecionado (para não sair dos detalhes abruptamente)
    const unsubscribe = navigation.addListener('focus', () => {
      if (!pedidoSelecionado) {
        fetchHistoricoPedidos();
      }
    });

    // Chamada inicial se não houver pedido selecionado
    if (!pedidoSelecionado) {
      fetchHistoricoPedidos();
    }

    return unsubscribe;
  }, [navigation, fetchHistoricoPedidos, pedidoSelecionado]); // Adicionado fetchHistoricoPedidos e pedidoSelecionado

  const handleSelecionarPedido = (pedido: PedidoHistorico) => {
    setPedidoSelecionado(pedido);
  };

  const handleVoltarParaLista = () => {
    setPedidoSelecionado(null);
    // Opcional: Forçar recarregamento da lista ao voltar, se necessário
    // fetchHistoricoPedidos();
  };

  // Renderiza um item da lista de pedidos
  const renderPedidoItemDaLista = ({item}: {item: PedidoHistorico}) => (
    <TouchableOpacity
      style={stylesLista.pedidoCard}
      onPress={() => handleSelecionarPedido(item)}>
      <View style={stylesLista.pedidoHeader}>
        <Text style={stylesLista.pedidoNumero}>Pedido: {item.n_pedido}</Text>
        {/* Você pode querer a função getStatusStyle aqui também */}
        <Text
          style={[
            stylesLista.pedidoStatus /* , getStatusStyleLista(item.status) */,
          ]}>
          {item.status}
        </Text>
      </View>
      <Text style={stylesLista.pedidoData}>Data: {item.data_pedido}</Text>
      <Text style={stylesLista.pedidoTotal}>
        Total: R$ {item.total_geral_pedido.toFixed(2)}
      </Text>
    </TouchableOpacity>
  );

  if (loading && !pedidoSelecionado) {
    // Mostrar loading apenas para a lista
    return (
      <View style={stylesGeral.centered}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  if (error && !pedidoSelecionado) {
    // Mostrar erro apenas para a lista
    return (
      <View style={stylesGeral.centered}>
        <Text style={stylesGeral.errorText}>{error}</Text>
        <TouchableOpacity
          style={stylesGeral.retryButton}
          onPress={fetchHistoricoPedidos}>
          <Text style={stylesGeral.retryButtonText}>Tentar Novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Se um pedido está selecionado, mostra a view de detalhes
  if (pedidoSelecionado) {
    return (
      <DetalhesPedidoView
        pedido={pedidoSelecionado}
        onVoltar={handleVoltarParaLista}
      />
    );
  }

  // Se chegou aqui, mostra a lista de pedidos ou mensagem de lista vazia
  if (pedidosLista.length === 0 && !loading) {
    return (
      <SafeAreaView style={stylesGeral.containerBase}>
        <Text style={stylesGeral.title}>Meus Pedidos</Text>
        <View style={stylesGeral.centered}>
          <Text style={stylesGeral.feedbackText}>
            Nenhum pedido encontrado no seu histórico.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={stylesGeral.containerBase}>
      <Text style={stylesGeral.title}>Meus Pedidos</Text>
      <FlatList
        data={pedidosLista}
        renderItem={renderPedidoItemDaLista}
        keyExtractor={p => p.n_pedido}
        contentContainerStyle={stylesGeral.listContentContainer}
      />
    </SafeAreaView>
  );
}

// --- Estilos ---
const stylesGeral = StyleSheet.create({
  containerBase: {flex: 1, backgroundColor: '#f4f4f8'},
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
    color: '#333',
  },
  listContentContainer: {paddingHorizontal: 16, paddingBottom: 20},
  feedbackText: {fontSize: 16, color: '#555', textAlign: 'center'},
  errorText: {
    color: '#e74c3c',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 15,
  },
  retryButton: {
    backgroundColor: '#007bff',
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 20,
  },
  retryButtonText: {color: '#fff', fontSize: 16, fontWeight: 'bold'},
});

const stylesLista = StyleSheet.create({
  pedidoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  pedidoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  pedidoNumero: {fontSize: 17, fontWeight: '600', color: '#2c3e50'},
  pedidoStatus: {
    fontSize: 13,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    overflow: 'hidden',
    color: '#fff',
    backgroundColor: '#95a5a6' /* Default, pode ser dinâmico */,
  },
  pedidoData: {fontSize: 14, color: '#7f8c8d', marginBottom: 4},
  pedidoTotal: {fontSize: 16, fontWeight: 'bold', color: '#e67e22'},
});

const stylesDetalhes = StyleSheet.create({
  safeArea: {flex: 1, backgroundColor: '#f4f4f8'},
  container: {flex: 1},
  voltarHeader: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: '#f4f4f8',
  },
  voltarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  voltarButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#007bff',
    fontWeight: '600',
  },
  headerContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#007bff',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginBottom: 15,
    paddingTop: 10,
  },
  title: {fontSize: 26, fontWeight: 'bold', color: '#fff', textAlign: 'center'},
  pedidoNumero: {
    fontSize: 16,
    color: '#e0e0e0',
    textAlign: 'center',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  label: {fontSize: 16, color: '#555', fontWeight: '500'},
  value: {fontSize: 16, color: '#333', textAlign: 'right', flexShrink: 1},
  labelTotal: {fontSize: 18, color: '#555', fontWeight: 'bold'},
  valueTotal: {fontSize: 18, color: '#e67e22', fontWeight: 'bold'},
  statusBadge: {
    fontSize: 14,
    fontWeight: 'bold',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 15,
    overflow: 'hidden',
    textAlign: 'center',
  },
  itemContainer: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    alignItems: 'center',
  },
  itemImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
    marginRight: 15,
    backgroundColor: '#e0e0e0',
  },
  itemInfo: {flex: 1},
  itemName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  itemDetail: {fontSize: 14, color: '#7f8c8d', marginBottom: 3},
  itemSubtotal: {
    fontSize: 15,
    fontWeight: '500',
    color: '#34495e',
    marginTop: 4,
  },
  itemObservacao: {
    fontSize: 13,
    color: '#8e44ad',
    fontStyle: 'italic',
    marginTop: 5,
    backgroundColor: '#f9f0ff',
    padding: 5,
    borderRadius: 4,
  },
});
