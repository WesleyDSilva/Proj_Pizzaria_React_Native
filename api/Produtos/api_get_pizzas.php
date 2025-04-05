<?php
header('Content-Type: application/json');

// Configurações do banco de dados
$host = 'wesley.mysql.dbaas.com.br'; // Endereço do servidor do banco de dados
$dbname = 'wesley'; // Nome do banco de dados
$username = 'wesley'; // Nome de usuário do banco de dados
$password = 'tI7u96pYDAv3I#'; // Senha do banco de dados

// Conectar ao banco de dados usando mysqli
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

// Query para buscar os dados
$query = "SELECT * FROM pizzas";

// Executar a consulta
$resultado = mysqli_query($conexao, $query);

// Verificar se houve resultados
if ($resultado && mysqli_num_rows($resultado) > 0) {
    // Inicializar um array para armazenar os resultados
    $usuarios = array();

    // Buscar os resultados um por um e adicionar ao array
    while ($row = mysqli_fetch_assoc($resultado)) {
        $usuarios[] = $row;
    }

    // Retornar os dados em formato JSON
    echo json_encode($usuarios);
} else {
    // Caso não haja registros, retorna uma mensagem
    echo json_encode(array(
        'error' => false,
        'message' => 'Nenhum registro encontrado.'
    ));
}

// Fechar a conexão
mysqli_close($conexao);
?>