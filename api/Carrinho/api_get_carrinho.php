<?php
// api_get_carrinho.php

// Configurações para exibir todos os erros (útil para depuração)
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Definir o cabeçalho como JSON e especificar UTF-8
header('Content-Type: application/json; charset=utf-8');
header("Access-Control-Allow-Origin: *"); // Permitir requisições de qualquer origem (CORS)
// Adicionar outros headers CORS se necessário para outros métodos ou headers customizados
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

// Lidar com requisições OPTIONS (preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Configurações do banco de dados
$host = 'wesley.mysql.dbaas.com.br';
$dbname = 'wesley';
$username = 'wesley';
$password = 'tI7u96pYDAv3I#';

// Tentar conectar ao banco de dados
$conexao = mysqli_connect($host, $username, $password, $dbname);

// Verificar se a conexão foi bem-sucedida
if (!$conexao) {
    http_response_code(500); // Internal Server Error
    echo json_encode(array(
        'success' => false, // Usar 'success' para consistência com outras APIs
        'message' => 'Erro de conexão com o banco de dados: ' . mysqli_connect_error()
    ));
    exit;
}

// Configurar o charset da conexão para UTF-8
if (!mysqli_set_charset($conexao, "utf8mb4")) {
    // Logar o erro, mas não necessariamente parar a execução se a query funcionar
    error_log("Erro ao definir charset para utf8mb4: " . mysqli_error($conexao));
}

// --- Lógica para Ler 'Pedidos' com JOIN em 'Produtos' FILTRADA por cliente_id e status ---

