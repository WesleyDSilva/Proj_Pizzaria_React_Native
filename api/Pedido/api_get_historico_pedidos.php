<?php
// api_get_historico_pedidos.php (SEM AUTENTICAÇÃO - APENAS PARA TESTE)
// Retorna o array de pedidos diretamente em caso de sucesso com dados.

// session_start(); // Comentado

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");

// DB Config
$servername = "wesley.mysql.dbaas.com.br";
$username = "wesley";
$password = "tI7u96pYDAv3I#";
$dbname = "wesley";

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    http_response_code(503);
    // Para erros, manteremos a estrutura com 'success' e 'message'
    echo json_encode(["success" => false, "message" => "Erro de conexão com o banco de dados: " . $conn->connect_error]);
    exit();
}
$conn->set_charset("utf8mb4");

if (!isset($_GET['cliente_id']) || !is_numeric($_GET['cliente_id'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Parâmetro GET "cliente_id" (numérico) é obrigatório.']);
    exit;
}
$cliente_id_param = (int) $_GET['cliente_id'];

$sql = "SELECT 
            ped.pedido_id, ped.n_pedido, ped.cliente_id,
            DATE_FORMAT(ped.data_pedido, '%d/%m/%Y %H:%i') as data_pedido_formatada,
            ped.total AS preco_item_pedido, ped.funcionario_id, ped.produto_id,
            ped.quantidade, ped.obs, ped.forma_pagamento, ped.status,
            ped.tamanho, ped.tipo_tamanho,
            prod.nome AS nome_produto, prod.ingredientes AS ingredientes_produto,
            prod.detalhes AS detalhes_produto, prod.caminho AS caminho_imagem_produto,
            prod.categoria_id AS categoria_id_produto
        FROM 
            Pedidos ped
        LEFT JOIN 
            Produtos prod ON ped.produto_id = prod.produto_id
        WHERE 
            ped.cliente_id = ? 
            AND ped.status != 'PENDENTE'
        ORDER BY 
            ped.data_pedido DESC, ped.n_pedido DESC, ped.pedido_id ASC";

$stmt = $conn->prepare($sql);

if (!$stmt) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Erro ao preparar a query: " . $conn->error, "sql_error" => $conn->errno . " - " . $conn->error]);
    exit();
}

$stmt->bind_param("i", $cliente_id_param);

if (!$stmt->execute()) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Erro ao executar a query: " . $stmt->error, "sql_error" => $stmt->errno . " - " . $stmt->error]);
    $stmt->close();
    $conn->close();
    exit();
}

$stmt->store_result();
$pedidos_agrupados = [];

if ($stmt->num_rows > 0) {
    // Variáveis para bind_result
    $r_pedido_id = null;
    $r_n_pedido = null;
    $r_cliente_id = null;
    $r_data_pedido_formatada = null;
    $r_preco_item_pedido = null;
    $r_funcionario_id = null;
    $r_produto_id = null;
    $r_quantidade = null;
    $r_obs = null;
    $r_forma_pagamento = null;
    $r_status = null;
    $r_tamanho = null;
    $r_tipo_tamanho = null;
    $r_nome_produto = null;
    $r_ingredientes_produto = null;
    $r_detalhes_produto = null;
    $r_caminho_imagem_produto = null;
    $r_categoria_id_produto = null;

    $stmt->bind_result(
        $r_pedido_id,
        $r_n_pedido,
        $r_cliente_id,
        $r_data_pedido_formatada,
        $r_preco_item_pedido,
        $r_funcionario_id,
        $r_produto_id,
        $r_quantidade,
        $r_obs,
        $r_forma_pagamento,
        $r_status,
        $r_tamanho,
        $r_tipo_tamanho,
        $r_nome_produto,
        $r_ingredientes_produto,
        $r_detalhes_produto,
        $r_caminho_imagem_produto,
        $r_categoria_id_produto
    );

    while ($stmt->fetch()) {
        $row = [
            'pedido_id' => $r_pedido_id,
            'n_pedido' => $r_n_pedido,
            'cliente_id' => $r_cliente_id,
            'data_pedido_formatada' => $r_data_pedido_formatada,
            'preco_item_pedido' => $r_preco_item_pedido,
            'funcionario_id' => $r_funcionario_id,
            'produto_id' => $r_produto_id,
            'quantidade' => $r_quantidade,
            'obs' => $r_obs,
            'forma_pagamento' => $r_forma_pagamento,
            'status' => $r_status,
            'tamanho' => $r_tamanho,
            'tipo_tamanho' => $r_tipo_tamanho,
            'nome_produto' => $r_nome_produto,
            'ingredientes_produto' => $r_ingredientes_produto,
            'detalhes_produto' => $r_detalhes_produto,
            'caminho_imagem_produto' => $r_caminho_imagem_produto,
            'categoria_id_produto' => $r_categoria_id_produto
        ];

        $n_pedido_atual = $row['n_pedido'];
        if (!isset($pedidos_agrupados[$n_pedido_atual])) {
            $pedidos_agrupados[$n_pedido_atual] = [
                'n_pedido' => $n_pedido_atual,
                'cliente_id' => $row['cliente_id'],
                'data_pedido' => $row['data_pedido_formatada'],
                'forma_pagamento' => $row['forma_pagamento'],
                'status' => $row['status'],
                'total_geral_pedido' => 0,
                'itens' => []
            ];
        }

        $precoItemNoPedido = (float) $row['preco_item_pedido'];
        $quantidadeItem = (int) $row['quantidade'];
        $subtotalItem = $precoItemNoPedido * $quantidadeItem;

        $item = [
            'item_pedido_id' => $row['pedido_id'],
            'produto_id' => $row['produto_id'],
            'nome_produto' => $row['nome_produto'] ?: 'N/A',
            'ingredientes_produto' => $row['ingredientes_produto'],
            'detalhes_produto' => $row['detalhes_produto'],
            'caminho_imagem_produto' => $row['caminho_imagem_produto'],
            'categoria_id_produto' => $row['categoria_id_produto'],
            'quantidade' => $quantidadeItem,
            'preco_unitario_no_pedido' => $precoItemNoPedido,
            'subtotal_item' => $subtotalItem,
            'observacao_item' => $row['obs'],
            'tamanho_item' => $row['tamanho'],
            'tipo_tamanho_item' => $row['tipo_tamanho']
        ];
        $pedidos_agrupados[$n_pedido_atual]['itens'][] = $item;
        $pedidos_agrupados[$n_pedido_atual]['total_geral_pedido'] += $subtotalItem;
    }

    foreach ($pedidos_agrupados as $key => $pedido) {
        $pedidos_agrupados[$key]['total_geral_pedido'] = (float) number_format($pedido['total_geral_pedido'], 2, '.', '');
    }

    http_response_code(200);
    // ****** ALTERAÇÃO AQUI: Retorna diretamente o array de pedidos ******
    echo json_encode(array_values($pedidos_agrupados));

} else {
    http_response_code(200);
    // ****** ALTERAÇÃO AQUI: Retorna um array vazio em caso de nenhum pedido ******
    echo json_encode([]);
}

$stmt->close();
$conn->close();
?>