// src/types/navigation.ts

export interface ItemDetalhePedido {
  item_pedido_id: number;
  produto_id: number;
  nome_produto: string;
  ingredientes_produto: string;
  detalhes_produto: string;
  caminho_imagem_produto?: string;
  categoria_id_produto: number;
  quantidade: number;
  preco_unitario_no_pedido: number;
  subtotal_item: number;
  observacao_item: string | null;
  tamanho_item: string;
  tipo_tamanho_item: string;
}

export interface PedidoHistorico {
  n_pedido: string;
  cliente_id: number;
  data_pedido: string;
  forma_pagamento: string;
  status: string;
  total_geral_pedido: number;
  itens: ItemDetalhePedido[];
}

export type RootStackParamList = {
  Dashboard: undefined;
  Order: {finishOrder?: boolean} | undefined;
  Pedidos: undefined; // A tela de Pedidos agora lida com a exibição de detalhes internamente
  Detalhes: undefined; // Mantenha se você tiver outra tela chamada "Detalhes"
  // Se você tinha outras rotas aqui, mantenha-as
  AppTabs: NavigatorScreenParams<BottomTabParamList>; // Exemplo se BottomTabs for um aninhado
};

// Se você tipa seu BottomTabNavigator
import {NavigatorScreenParams} from '@react-navigation/native'; // Necessário para aninhar

export type BottomTabParamList = {
  feed: undefined;
  carrinho: undefined;
  pedidos: undefined; // A aba "pedidos" agora aponta para a tela PedidosScreen unificada
  user: undefined;
  favoritos: undefined; // ou 'new'
};
