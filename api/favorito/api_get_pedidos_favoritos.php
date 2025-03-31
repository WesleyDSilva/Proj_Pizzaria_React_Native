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
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Obtendo o ID do cliente
    $cliente_id = isset($_GET['cliente_id']) ? intval($_GET['cliente_id']) : null;

    // Validando se o cliente_id foi fornecido
    if ($cliente_id) {
        // Montando a query SQL para selecionar os pedidos favoritos do cliente com dados das pizzas
        $query = "SELECT 
                    pedidos_favoritos.id AS id_favorito,
                    pedidos_favoritos.cliente_id,
                    pizzas.id AS id_pizza,
                    pizzas.nome AS nome_pizza,
                    pizzas.descricao AS ingredientes,
                    pizzas.preco AS preco_unitario,
                    pedidos_favoritos.preco AS preco_total,
                    pizzas.caminho AS imagem
                  FROM pedidos_favoritos
                  JOIN pizzas ON pedidos_favoritos.pizza_id = pizzas.id
                  WHERE pedidos_favoritos.cliente_id = ?";

        $stmt = mysqli_prepare($conexao, $query);

        if ($stmt) {
            // Associando o parâmetro
            mysqli_stmt_bind_param($stmt, "i", $cliente_id);

            // Executando a query
            mysqli_stmt_execute($stmt);

            // Associando as variáveis para os resultados
            mysqli_stmt_bind_result(
                $stmt,
                $id_favorito,
                $cliente_id_result,
                $id_pizza,
                $nome_pizza,
                $ingredientes,
                $preco_unitario,
                $preco_total,
                $imagem
            );

            $favoritos = array();

            // Buscando os resultados
            while (mysqli_stmt_fetch($stmt)) {
                $favoritos[] = array(
                    'id_favorito' => $id_favorito,
                    'cliente_id' => $cliente_id_result,
                    'id_pizza' => $id_pizza,
                    'nome_pizza' => $nome_pizza,
                    'ingredientes' => $ingredientes,
                    'preco_unitario' => $preco_unitario,
                    'preco_total' => $preco_total,
                    'imagem' => $imagem
                );
            }

            // Se encontrou favoritos, retorna apenas os dados
            if (!empty($favoritos)) {
                echo json_encode($favoritos);
            } else {
                echo json_encode(array()); // Retorna um array vazio caso não haja favoritos
            }

            // Fechando a declaração preparada
            mysqli_stmt_close($stmt);
        } else {
            echo json_encode(array());
        }
    } else {
        echo json_encode(array()); // Retorna array vazio caso não tenha 'cliente_id'
    }
} else {
    echo json_encode(array()); // Retorna array vazio para método inválido
}

// Fechando a conexão com o banco de dados
mysqli_close($conexao);
?>