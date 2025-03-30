<?php
// --- Detalhes da Conexão ---
$servername = "wesley.mysql.dbaas.com.br";
$username = "wesley";
$password = "tI7u96pYDAv3I#";
$dbname = "wesley";

// --- Headers ---
// Permitir acesso de qualquer origem (ajuste em produção se necessário)
header('Access-Control-Allow-Origin: *');
// Permitir métodos GET, OPTIONS (OPTIONS é necessário para preflight requests)
header('Access-Control-Allow-Methods: GET, OPTIONS');
// Permitir cabeçalhos comuns
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
// Definir o tipo de conteúdo da resposta como JSON
header('Content-Type: application/json');

// Responder a requisições OPTIONS (preflight) imediatamente
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// --- Conexão com o Banco de Dados usando mysqli ---
$conn = mysqli_connect($servername, $username, $password, $dbname);

// Verificar conexão
if (!$conn) {
    // Em produção, talvez não seja bom expor o erro exato do DB
    http_response_code(500); // Internal Server Error
    echo json_encode(array("success" => false, "message" => "Erro crítico na conexão com o banco de dados."));
    // Log do erro real no servidor: error_log("Erro de conexão MySQLi: " . mysqli_connect_error());
    exit;
}

// Definir o charset para UTF-8 (boa prática)
mysqli_set_charset($conn, "utf8mb4");

// --- Lógica da API ---

// Verificar se o método é GET
if ($_SERVER['REQUEST_METHOD'] === 'GET') {

    // Verificar se o parâmetro 'id' foi fornecido e é numérico
    if (isset($_GET['id']) && is_numeric($_GET['id'])) {

        $item_id = intval($_GET['id']); // Converte para inteiro para segurança básica

        // Preparar a consulta SQL usando Prepared Statements (MAIS SEGURO!)
        $sql = "DELETE FROM carrinho WHERE id = ?";
        $stmt = mysqli_prepare($conn, $sql);

        if ($stmt) {
            // Vincular o parâmetro (bind) - "i" significa que é um inteiro
            mysqli_stmt_bind_param($stmt, "i", $item_id);

            // Executar a consulta preparada
            if (mysqli_stmt_execute($stmt)) {
                // Verificar quantas linhas foram afetadas
                $affected_rows = mysqli_stmt_affected_rows($stmt);

                if ($affected_rows > 0) {
                    // Sucesso na exclusão
                    echo json_encode(array("success" => true, "message" => "Item excluído com sucesso."));
                } else {
                    // Nenhuma linha afetada (ID não encontrado)
                    echo json_encode(array("success" => false, "message" => "Item não encontrado no carrinho."));
                }
            } else {
                // Erro ao executar o statement
                http_response_code(500); // Erro interno do servidor
                echo json_encode(array("success" => false, "message" => "Erro ao executar a exclusão no banco de dados."));
                // Log do erro: error_log("Erro MySQLi stmt execute: " . mysqli_stmt_error($stmt));
            }

            // Fechar o statement
            mysqli_stmt_close($stmt);

        } else {
            // Erro ao preparar o statement
            http_response_code(500);
            echo json_encode(array("success" => false, "message" => "Erro ao preparar a consulta no banco de dados."));
            // Log do erro: error_log("Erro MySQLi prepare: " . mysqli_error($conn));
        }
    } else {
        // Parâmetro 'id' inválido ou não fornecido
        http_response_code(400); // Bad Request
        echo json_encode(array("success" => false, "message" => "ID do item inválido ou não fornecido na URL (ex: ?id=123)."));
    }
} else {
    // Método HTTP não permitido
    http_response_code(405); // Method Not Allowed
    echo json_encode(array("success" => false, "message" => "Método não permitido. Use GET."));
}

// Fechar a conexão com o banco de dados
mysqli_close($conn);
?>