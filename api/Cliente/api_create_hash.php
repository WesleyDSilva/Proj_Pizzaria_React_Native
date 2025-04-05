<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

$host = 'wesley.mysql.dbaas.com.br'; // Endereço do servidor do banco de dados
$dbname = 'wesley'; // Nome do banco de dados
$username = 'wesley'; // Nome de usuário do banco de dados
$password = 'tI7u96pYDAv3I#'; // Senha do banco de dados

try {
    // Conectar ao banco de dados
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $data = json_decode(file_get_contents("php://input"), true);

        // Verificação de campos obrigatórios
        if (
            isset($data['nome']) &&
            isset($data['logradouro']) &&
            isset($data['cidade']) &&
            isset($data['UF']) &&
            isset($data['cep']) &&
            isset($data['numero_casa']) &&
            isset($data['email']) &&
            isset($data['telefone']) &&
            isset($data['senha']) &&
            isset($data['cpf'])
        ) {
            // Atribuição dos valores
            $nome = $data['nome'];
            $logradouro = $data['logradouro'];
            $cidade = $data['cidade'];
            $UF = $data['UF'];
            $cep = $data['cep'];
            $complemento = isset($data['complemento']) ? $data['complemento'] : null; // Campo opcional
            $numero_casa = $data['numero_casa'];
            $email = $data['email'];
            $telefone = $data['telefone'];
            $senha = password_hash($data['senha'], PASSWORD_BCRYPT); // Criptografando a senha
            $cpf = $data['cpf'];

            // Inserção na tabela com todos os campos obrigatórios e opcionais
            $stmt = $pdo->prepare("INSERT INTO cliente (nome, logradouro, cidade, UF, cep, complemento, numero_casa, email, telefone, senha, cpf) 
                                   VALUES (:nome, :logradouro, :cidade, :UF, :cep, :complemento, :numero_casa, :email, :telefone, :senha, :cpf)");

            // Binding dos parâmetros
            $stmt->bindParam(':nome', $nome);
            $stmt->bindParam(':logradouro', $logradouro);
            $stmt->bindParam(':cidade', $cidade);
            $stmt->bindParam(':UF', $UF);
            $stmt->bindParam(':cep', $cep);
            $stmt->bindParam(':complemento', $complemento);
            $stmt->bindParam(':numero_casa', $numero_casa);
            $stmt->bindParam(':email', $email);
            $stmt->bindParam(':telefone', $telefone);
            $stmt->bindParam(':senha', $senha);
            $stmt->bindParam(':cpf', $cpf);

            // Executa o comando e verifica o resultado
            if ($stmt->execute()) {
                echo json_encode(array("success" => true, "message" => "Usuário adicionado com sucesso."));
            } else {
                echo json_encode(array("success" => false, "message" => "Erro ao adicionar usuário."));
            }
        } else {
            echo json_encode(array("success" => false, "message" => "Todos os campos obrigatórios devem ser preenchidos."));
        }
    } else {
        echo json_encode(array("success" => false, "message" => "Método não permitido."));
    }
} catch (PDOException $e) {
    echo json_encode(array("success" => false, "error" => $e->getMessage()));
}
?>