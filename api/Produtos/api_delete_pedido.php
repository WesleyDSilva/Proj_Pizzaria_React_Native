<?php
// Headers
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: DELETE");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Método precisa ser DELETE
if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    http_response_code(405); // Method Not Allowed
    echo json_encode(["success" => false, "message" => "Método não permitido. Use DELETE."]);
    exit();
}

// Parâmetro obrigatório: pedido_id
if (!isset($_GET['pedido_id']) || !is_numeric($_GET['pedido_id'])) {
    http_response_code(400); // Bad Request
    echo json_encode(["success" => false, "message" => "Parâmetro pedido_id é obrigatório e deve ser numérico."]);
    exit();
}

$pedido_id = (int) $_GET['pedido_id'];

// Conexão com banco
$servername = "wesley.mysql.dbaas.com.br";
$username = "wesley";
$password = "tI7u96pYDAv3I#";
$dbname = "wesley";

$conn = new mysqli($servername, $username, $password, $dbname);
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Erro na conexão com o banco: " . $conn->connect_error]);
    exit();
}
$conn->set_charset("utf8mb4");

// Verifica se o pedido existe
$check = $conn->prepare("SELECT pedido_id FROM Pedidos WHERE pedido_id = ?");
$check->bind_param("i", $pedido_id);
$check->execute();
$check_result = $check->get_result();

if ($check_result->num_rows === 0) {
    http_response_code(404); // Not Found
    echo json_encode(["success" => false, "message" => "Pedido não encontrado."]);
    $check->close();
    $conn->close();
    exit();
}
$check->close();

// Deletar pedido
$delete = $conn->prepare("DELETE FROM Pedidos WHERE pedido_id = ?");
$delete->bind_param("i", $pedido_id);

if ($delete->execute()) {
    http_response_code(200);
    echo json_encode(["success" => true, "message" => "Pedido deletado com sucesso."]);
} else {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Erro ao deletar o pedido: " . $delete->error]);
}

$delete->close();
$conn->close();
?>
