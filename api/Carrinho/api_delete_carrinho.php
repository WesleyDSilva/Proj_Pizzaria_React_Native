<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('log_errors', 1);
// Defina um caminho VÁLIDO para o log de erros, ex:
// ini_set('error_log', __DIR__ . '/api_delete_errors.log');

// Configurar o cabeçalho para JSON
header('Content-Type: application/json; charset=utf-8');

// Configuração do banco de dados
$host = 'wesley.mysql.dbaas.com.br';
$dbname = 'wesley';
$username = 'wesley';
$password = 'tI7u96pYDAv3I#';

$conn = new mysqli($host, $username, $password, $dbname);

if ($conn->connect_error) {
    http_response_code(500);
    error_log("Erro de conexão MySQLi: " . $conn->connect_error);
    die(json_encode(array("success" => false, "message" => "Erro interno do servidor (DB Connect).")));
}

if (!$conn->set_charset("utf8")) {
    error_log("Erro ao definir o charset para utf8: " . $conn->error);
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') { // Ou 'DELETE'

    // Verificar se os parâmetros produto_id e cliente_id foram fornecidos
    if (!isset($_GET['produto_id']) || !isset($_GET['cliente_id'])) {
        http_response_code(400);
        echo json_encode(array("success" => false, "message" => "Parâmetros produto_id e cliente_id são obrigatórios."));
        $conn->close();
        exit;
    }

    $produto_id_param = intval($_GET['produto_id']);
    $cliente_id_param = intval($_GET['cliente_id']);

    // Validação dos IDs
    if ($produto_id_param <= 0 || $cliente_id_param <= 0) {
        http_response_code(400);
        echo json_encode(array("success" => false, "message" => "IDs de produto e cliente inválidos."));
        $conn->close();
        exit;
    }

    $tabelaAlvo = 'Pedidos';
    $statusFixo = 'PENDENTE'; // Valor do status fixo

    // Preparar a consulta SQL para excluir o item da tabela Pedidos
    // A condição para 'status' agora usa o valor fixo '$statusFixo'
    // e é incluída como um terceiro placeholder.
    $sql = "DELETE FROM $tabelaAlvo WHERE produto_id = ? AND cliente_id = ? AND status = ?";
    $stmt = $conn->prepare($sql);

    if ($stmt) {
        // Vincular os parâmetros (produto_id, cliente_id, status_fixo)
        // "iis" significa: integer, integer, string
        if (!$stmt->bind_param("iis", $produto_id_param, $cliente_id_param, $statusFixo)) {
            http_response_code(500);
            error_log("Erro ao vincular parâmetros (delete $tabelaAlvo): " . $stmt->error);
            echo json_encode(array("success" => false, "message" => "Erro interno do servidor ao preparar a exclusão (bind)."));
            $stmt->close();
            $conn->close();
            exit;
        }

        if (!$stmt->execute()) {
            http_response_code(500);
            error_log("Erro ao executar exclusão (delete $tabelaAlvo): " . $stmt->error);
            echo json_encode(array("success" => false, "message" => "Erro interno do servidor ao executar a exclusão (execute)."));
            $stmt->close();
            $conn->close();
            exit;
        }

        if ($stmt->affected_rows > 0) {
            http_response_code(200);
            echo json_encode(array("success" => true, "message" => "Registro(s) com status '$statusFixo' da tabela $tabelaAlvo excluído(s) com sucesso. Linhas afetadas: " . $stmt->affected_rows));
        } else {
            http_response_code(404); // Not Found or condition not met
            echo json_encode(array("success" => false, "message" => "Nenhum registro com status '$statusFixo' correspondente encontrado na tabela $tabelaAlvo para produto_id=$produto_id_param, cliente_id=$cliente_id_param para exclusão."));
        }
        $stmt->close();
    } else {
        http_response_code(500);
        error_log("Erro ao preparar a consulta (delete $tabelaAlvo): " . $conn->error);
        echo json_encode(array("success" => false, "message" => "Erro interno do servidor ao preparar a consulta de exclusão (prepare)."));
    }
} else {
    http_response_code(405);
    echo json_encode(array("success" => false, "message" => "Método não permitido. Use GET."));
}

$conn->close();
?>