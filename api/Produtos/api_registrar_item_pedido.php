<?php
// Headers
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// --- Configuração do Banco de Dados ---
$servername = "wesley.mysql.dbaas.com.br"; // ou seu host
$username = "wesley";
$password = "tI7u96pYDAv3I#";
$dbname = "wesley";

$conn = new mysqli($servername, $username, $password, $dbname);
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "DB Connect Error: " . $conn->connect_error]);
    exit();
}
$conn->set_charset("utf8mb4");

// --- Lógica da API ---
$data = json_decode(file_get_contents("php://input"));

// Validar dados recebidos ESSENCIAIS
if (
    !isset($data->cliente_id) ||
    !isset($data->pizza_id) ||          // Mapeia para produto_id
    !isset($data->preco) ||             // Mapeia para total
    !isset($data->tamanho_selecionado) || // Mapeia para tamanho (pequena, media, grande)
    !isset($data->tipo_pizza)           // Mapeia para tipo_tamanho (inteira, meia)
) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Dados incompletos. Campos obrigatórios: cliente_id, pizza_id, preco, tamanho_selecionado, tipo_pizza."]);
    exit();
}

// Atribuir variáveis a partir do input
$cliente_id_param = (int) $data->cliente_id;
$total_param = (float) $data->preco;        // 'preco' do input é o 'total' da tabela
$produto_id_param = (int) $data->pizza_id; // 'pizza_id' do input é o 'produto_id' da tabela
$tamanho_param = trim($conn->real_escape_string($data->tamanho_selecionado));
$tipo_tamanho_param = trim($conn->real_escape_string($data->tipo_pizza));

// SQL INSERT - Apenas as colunas especificadas
$sql = "INSERT INTO Pedidos (
            cliente_id,
            total,
            produto_id,
            tamanho,
            tipo_tamanho
        ) VALUES (?, ?, ?, ?, ?)";

$stmt = $conn->prepare($sql);

if ($stmt === false) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Query Prepare Error: " . $conn->error, "sql_error" => $conn->error]);
    $conn->close();
    exit();
}

// Vincular os parâmetros
// Tipos: i (integer), d (double), s (string)
// cliente_id (i)
// total (d)
// produto_id (i)
// tamanho (s)
// tipo_tamanho (s)
$stmt->bind_param(
    "idiss", // 5 tipos para 5 colunas
    $cliente_id_param,
    $total_param,
    $produto_id_param,
    $tamanho_param,
    $tipo_tamanho_param
);

if ($stmt->execute()) {
    $pedido_item_id = $stmt->insert_id; // Pega o pedido_id (auto_increment) do item inserido
    http_response_code(201); // 201 Created
    echo json_encode([
        "success" => true,
        "pedido_item_id" => $pedido_item_id
    ]);
} else {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Execute Error: " . $stmt->error, "stmt_error" => $stmt->error]);
}

$stmt->close();
$conn->close();
?>