// Verificar se o ID do cliente foi passado via GET e se é numérico
if (isset($_GET['cliente_id']) && is_numeric($_GET['cliente_id'])) {
    $clienteId = (int) $_GET['cliente_id'];

    if ($clienteId <= 0) {
        http_response_code(400); // Bad Request
        echo json_encode(array('success' => false, 'message' => 'ID do cliente inválido.'));
        mysqli_close($conexao);
        exit;
    }

    $tabelaPedidos = 'Pedidos';
    $tabelaProdutos = 'Produtos';

    // Query SQL ATUALIZADA para incluir a quantidade e outros campos do produto
    $query = "SELECT
                ped.pedido_id AS id_item_pedido,
                ped.cliente_id,
                ped.produto_id AS produto_id_fk,      -- ID do produto na tabela Pedidos
                ped.tamanho AS tamanho_pedido,
                ped.tipo_tamanho AS tipo_tamanho_pedido,
                ped.total AS total_item_pedido,       -- Preço unitário do item neste pedido
                ped.quantidade AS quantidade,          -- << QUANTIDADE DO ITEM NO PEDIDO
                ped.status AS status_item_pedido,
                prod.produto_id AS produto_id,         -- ID real do produto da tabela Produtos
                prod.nome AS nome_produto,
                prod.ingredientes AS ingredientes_produto,
                prod.detalhes AS detalhes_produto,
                prod.caminho AS caminho_imagem_produto
              FROM
                $tabelaPedidos ped
              INNER JOIN
                $tabelaProdutos prod ON ped.produto_id = prod.produto_id -- Junção pelo FK
              WHERE
                ped.cliente_id = ? 
                AND ped.status = 'PENDENTE'
              ORDER BY
                ped.data_pedido DESC, ped.pedido_id"; // Ordem consistente

    $stmt = mysqli_prepare($conexao, $query);

    if ($stmt) {
        // Vincular o parâmetro cliente_id
        if (!mysqli_stmt_bind_param($stmt, "i", $clienteId)) {
            http_response_code(500);
            error_log("Erro mysqli_stmt_bind_param: " . mysqli_stmt_error($stmt));
            echo json_encode(array('success' => false, 'message' => 'Erro ao vincular parâmetros da consulta.'));
            mysqli_stmt_close($stmt);
            mysqli_close($conexao);
            exit;
        }

        if (mysqli_stmt_execute($stmt)) {
            // Vincular variáveis de resultado (A ORDEM DEVE CORRESPONDER EXATAMENTE AO SELECT)
            // SELECT:
            // 1. ped.pedido_id (i) -> $col_id_item_pedido
            // 2. ped.cliente_id (i) -> $col_cliente_id
            // 3. ped.produto_id (i) -> $col_produto_id_fk_pedido (ID do produto como está na tabela Pedidos)
            // 4. ped.tamanho (s) -> $col_tamanho_pedido
            // 5. ped.tipo_tamanho (s) -> $col_tipo_tamanho_pedido
            // 6. ped.total (d) -> $col_total_item_pedido (preço unitário)
            // 7. ped.quantidade (i) -> $col_quantidade  <<< NOVA VARIÁVEL
            // 8. ped.status (s) -> $col_status_item_pedido
            // 9. prod.produto_id (i) -> $col_produto_id (ID do produto da tabela Produtos)
            // 10. prod.nome (s) -> $col_nome_produto
            // 11. prod.ingredientes (s) -> $col_ingredientes_produto
            // 12. prod.detalhes (s) -> $col_detalhes_produto
            // 13. prod.caminho (s) -> $col_caminho_imagem_produto

            if (
                !mysqli_stmt_bind_result(
                    $stmt,
                    $col_id_item_pedido,
                    $col_cliente_id,
                    $col_produto_id_fk_pedido, // Renomeado para clareza
                    $col_tamanho_pedido,
                    $col_tipo_tamanho_pedido,
                    $col_total_item_pedido,    // Preço unitário
                    $col_quantidade,           // << NOVA VARIÁVEL PARA QUANTIDADE
                    $col_status_item_pedido,
                    $col_produto_id,           // ID do produto da tabela Produtos
                    $col_nome_produto,
                    $col_ingredientes_produto,
                    $col_detalhes_produto,
                    $col_caminho_imagem_produto
                )
            ) {
                http_response_code(500);
                error_log("Erro mysqli_stmt_bind_result: " . mysqli_stmt_error($stmt));
                echo json_encode(array('success' => false, 'message' => 'Erro ao vincular resultados da consulta.'));
                mysqli_stmt_close($stmt);
                mysqli_close($conexao);
                exit;
            }

            $itensPedido = array();
            while (mysqli_stmt_fetch($stmt)) {
                $row = array(
                    'id_item_pedido' => $col_id_item_pedido,
                    'cliente_id' => $col_cliente_id, // Pode ser útil no frontend, mas não essencial se já filtrado
                    'produto_id' => $col_produto_id, // Usar o produto_id da tabela Produtos
                    'tamanho_pedido' => $col_tamanho_pedido,
                    'tipo_tamanho_pedido' => $col_tipo_tamanho_pedido,
                    'total_item_pedido' => (float) $col_total_item_pedido, // Preço unitário
                    'quantidade' => (int) $col_quantidade,                // << QUANTIDADE ADICIONADA AO JSON
                    'nome_produto' => $col_nome_produto,
                    'ingredientes_produto' => $col_ingredientes_produto,
                    'detalhes_produto' => $col_detalhes_produto,
                    'caminho_imagem_produto' => $col_caminho_imagem_produto,
                    'status_item_pedido' => $col_status_item_pedido
                );
                $itensPedido[] = $row;
            }

            if (empty($itensPedido)) {
                // Retornar um array vazio e success:true se nenhum item for encontrado,
                // em vez de um erro, para que o frontend possa tratar "carrinho vazio".
                // Ou uma mensagem específica, mas um array vazio é mais padrão para listas.
                echo json_encode([]); // Ou: echo json_encode(['success' => true, 'message' => 'Nenhum item encontrado no carrinho para este cliente.', 'data' => []]);
            } else {
                echo json_encode($itensPedido);
            }

        } else {
            http_response_code(500);
            error_log("Erro mysqli_stmt_execute: " . mysqli_stmt_error($stmt));
            echo json_encode(array('success' => false, 'message' => 'Erro ao executar a consulta no banco de dados.'));
        }
        mysqli_stmt_close($stmt);
    } else {
        http_response_code(500);
        error_log("Erro mysqli_prepare: " . mysqli_error($conexao));
        echo json_encode(array('success' => false, 'message' => 'Erro ao preparar a consulta SQL.'));
    }
} else {
    http_response_code(400); // Bad Request
    echo json_encode(array('success' => false, 'message' => 'ID do cliente inválido ou ausente na requisição. Use o formato: ?cliente_id=NUMERO'));
}

mysqli_close($conexao);
?>