<?php
header('Content-Type: application/json');

// Importando conexão com o Banco de Dados
require_once __DIR__ . '/../db_config/config.php';

try {
    // Conectando ao Banco de Dados
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // Recebendo os dados do corpo da requisição
        $data = json_decode(file_get_contents("php://input"), true);

        // Verificação de campos obrigatórios
        if (
            isset($data['nome']) &&
            isset($data['cargo']) &&
            isset($data['perfil']) &&
            isset($data['telefone'])
        ) {
            // Atribuição dos valores das variáveis
            $nome = $data['nome'];
            $cargo = $data['cargo'];
            $placa = $data['placa'] ?? null; // Placa é opcional
            $telefone = $data['telefone'];
            $perfil = $data['perfil'];

            // Inserção na tabela
            $stmt = $pdo->prepare("INSERT INTO Funcionarios (nome, cargo, placa, telefone, perfil)
                                  VALUES (:nome, :cargo, :placa, :telefone, :perfil)");

            // Binding dos parâmetros
            $stmt->bindParam(':nome', $nome);
            $stmt->bindParam(':cargo', $cargo);
            $stmt->bindParam(':placa', $placa);
            $stmt->bindParam(':telefone', $telefone);
            $stmt->bindParam(':perfil', $perfil);

            // Executando o comando e verificando os resultados
            if ($stmt->execute()) {
                echo json_encode(array("success" => true, "message" => "Funcionário cadastrado com sucesso"));
            } else {
                echo json_encode(array("success" => false, "message" => "Erro ao cadastrar funcionário!"));
            }
        } else {
            echo json_encode(array("success" => false, "message" => "Todos os campos obrigatórios devem ser preenchidos!"));
        }
    } else {
        echo json_encode(array("success" => false, "message" => "Método não permitido"));
    }
} catch (PDOException $e) {
    echo json_encode(array("success" => false, "error" => $e->getMessage()));
}
?>