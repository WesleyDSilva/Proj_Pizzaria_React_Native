<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Conectar ao banco de dados com MySQLi
$servername = "devweb3sql.mysql.dbaas.com.br";
$username = "devweb3sql";
$password = "h2023_FaTEC#$";
$dbname = "devweb3sql";

$conn = new mysqli($servername, $username, $password, $dbname);

// Verificar conexão
if ($conn->connect_error) {
    die(json_encode(array("success" => false, "message" => "Erro na conexão: " . $conn->connect_error)));
}

// Configurar o cabeçalho para JSON
header('Content-Type: application/json');

// Verificar se o método é GET
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (!isset($_GET['pizza_id']) || !isset($_GET['cliente_id'])) {
        echo json_encode(array("success" => false, "message" => "Parâmetros ausentes."));
        exit;
    }

    $pizza_id = intval($_GET['pizza_id']);
    $cliente_id = intval($_GET['cliente_id']);

    if ($pizza_id <= 0 || $cliente_id <= 0) {
        echo json_encode(array("success" => false, "message" => "IDs inválidos."));
        exit;
    }

    // Preparar a consulta SQL com prepared statement
    $sql = "DELETE FROM carrinho WHERE pizza_id = ? AND cliente_id = ?";
    $stmt = $conn->prepare($sql);

    if ($stmt) {
        $stmt->bind_param("ii", $pizza_id, $cliente_id);
        $stmt->execute();

        if ($stmt->affected_rows > 0) {
            echo json_encode(array("success" => true, "message" => "Pedido excluído com sucesso."));
        } else {
            echo json_encode(array("success" => false, "message" => "Pedido não encontrado."));
        }

        $stmt->close();
    } else {
        echo json_encode(array("success" => false, "message" => "Erro ao preparar a consulta: " . $conn->error));
    }
} else {
    echo json_encode(array("success" => false, "message" => "Método não permitido. Use GET."));
}

// Fechar conexão
$conn->close();
?>