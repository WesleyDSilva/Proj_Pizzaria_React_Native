<?php

// Inclui o arquivo de conexão UMA VEZ. Se falhar, gera um erro fatal.
require_once 'banco_connect.php';

// --- Cabeçalhos ---
header("Access-Control-Allow-Origin: *"); // Permite acesso de qualquer origem (ajuste em produção!)
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// --- Verifica o Método HTTP ---
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405); // Método não permitido
    echo json_encode(["message" => "Método não permitido. Use GET."]);
    exit;
}

// --- Validação do Input ---
if (!isset($_GET['cliente_id']) || !filter_var($_GET['cliente_id'], FILTER_VALIDATE_INT) || (int) $_GET['cliente_id'] <= 0) {
    http_response_code(400); // Requisição Inválida
    echo json_encode(["message" => "ID do cliente ausente, inválido ou não positivo. Use ?cliente_id=NUMERO"]);
    exit;
}
$cliente_id = (int) $_GET['cliente_id'];

// --- Tenta obter a conexão do banco de dados ---
$conn = connectDatabase(); // Chama a função do arquivo incluído

// Verifica se a conexão foi estabelecida com sucesso
if (!$conn) {
    // Se connectDatabase() retornou false
    http_response_code(503); // Service Unavailable (não consegue conectar ao DB)
    echo json_encode(["message" => "Serviço indisponível. Não foi possível conectar ao banco de dados."]);
    exit;
}

// --- Consulta SQL ---
// !! Ajuste os nomes da tabela e das colunas conforme seu banco de dados !!
// Esta query assume que sua tabela armazena cada ITEM de pedido individualmente.
$query = "SELECT
            ip.id AS item_pedido_id, -- Alias para clareza
            ip.pedido_codigo,
            ip.cliente_id,
            ip.data_pedido,
            ip.valor_total_pedido,
            ip.status,
            ip.pizza_id,
            p.nome AS nome_pizza,    -- Busca o nome da pizza da tabela 'pizzas'
            p.descricao AS descricao_pizza, -- Busca a descrição
            p.caminho AS caminho_pizza, -- Busca o caminho da imagem
            ip.quantidade,
            ip.observacao
          FROM
            Pedidos ip         -- <<< AJUSTE O NOME DA TABELA DE ITENS AQUI
          LEFT JOIN
            pizzas p ON ip.pizza_id = p.id -- <<< AJUSTE O NOME DA TABELA DE PIZZAS E JOIN AQUI
          WHERE
            ip.cliente_id = :cliente_id
          ORDER BY
            ip.data_pedido DESC,
            ip.pedido_codigo DESC,
            ip.id ASC
         ";

// --- Preparar e Executar a Consulta ---
try {
    $stmt = $conn->prepare($query);
    // Vincula o valor de :cliente_id ao parâmetro $cliente_id como inteiro
    $stmt->bindParam(':cliente_id', $cliente_id, PDO::PARAM_INT);
    $stmt->execute();

    // --- Buscar Todos os Resultados como Array Associativo ---
    $pedidos = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Verifica se foram encontrados registros
    if ($pedidos) {
        // Converte tipos de dados se necessário (opcional, mas boa prática)
        foreach ($pedidos as &$item) { // &$item para modificar o array original
            $item['item_pedido_id'] = (int) $item['item_pedido_id'];
            $item['cliente_id'] = (int) $item['cliente_id'];
            $item['valor_total_pedido'] = (float) $item['valor_total_pedido'];
            $item['pizza_id'] = (int) $item['pizza_id'];
            $item['quantidade'] = (int) $item['quantidade'];
        }
        unset($item); // Desfaz a referência do último elemento

        // --- Retornar JSON ---
        http_response_code(200); // OK
        echo json_encode($pedidos); // Retorna o array de itens de pedido

    } else {
        // Nenhum pedido encontrado para este cliente
        http_response_code(404); // Não Encontrado
        echo json_encode([]); // Retorna um array vazio em vez de mensagem de erro
    }

} catch (PDOException $e) {
    http_response_code(500); // Erro Interno do Servidor
    // Logue o erro real, não exponha ao usuário
    error_log("Erro na Consulta SQL (Pedidos Cliente): " . $e->getMessage());
    echo json_encode(["message" => "Erro ao buscar os pedidos do cliente."]);
} finally {
    // Fecha a conexão (PDO geralmente fecha automaticamente, mas é boa prática)
    $conn = null;
}

?>