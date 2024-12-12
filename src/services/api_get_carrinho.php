<?php
// Configurações para exibir todos os erros
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json');

// Configurações do banco de dados
$host = 'devweb3sql.mysql.dbaas.com.br';
$dbname = 'devweb3sql';
$username = 'devweb3sql';
$password = 'h2023_FaTEC#$';

$conexao = mysqli_connect($host, $username, $password, $dbname);

// Verificar se a conexão foi bem-sucedida
if (!$conexao) {
    echo json_encode(array(
        'error' => true,
        'message' => 'Erro de conexão: ' . mysqli_connect_error()
    ));
    exit;
}

mysqli_set_charset($conexao, "utf8"); // Configurar o charset para UTF-8

// Verificar se o ID do cliente foi passado
if (isset($_GET['cliente_id']) && is_numeric($_GET['cliente_id'])) {
    $clienteId = $_GET['cliente_id'];

    // Query para buscar os itens do carrinho do cliente
    $query = "SELECT c.id, c.preco, c.nome_pizza, c.tipo_pizza, c.pizza_id 
              FROM carrinho c
              WHERE c.cliente_id = $clienteId";

    // Executar a query
    $resultado = mysqli_query($conexao, $query);

    if ($resultado && mysqli_num_rows($resultado) > 0) {
        // Inicializar um array para armazenar os resultados
        $usuarios = array();

        // Buscar os resultados um por um e adicionar ao array
        while ($row = mysqli_fetch_assoc($resultado)) {
            $usuarios[] = $row;
        }

        // Retornar os dados em formato JSON  - REMOVE THE SECOND PARAMETER
        echo json_encode($usuarios); 
    } else {
        // Caso não haja registros, retorna uma mensagem
        echo json_encode(array(
            'error' => false,
            'message' => 'Nenhum item encontrado no carrinho para este cliente.'
        ));
    }
} else {
    // Caso o ID do cliente não seja válido
    echo json_encode(array(
        'error' => true,
        'message' => 'ID do cliente inválido ou ausente.'
    ));
}

// Fechar a conexão com o banco de dados
mysqli_close($conexao);
?>