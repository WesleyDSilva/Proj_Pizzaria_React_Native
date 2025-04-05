<?php
header('Content-Type: application/json');

// Importando conexão com o Banco de Dados
require_once __DIR__ . '/../db_config/config.php';

$conn = new mysqli($host, $username, $password, $dbname);

// Verificando conexão
if ($conn->connect_error) {
    die(json_encode(array("success" => false, "message" => "Erro na conexão: " . $conn->connect_error)));
}

if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    // Obtendo os dados da requisição
    $data = json_decode(file_get_contents("php://input"), true);

    // Verificando se o ID do produto foi fornecido e é válido
    if (isset($data['produto_id']) && is_numeric($data['produto_id'])) {
        $produto_id = intval($data['produto_id']);

        // Preparando a consulta SQL
        $sql = "DELETE FROM Pizzas WHERE produto_id = ?";
        $stmt = $conn->prepare($sql);

        // Verifica se a consulta foi preparada corretamente
        if ($stmt) {
            $stmt->bind_param("i", $produto_id);

            // Executando a consulta
            if ($stmt->execute()) {
                // Verifica se algum registro foi afetado
                if ($stmt->affected_rows > 0) {
                    echo json_encode(array("success" => true, "message" => "Pizza excluída com sucesso."));
                } else {
                    echo json_encode(array("success" => false, "message" => "Nenhuma pizza encontrada com o ID fornecido."));
                }
            } else {
                echo json_encode(array("success" => false, "message" => "Erro de banco de dados: " . $stmt->error));
            }
            $stmt->close();
        } else {
            echo json_encode(array("success" => false, "message" => "Erro ao preparar a consulta: " . $conn->error));
        }
    } else {
        echo json_encode(array("success" => false, "message" => "ID inválido ou não fornecido."));
    }
} else {
    echo json_encode(array("success" => false, "message" => "Método não permitido. Use DELETE."));
}

// Fechando a conexão
$conn->close();
?>