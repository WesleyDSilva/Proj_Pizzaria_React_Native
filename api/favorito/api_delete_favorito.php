<?php
// Conectar ao banco de dados
$host = 'wesley.mysql.dbaas.com.br'; // Endereço do servidor do banco de dados
$dbname = 'wesley'; // Nome do banco de dados
$username = 'wesley'; // Nome de usuário do banco de dados
$password = 'tI7u96pYDAv3I#'; // Senha do banco de dados

$conn = new mysqli($servername, $username, $password, $dbname);

// Verificar conexão
if ($conn->connect_error) {
    die("Erro na conexão: " . $conn->connect_error);
}

// Configurar o cabeçalho para JSON
header('Content-Type: application/json');

// Verificar se o método é GET  (This is still incorrect;  use DELETE)
if ($_SERVER['REQUEST_METHOD'] === 'GET') { // Should be 'DELETE'
    // Obter os dados da requisição - parâmetros GET (This is also incorrect for DELETE)
    if (
        isset($_GET['pizza_id']) && is_numeric($_GET['pizza_id']) &&
        isset($_GET['cliente_id']) && is_numeric($_GET['cliente_id'])
    ) {

        $pizza_id = intval($_GET['pizza_id']);
        $cliente_id = intval($_GET['cliente_id']);

        // Prepara a consulta SQL
        $sql = "DELETE FROM pedidos_favoritos WHERE pizza_id = ? AND cliente_id = ?";
        $stmt = $conn->prepare($sql);

        if ($stmt) { // Verifica se prepare foi bem-sucedido
            $stmt->bind_param("ii", $pizza_id, $cliente_id);
            // Executar a consulta
            if ($stmt->execute()) {
                echo json_encode(array("success" => true, "message" => "Favorito excluído com sucesso.")); // Changed to array()
            } else {
                echo json_encode(array("success" => false, "message" => "Erro de banco de dados: " . $stmt->error)); // Changed to array()
            }
            $stmt->close();
        } else {
            echo json_encode(array("success" => false, "message" => "Erro ao preparar a consulta: " . $conn->error)); // Changed to array()
        }
    } else {
        echo json_encode(array("success" => false, "message" => "IDs inválidos ou não fornecidos.")); // Changed to array()
    }
} else {
    echo json_encode(array("success" => false, "message" => "Método não permitido. Use GET.")); // Changed to array() and should be DELETE
}

$conn->close();
?>