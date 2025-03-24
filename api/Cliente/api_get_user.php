<?php
// Configurações para exibir todos os erros
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json');

// Configurações do banco de dados
$host = 'devweb3sql.mysql.dbaas.com.br'; // Endereço do servidor do banco de dados
$dbname = 'devweb3sql'; // Nome do banco de dados
$username = 'devweb3sql'; // Nome de usuário do banco de dados
$password = 'h2023_FaTEC#$'; // Senha do banco de dados

try {
    // Conectar ao banco de dados usando PDO
    $dsn = "mysql:host=$host;dbname=$dbname;charset=utf8";
    $pdo = new PDO($dsn, $username, $password);

    // Configurar o PDO para lançar exceções em caso de erro
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Verificar se o ID foi passado como parâmetro GET
    if (isset($_GET['id']) && is_numeric($_GET['id'])) {
        $userId = $_GET['id'];

        // Query para buscar os dados do usuário específico
        $query = "SELECT id, nome, logradouro, cidade, UF, cep, complemento, numero_casa, email, telefone,cpf 
                  FROM cliente 
                  WHERE id = :id";

        $stmt = $pdo->prepare($query);  // Prepara a query
        $stmt->bindParam(':id', $userId, PDO::PARAM_INT); // Vincula o parâmetro id
        $stmt->execute();  // Executa a consulta

        // Obter o resultado
        $usuario = $stmt->fetch(PDO::FETCH_ASSOC);

        // Verificar se o usuário foi encontrado
        if ($usuario) {
            echo json_encode($usuario);  // Retorna os dados do usuário
        } else {
            echo json_encode(array(
                'error' => false,
                'message' => 'Usuário não encontrado.'
            ));
        }
    } else {
        echo json_encode(array(
            'error' => true,
            'message' => 'ID inválido ou ausente.'
        ));
    }
} catch (PDOException $e) {
    // Se houver um erro na conexão ou na execução da consulta, captura o erro
    echo json_encode(array(
        'error' => true,
        'message' => 'Erro no banco de dados: ' . $e->getMessage()
    ));
}
?>