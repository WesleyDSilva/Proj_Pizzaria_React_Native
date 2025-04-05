<?php
header('Content-Type: application/json');

// Importando credenciais do banco
require_once __DIR__ . '/../db_config/config.php';

// Conectando com o banco
$conn = new mysqli($host, $username, $password, $dbname);

// Verificando conexão com o banco de dados
if ($conn->connect_error) {
    echo json_encode(array(
        'error' => true,
        'message' => 'Erro de conexão: ' . $conn->connect_error
    ));
    exit;
}

// Configurando charset
mysqli_set_charset($conn, "utf8");

// Verificando o método da requisição
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Obtendo o ID do cliente
    $cliente_id = isset($_GET['cliente_id']) ? intval($_GET['cliente_id']) : null;

    // Validando se o ID do cliente foi fornecido
    if ($cliente_id) {
        // Query SQL para buscar os pedidos do cliente
        $query = "
            SELECT
                pedido_id,
                n_pedido,
                cliente_id,
                data_pedido,
                total,
                funcionario_id,
                status,
                produto_id,
                quantidade,
                obs
            FROM Pedidos
            WHERE cliente_id = ?
            ORDER BY data_pedido DESC
        ";

        $stmt = $conn->prepare($query);

        if ($stmt) {
            // Associando o parâmetro
            $stmt->bind_param("i", $cliente_id);

            // Executando a query
            $stmt->execute();

            // Obtendo os resultados
            $result = $stmt->get_result();

            // Inicializando array para armazenar os pedidos
            $pedidos = array();

            // Iterando sobre os resultados
            while ($row = $result->fetch_assoc()) {
                $pedidos[] = $row;
            }

            // Fechando a declaração
            $stmt->close();

            // Retornando os dados em formato JSON
            echo json_encode($pedidos);
        } else {
            echo json_encode(array(
                'error' => true,
                'message' => 'Erro ao preparar a consulta: ' . $conn->error
            ));
        }
    } else {
        echo json_encode(array(
            'error' => true,
            'message' => 'ID do cliente não fornecido ou inválido.'
        ));
    }
} else {
    echo json_encode(array(
        'error' => true,
        'message' => 'Método não permitido. Use GET.'
    ));
}

// Fechando a conexão com o banco de dados
$conn->close();
?>