<?php
// --- Configurações de Erro e Headers ---
error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('log_errors', 1);
// Defina um caminho VÁLIDO para o log de erros no seu servidor, ex:
// ini_set('error_log', __DIR__ . '/php_api_errors.log');

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, DELETE, OPTIONS'); // ADICIONADO DELETE
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// --- Detalhes da Conexão ---
$servername = "wesley.mysql.dbaas.com.br";
$username = "wesley";
$password = "tI7u96pYDAv3I#";
$dbname = "wesley";

$conn = mysqli_connect($servername, $username, $password, $dbname);

if (!$conn) {
    http_response_code(500);
    error_log("Erro de conexão MySQLi: " . mysqli_connect_error());
    echo json_encode(array("success" => false, "message" => "Erro crítico na conexão com o banco de dados."));
    exit;
}

if (!mysqli_set_charset($conn, "utf8mb4")) {
    error_log("Erro ao definir o charset para utf8mb4: " . mysqli_error($conn));
}

// --- Lógica da API ---

// ACEITAR GET OU DELETE para esta operação
if ($_SERVER['REQUEST_METHOD'] === 'GET' || $_SERVER['REQUEST_METHOD'] === 'DELETE') {

    // O parâmetro da URL será 'pedido_id', que corresponde à PK da tabela Pedidos
    if (isset($_GET['pedido_id']) && is_numeric($_GET['pedido_id'])) {

        $id_do_pedido_a_deletar = intval($_GET['pedido_id']);

        if ($id_do_pedido_a_deletar <= 0) {
            http_response_code(400);
            echo json_encode(array("success" => false, "message" => "pedido_id inválido."));
            mysqli_close($conn);
            exit;
        }

        $tabelaAlvo = "Pedidos"; // Tabela de onde o item será deletado

        // ***** QUERY CORRIGIDA *****
        // Deleta a linha da tabela Pedidos onde a chave primária 'pedido_id' corresponde ao valor fornecido
        $sql = "DELETE FROM $tabelaAlvo WHERE pedido_id = ?";

        $stmt = mysqli_prepare($conn, $sql);

        if ($stmt) {
            if (!mysqli_stmt_bind_param($stmt, "i", $id_do_pedido_a_deletar)) {
                http_response_code(500);
                error_log("Erro ao vincular parâmetros (delete $tabelaAlvo): " . mysqli_stmt_error($stmt));
                echo json_encode(array("success" => false, "message" => "Erro interno ao preparar a exclusão (bind)."));
                mysqli_stmt_close($stmt);
                mysqli_close($conn);
                exit;
            }

            if (mysqli_stmt_execute($stmt)) {
                $affected_rows = mysqli_stmt_affected_rows($stmt);
                if ($affected_rows > 0) {
                    http_response_code(200);
                    echo json_encode(array("success" => true, "message" => "Item do pedido excluído com sucesso."));
                } else {
                    http_response_code(200); // ou 404 se preferir para "não encontrado"
                    echo json_encode(array("success" => false, "message" => "Item do pedido não encontrado para exclusão (ID: $id_do_pedido_a_deletar) ou já removido."));
                }
            } else {
                http_response_code(500);
                error_log("Erro MySQLi stmt execute (delete $tabelaAlvo): " . mysqli_stmt_error($stmt));
                echo json_encode(array("success" => false, "message" => "Erro ao executar a exclusão no banco de dados."));
            }
            mysqli_stmt_close($stmt);
        } else {
            http_response_code(500);
            error_log("Erro MySQLi prepare (delete $tabelaAlvo): " . mysqli_error($conn));
            echo json_encode(array("success" => false, "message" => "Erro ao preparar a consulta no banco de dados."));
        }
    } else {
        http_response_code(400);
        echo json_encode(array("success" => false, "message" => "Parâmetro 'pedido_id' inválido ou não fornecido."));
    }
} else {
    http_response_code(405);
    echo json_encode(array("success" => false, "message" => "Método não permitido. Use GET ou DELETE."));
}

mysqli_close($conn);
?>