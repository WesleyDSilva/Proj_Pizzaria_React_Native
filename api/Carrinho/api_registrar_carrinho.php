<?php
// Configuração do banco de dados
$host = 'wesley.mysql.dbaas.com.br'; // Endereço do servidor do banco de dados
$database = 'wesley'; // Nome do banco de dados
$username = 'wesley'; // Nome de usuário do banco de dados
$password = 'tI7u96pYDAv3I#'; // Senha do banco de dados

// Conexão com o banco de dados
$conexao = mysqli_connect($host, $username, $password, $database);

if (!$conexao) {
    echo json_encode(array('success' => false, 'message' => 'Erro ao conectar ao banco de dados.'));
    exit;
}

mysqli_set_charset($conexao, "utf8");

// Processar a requisição
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);

    // Validação de entrada - Corrigido para PHP 5.2
    $cliente_id = isset($data['cliente_id']) ? $data['cliente_id'] : null;
    $pizza_id = isset($data['pizza_id']) ? $data['pizza_id'] : null;
    $preco = isset($data['preco']) ? $data['preco'] : null;
    $nome_pizza = isset($data['nome_pizza']) ? $data['nome_pizza'] : null;
    $tipo_pizza = isset($data['tipo_pizza']) ? $data['tipo_pizza'] : 'inteira';


    if (!$cliente_id || !$pizza_id || !$preco || !$nome_pizza) {
        echo json_encode(array('success' => false, 'message' => 'Dados incompletos fornecidos.'));
        exit;
    }

    // Inserir no banco de dados
    $query = "INSERT INTO carrinho (cliente_id, pizza_id, preco, nome_pizza, tipo_pizza) VALUES (?, ?, ?, ?, ?)";
    $stmt = mysqli_prepare($conexao, $query);

    if ($stmt) {
        mysqli_stmt_bind_param($stmt, "iisss", $cliente_id, $pizza_id, $preco, $nome_pizza, $tipo_pizza);
        $result = mysqli_stmt_execute($stmt);

        if ($result) {
            echo json_encode(array('success' => true, 'message' => 'Pizza adicionada ao carrinho com sucesso.'));
        } else {
            echo json_encode(array('success' => false, 'message' => 'Erro ao adicionar ao carrinho.'));
        }

        mysqli_stmt_close($stmt);
    } else {
        echo json_encode(array('success' => false, 'message' => 'Erro ao preparar a consulta.'));
    }
} else {
    echo json_encode(array('success' => false, 'message' => 'Método inválido. Use POST.'));
}

// Fechar conexão
mysqli_close($conexao);
?>