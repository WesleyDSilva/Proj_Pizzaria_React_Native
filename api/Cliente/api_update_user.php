<?php
// Configurações do banco de dados
$host = 'devweb3sql.mysql.dbaas.com.br'; // Substitua pelo endereço do seu servidor
$dbname = 'devweb3sql'; // Substitua pelo nome do seu banco de dados
$username = 'devweb3sql'; // Substitua pelo nome de usuário do banco
$password = 'h2023_FaTEC#$'; // Substitua pela senha do banco

// Definir cabeçalhos para JSON UTF-8
header('Content-Type: application/json; charset=utf-8');

try {
    // Conexão com o banco de dados usando PDO com charset utf8mb4
    $pdo = new PDO(
        "mysql:host=$host;dbname=$dbname;charset=utf8mb4",
        $username,
        $password,
        [
            PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4",
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
        ]
    );
} catch (PDOException $e) {
    die(json_encode(['success' => false, 'message' => 'Erro ao conectar ao banco de dados: ' . $e->getMessage()]));
}

// Verifica se os dados foram enviados via POST
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Captura os dados do corpo da requisição
    $input = json_decode(file_get_contents('php://input'), true);

    // Verifica se todos os campos obrigatórios foram fornecidos
    if (
        isset(
        $input['id'],
        $input['nome'],
        $input['logradouro'],
        $input['cidade'],
        $input['uf'],
        $input['cep'],
        $input['complemento'],
        $input['numeroCasa'],
        $input['email'],
        $input['telefone']
    )
    ) {
        // Base da consulta SQL
        $sql = "UPDATE cliente SET 
                    nome = :nome,
                    logradouro = :logradouro,
                    cidade = :cidade,
                    UF = :uf,
                    cep = :cep,
                    complemento = :complemento,
                    numero_casa = :numeroCasa,
                    email = :email,
                    telefone = :telefone";

        // Adiciona o campo de senha na consulta, se fornecido
        if (!empty($input['senha'])) {
            $sql .= ", senha = :senha";
        }

        $sql .= " WHERE id = :id";

        try {
            $stmt = $pdo->prepare($sql);

            // Cria um array com os parâmetros obrigatórios
            $params = [
                ':id' => $input['id'],
                ':nome' => $input['nome'],
                ':logradouro' => $input['logradouro'],
                ':cidade' => $input['cidade'],
                ':uf' => $input['uf'],
                ':cep' => $input['cep'],
                ':complemento' => $input['complemento'],
                ':numeroCasa' => $input['numeroCasa'],
                ':email' => $input['email'],
                ':telefone' => $input['telefone'],
            ];

            // Adiciona a senha nos parâmetros, se fornecida
            if (!empty($input['senha'])) {
                $params[':senha'] = $input['senha'];
            }

            // Executa a consulta com os dados fornecidos
            $stmt->execute($params);

            echo json_encode(['success' => true, 'message' => 'Usuário atualizado com sucesso.'], JSON_UNESCAPED_UNICODE);
        } catch (PDOException $e) {
            echo json_encode(['success' => false, 'message' => 'Erro ao atualizar o usuário: ' . $e->getMessage()], JSON_UNESCAPED_UNICODE);
        }
    } else {
        echo json_encode(['success' => false, 'message' => 'Dados insuficientes para atualizar o usuário.'], JSON_UNESCAPED_UNICODE);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Método de requisição inválido.'], JSON_UNESCAPED_UNICODE);
}
?>