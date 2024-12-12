<?php
// Conectar ao banco de dados
$servername = "devweb3sql.mysql.dbaas.com.br";
$username = "devweb3sql";
$password = "h2023_FaTEC#$";
$dbname = "devweb3sql";

$conn = mysql_connect($servername, $username, $password);
if (!$conn) {
    die("Erro na conexão: " . mysql_error());
}
mysql_select_db($dbname, $conn);

// Configurar o cabeçalho para JSON
header('Content-Type: application/json');

// Verificar se o método é GET
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Obter os parâmetros enviados via GET
    if (isset($_GET['pizza_id']) && is_numeric($_GET['pizza_id']) &&
        isset($_GET['cliente_id']) && is_numeric($_GET['cliente_id'])) {

        $pizza_id = intval($_GET['pizza_id']);
        $cliente_id = intval($_GET['cliente_id']);

        // Prepara a consulta SQL
        $sql = sprintf(
            "DELETE FROM carrinho WHERE pizza_id = %d AND cliente_id = %d",
            $pizza_id,
            $cliente_id
        );

        // Executar a consulta
        $result = mysql_query($sql, $conn);

        if ($result) {
            if (mysql_affected_rows($conn) > 0) {
                echo json_encode(array("success" => true, "message" => "Pedido excluído com sucesso."));
            } else {
                echo json_encode(array("success" => false, "message" => "Pedido não encontrado."));
            }
        } else {
            echo json_encode(array("success" => false, "message" => "Erro de banco de dados: " . mysql_error()));
        }
    } else {
        echo json_encode(array("success" => false, "message" => "IDs inválidos ou não fornecidos."));
    }
} else {
    echo json_encode(array("success" => false, "message" => "Método não permitido. Use GET."));
}

// Fechar conexão
mysql_close($conn);
?>
