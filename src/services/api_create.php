<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

$host = 'devweb3sql.mysql.dbaas.com.br';
$dbname = 'devweb3sql';
$user = 'devweb3sql';
$pass = 'h2023_FaTEC#$';

try {
    // Conectar ao banco de dados
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $user, $pass);
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
            isset($data['senha'])
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
            $senha = $data['senha'];
           // $senha = md5($data['senha']); // Usando md5 para hashear a senha
            
            // Inserção na tabela com todos os campos obrigatórios e opcionais
            $stmt = $pdo->prepare("INSERT INTO cliente (nome, logradouro, cidade, UF, cep, complemento, numero_casa, email, telefone, senha) 
                                   VALUES (:nome, :logradouro, :cidade, :UF, :cep, :complemento, :numero_casa, :email, :telefone, :senha)");
            
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
            
            // Executa o comando e verifica o resultado
            if ($stmt->execute()) {
                echo json_encode(array("message" => "Usuário adicionado com sucesso."));
            } else {
                echo json_encode(array("message" => "Erro ao adicionar usuário."));
            }
        } else {
            echo json_encode(array("message" => "Todos os campos obrigatórios devem ser preenchidos."));
        }
    } else {
        echo json_encode(array("message" => "Método não permitido."));
    }
} catch (PDOException $e) {
    echo json_encode(array("error" => $e->getMessage()));
}
?>
