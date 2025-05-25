<?php
// Headers
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Max-Age: 3600");

// DB Config
$servername = "wesley.mysql.dbaas.com.br";
$username = "wesley";
$password = "tI7u96pYDAv3I#";
$dbname = "wesley";

$conn = new mysqli($servername, $username, $password, $dbname);
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Erro de conexão com o banco: " . $conn->connect_error]);
    exit();
}
$conn->set_charset("utf8mb4");

// Coleta os parâmetros da query string
$cliente_id = isset($_GET['cliente_id']) ? (int)$_GET['cliente_id'] : null;
$n_pedido = isset($_GET['n_pedido']) ? $conn->real_escape_string($_GET['n_pedido']) : null;

if (!$cliente_id && !$n_pedido) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Informe cliente_id ou n_pedido na query string."]);
    exit();
}

// Montar query
if ($n_pedido) {
    $sql = "SELECT * FROM Pedidos WHERE n_pedido = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("s", $n_pedido);
} else {
    $sql = "SELECT * FROM Pedidos WHERE cliente_id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $cliente_id);
}

if (!$stmt) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Erro ao preparar consulta: " . $conn->error]);
    exit();
}

$stmt->execute();
$result = $stmt->get_result();

$pedidos = [];

while ($row = $result->fetch_assoc()) {
    $pedidos[] = [
        "pedido_id" => $row["pedido_id"],
        "n_pedido" => $row["n_pedido"],
        "cliente_id" => $row["cliente_id"],
        "data_pedido" => $row["data_pedido"],
        "total" => $row["total"],
        "produto_id" => $row["produto_id"],
        "quantidade" => $row["quantidade"],
        "obs" => $row["obs"],
        "forma_pagamento" => $row["forma_pagamento"],
        "troco_para" => $row["troco_para"],
        "status" => $row["status"],
        "tamanho" => $row["tamanho"],
        "tipo_tamanho" => $row["tipo_tamanho"]
    ];
}

$stmt->close();
$conn->close();

http_response_code(200);
echo json_encode($pedidos);
?>
