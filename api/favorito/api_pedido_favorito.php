<?php
// Configuração do banco de dados
$host = 'wesley.mysql.dbaas.com.br'; // Endereço do servidor do banco de dados
$dbname = 'wesley'; // Nome do banco de dados
$username = 'wesley'; // Nome de usuário do banco de dados
$password = 'tI7u96pYDAv3I#'; // Senha do banco de dados

// Conexão com o banco de dados usando mysqli
$conexao = mysqli_connect($host, $username, $password, $dbname);
if (!$conexao) {
    echo json_encode(array(
        'error' => true,
        'message' => 'Erro de conexão: ' . mysqli_connect_error()
    ));
    exit;
}

mysqli_set_charset($conexao, "utf8"); // Configurar o charset para UTF-8

// Verificando o método da requisição
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Obtendo os dados enviados no corpo da requisição
    $inputData = json_decode(file_get_contents('php://input'), true);

    // Verificando se a chave 'pizzas' existe e se é um array
    if (isset($inputData['pizzas']) && is_array($inputData['pizzas'])) {
        // Extraindo o primeiro item do array 'pizzas'
        $pizza = $inputData['pizzas'][0];

        // Extraindo os valores para variáveis
        $cliente_id = isset($pizza['cliente_id']) ? intval($pizza['cliente_id']) : null;
        $pizza_id = isset($pizza['pizza_id']) ? intval($pizza['pizza_id']) : null;
        $nome_pizza = isset($pizza['nome_pizza']) ? $pizza['nome_pizza'] : null;
        $preco = isset($pizza['preco']) ? floatval($pizza['preco']) : null;

        // Validando se todos os campos obrigatórios foram preenchidos
        if ($cliente_id && $pizza_id && !is_null($nome_pizza) && !is_null($preco)) {
            // Montando a query SQL para inserção
            $query = "INSERT INTO pedidos_favoritos (cliente_id, pizza_id, nome_pizza, preco) VALUES (?, ?, ?, ?)";

            $stmt = mysqli_prepare($conexao, $query);

            if ($stmt) {
                // Associando os parâmetros corretamente com os tipos certos
                mysqli_stmt_bind_param($stmt, "iisd", $cliente_id, $pizza_id, $nome_pizza, $preco);
                $result = mysqli_stmt_execute($stmt);

                // Verificando se a execução foi bem-sucedida
                if ($result) {
                    $response = array(
                        "success" => true,
                        "message" => "Pedido favorito registrado com sucesso."
                    );
                } else {
                    $response = array(
                        "success" => false,
                        "message" => "Erro ao registrar o pedido favorito: " . mysqli_error($conexao)
                    );
                }

                // Fechando a declaração preparada
                mysqli_stmt_close($stmt);
            } else {
                $response = array(
                    "success" => false,
                    "message" => "Erro ao preparar a query: " . mysqli_error($conexao)
                );
            }
        } else {
            // Caso algum campo obrigatório não seja preenchido
            $response = array(
                "success" => false,
                "message" => "Campos obrigatórios não preenchidos."
            );
        }
    } else {
        // Caso a chave 'pizzas' não esteja presente ou não seja um array
        $response = array(
            "success" => false,
            "message" => "Dados de pizza não encontrados."
        );
    }

    // Retornando a resposta como JSON
    header('Content-Type: application/json');
    echo json_encode($response);
} else {
    // Caso o método da requisição não seja POST
    $response = array(
        "success" => false,
        "message" => "Método inválido. Use POST para registrar pedidos favoritos."
    );

    header('Content-Type: application/json');
    echo json_encode($response);
}

// Fechando a conexão com o banco de dados
mysqli_close($conexao);
?>