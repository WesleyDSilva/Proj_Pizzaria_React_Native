<?php
// Headers
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: PUT, POST");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// DB Config
$servername = "wesley.mysql.dbaas.com.br";
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

// Get request data
$data = json_decode(file_get_contents("php://input"));

if (!isset($data->cliente_id) || !isset($data->forma_pagamento)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Campos obrigatórios: cliente_id e forma_pagamento."]);
    exit();
}

$cliente_id = (int)$data->cliente_id;
$forma_pagamento = $conn->real_escape_string(trim($data->forma_pagamento));
$troco_para = isset($data->troco_para) ? (float)$data->troco_para : null;

// Validar forma de pagamento
$formas_validas = ['PIX', 'Cartão', 'Dinheiro'];
if (!in_array($forma_pagamento, $formas_validas)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Forma de pagamento inválida. Use: PIX, Cartão ou Dinheiro."]);
    exit();
}

// Gerar número de pedido único
$n_pedido = "PED" . round(microtime(true) * 1000);

$stmt = $conn->prepare("
    UPDATE Pedidos 
    SET 
        forma_pagamento = ?,
        troco_para = ?,
        status = 'PREPARAÇÃO',
        data_pedido = NOW(),
        n_pedido = ?
    WHERE 
        cliente_id = ? AND status = 'PENDENTE'
");

if (!$stmt) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Prepare failed: " . $conn->error]);
    exit();
}

// Tipos: s = string, d = double, i = int
$stmt->bind_param("sdsi", $forma_pagamento, $troco_para, $n_pedido, $cliente_id);

if ($stmt->execute()) {
    $rows_affected = $stmt->affected_rows;
    http_response_code(200);
    echo json_encode([
        "success" => true,
        "message" => "Pedido confirmado.",
        "n_pedido" => $n_pedido,
        "itens_afetados" => $rows_affected
    ]);
} else {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Erro ao atualizar: " . $stmt->error]);
}

$stmt->close();
$conn->close();
?>
