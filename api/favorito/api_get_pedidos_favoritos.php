<?php
// Configurações para exibir todos os erros (útil para depuração)
ini_set('display_errors', 1); // Mostra erros na tela (cuidado em produção)
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
ini_set('log_errors', 1); // Habilita log de erros
ini_set('error_log', '/path/to/your/php-error.log'); // <<< IMPORTANTE: Defina um caminho VÁLIDO >>>

// Definir o cabeçalho como JSON e especificar UTF-8
header('Content-Type: application/json; charset=utf-8');

// Configuração do banco de dados
$host = 'wesley.mysql.dbaas.com.br';
$dbname = 'wesley';
$username = 'wesley';
$password = 'tI7u96pYDAv3I#';

// Conexão com o banco de dados usando mysqli
$conexao = mysqli_connect($host, $username, $password, $dbname);
if (!$conexao) {
    http_response_code(500);
    error_log("Erro de conexão mysqli: " . mysqli_connect_error());
    echo json_encode(array(
        'error' => true,
        'message' => 'Erro interno do servidor (conexão DB).'
    ));
    exit;
}

mysqli_set_charset($conexao, "utf8");

if ($_SERVER['REQUEST_METHOD'] === 'GET') {

    if (!isset($_GET['cliente_id']) || !is_numeric($_GET['cliente_id'])) {
        http_response_code(400);
        echo json_encode(array(
            'error' => true,
            'message' => 'Parâmetro cliente_id ausente ou inválido.'
        ));
        mysqli_close($conexao);
        exit;
    }
    $cliente_id = intval($_GET['cliente_id']);
    error_log("API chamada para cliente_id: " . $cliente_id);

    // ***** QUERY CORRIGIDA PARA USAR p.produto_id *****
    $query = "SELECT
                pf.id AS id_favorito,
                pf.cliente_id,
                p.produto_id AS id_pizza,      -- <<< CORRIGIDO AQUI
                p.nome AS nome_pizza,
                p.ingredientes AS ingredientes,
                p.caminho AS imagem
              FROM pedidos_favoritos pf
              JOIN Produtos p ON pf.pizza_id = p.produto_id -- <<< CORRIGIDO AQUI
              WHERE pf.cliente_id = ?";

    $stmt = mysqli_prepare($conexao, $query);

    if ($stmt) {
        if (!mysqli_stmt_bind_param($stmt, "i", $cliente_id)) {
            http_response_code(500);
            error_log("Erro ao vincular parâmetro: " . mysqli_stmt_error($stmt));
            echo json_encode(array('error' => true, 'message' => 'Erro interno do servidor (bind param).'));
            mysqli_stmt_close($stmt);
            mysqli_close($conexao);
            exit;
        }

        if (!mysqli_stmt_execute($stmt)) {
            http_response_code(500);
            error_log("Erro ao executar statement: " . mysqli_stmt_error($stmt));
            echo json_encode(array('error' => true, 'message' => 'Erro interno do servidor (execute).'));
            mysqli_stmt_close($stmt);
            mysqli_close($conexao);
            exit;
        }

        // Vincular variáveis (a ordem e quantidade devem corresponder ao SELECT)
        mysqli_stmt_bind_result(
            $stmt,
            $id_favorito,
            $cliente_id_result,
            $id_pizza, // Receberá o valor de p.produto_id
            $nome_pizza,
            $ingredientes,

            $imagem
        );

        $favoritos = array();
        while (mysqli_stmt_fetch($stmt)) {
            $favoritos[] = array(
                'id_favorito' => $id_favorito,
                'cliente_id' => $cliente_id_result,
                'id_pizza' => $id_pizza, // ID do produto
                'nome_pizza' => $nome_pizza,
                'ingredientes' => $ingredientes,

                'imagem' => $imagem
            );
        }

        error_log("Número de favoritos encontrados para cliente_id " . $cliente_id . ": " . count($favoritos));
        echo json_encode($favoritos);
        mysqli_stmt_close($stmt);

    } else {
        http_response_code(500);
        error_log("Erro ao preparar statement: " . mysqli_error($conexao));
        echo json_encode(array('error' => true, 'message' => 'Erro interno do servidor (prepare statement).'));
    }

} else {
    http_response_code(405);
    echo json_encode(array('error' => true, 'message' => 'Método não permitido. Use GET.'));
}

mysqli_close($conexao);
?>