<?php
// Configuração do banco de dados
$host = "devweb3sql.mysql.dbaas.com.br";
$username = "devweb3sql";
$password = "h2023_FaTEC#$";
$database = "devweb3sql"; // Substitua pelo nome do seu banco de dados

// Conexão com o banco de dados usando mysqli
$conexao = mysqli_connect($host, $username, $password, $database);
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
        // Montando a query SQL para selecionar os pedidos favoritos do cliente
        $query = "SELECT cliente_id, pizza_id, nome_pizza, preco FROM pedidos_favoritos WHERE cliente_id = ?";

        $stmt = mysqli_prepare($conexao, $query);

        if ($stmt) {
            // Associando o parâmetro
            mysqli_stmt_bind_param($stmt, "i", $cliente_id);

            // Executando a query
            mysqli_stmt_execute($stmt);

            // Associando as variáveis para os resultados
            mysqli_stmt_bind_result($stmt, $cliente_id_result, $pizza_id_result, $nome_pizza_result, $preco_result);

            $favoritos = array();

            // Buscando os resultados
            while (mysqli_stmt_fetch($stmt)) {
                $favoritos[] = array(
                    'cliente_id' => $cliente_id_result,
                    'pizza_id' => $pizza_id_result,
                    'nome_pizza' => $nome_pizza_result,
                    'preco' => $preco_result
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
