// types.ts
export interface CarrinhoItem {
    id: number;
    cliente_id?: number;  // cliente_id é opcional
    pizza_id: number;
    preco: number;
    nome_pizza: string;
    tipo_pizza: string;
  }
  