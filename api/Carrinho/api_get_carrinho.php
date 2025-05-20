<?php
// Configurações para exibir todos os erros (útil para depuração)
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Definir o cabeçalho como JSON e especificar UTF-8
header('Content-Type: application/json; charset=utf-8');
header("Access-Control-Allow-Origin: *"); // Permitir requisições de qualquer origem (CORS)

// Configurações do banco de dados
$host = 'wesley.mysql.dbaas.com.br';
$dbname = 'wesley';
$username = 'wesley';
$password = 'tI7u96pYDAv3I#';

// Tentar conectar ao banco de dados
$conexao = mysqli_connect($host, $username, $password, $dbname);

// Verificar se a conexão foi bem-sucedida
if (!$conexao) {
    http_response_code(500);
    echo json_encode(array(
        'error' => true,
        'message' => 'Erro de conexão com o banco de dados: ' . mysqli_connect_error()
    ));
    exit;
}

// Configurar o charset da conexão para UTF-8
mysqli_set_charset($conexao, "utf8mb4");

// --- Lógica para Ler 'Pedidos' com JOIN em 'Produtos' FILTRADA por cliente_id e status ---

// Verificar se o ID do cliente foi passado via GET e se é numérico
if (isset($_GET['cliente_id']) && is_numeric($_GET['cliente_id'])) {
    $clienteId = (int) $_GET['cliente_id'];

    $tabelaPedidos = 'Pedidos';
    $tabelaProdutos = 'Produtos';

    // ***** SUA NOVA QUERY ATUALIZADA *****
    $query = "SELECT
                ped.pedido_id AS id_item_pedido,
                ped.cliente_id,
                ped.tamanho AS tamanho_pedido,
                ped.tipo_tamanho AS tipo_tamanho_pedido,
                ped.total AS total_item_pedido, /* Renomeado para consistência */
                prod.produto_id AS produto_id, /* Alias para clareza no frontend */
                prod.nome AS nome_produto,
                prod.ingredientes AS ingredientes_produto,
                prod.detalhes AS detalhes_produto,
                prod.caminho AS caminho_imagem_produto, /* Alias para clareza no frontend */
                ped.status AS status_item_pedido /* Novo campo selecionado com alias */
              FROM
                $tabelaPedidos ped
              INNER JOIN
                $tabelaProdutos prod ON ped.produto_id = prod.produto_id
              WHERE
                ped.cliente_id = ? 
                AND ped.status = 'PENDENTE' /* FILTRANDO APENAS POR ITENS PENDENTES (CARRINHO) */
              ORDER BY
                ped.data_pedido DESC, ped.n_pedido, ped.pedido_id";

    $stmt = mysqli_prepare($conexao, $query);

    if ($stmt) {
        // Vincular o parâmetro cliente_id
        mysqli_stmt_bind_param($stmt, "i", $clienteId);

        if (mysqli_stmt_execute($stmt)) {
            // ***** VINCULAR VARIÁVEIS DE RESULTADO (A ORDEM DEVE CORRESPONDER AO SELECT) *****
            // id_item_pedido (i)
            // cliente_id (i)
            // tamanho_pedido (s)
            // tipo_tamanho_pedido (s)
            // total_item_pedido (d)
            // produto_id_api (i)
            // nome_produto (s)
            // ingredientes_produto (s)
            // detalhes_produto (s)
            // caminho_imagem_produto (s)
            // status_item_pedido (s) <--- NOVO
            mysqli_stmt_bind_result(
                $stmt,
                $col_id_item_pedido,
                $col_cliente_id,
                $col_tamanho_pedido,
                $col_tipo_tamanho_pedido,
                $col_total_item_pedido,
                $col_produto_id,
                $col_nome_produto,
                $col_ingredientes_produto,
                $col_detalhes_produto,
                $col_caminho_imagem_produto,
                $col_status_item_pedido // Nova variável para status
            );

            $itensPedido = array();
            while (mysqli_stmt_fetch($stmt)) {
                $row = array(
                    'id_item_pedido' => $col_id_item_pedido,
                    'cliente_id' => $col_cliente_id,
                    'produto_id' => $col_produto_id,
                    'tamanho_pedido' => $col_tamanho_pedido,
                    'tipo_tamanho_pedido' => $col_tipo_tamanho_pedido,
                    'total_item_pedido' => (float) $col_total_item_pedido,
                    'nome_produto' => $col_nome_produto,
                    'ingredientes_produto' => $col_ingredientes_produto,
                    'detalhes_produto' => $col_detalhes_produto,
                    'caminho_imagem_produto' => $col_caminho_imagem_produto,
                    'status_item_pedido' => $col_status_item_pedido // Adicionado ao resultado JSON
                );
                $itensPedido[] = $row;
            }

            echo json_encode($itensPedido);

        } else {
            http_response_code(500);
            echo json_encode(array(
                'error' => true,
                'message' => 'Erro ao executar a consulta: ' . mysqli_stmt_error($stmt)
            ));
        }
        mysqli_stmt_close($stmt);
    } else {
        http_response_code(500);
        echo json_encode(array(
            'error' => true,
            'message' => 'Erro ao preparar a consulta SQL: ' . mysqli_error($conexao)
        ));
    }
} else {
    http_response_code(400);
    echo json_encode(array(
        'error' => true,
        'message' => 'ID do cliente inválido ou ausente na requisição. Use ?cliente_id=NUMERO'
    ));
}

mysqli_close($conexao);
?>