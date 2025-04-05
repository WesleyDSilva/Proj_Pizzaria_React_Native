<?php
header('Content-Type: application/json');

// Importando conexão com o Banco de Dados
require_once __DIR__ . '/../db_config/config.php';

try {
    // Conectando ao Banco de Dados
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // Recebendo os dados da requisição
        $data = json_decode(file_get_contents("php://input"), true);

        // Verificação de campos obrigatórios
        if (
            isset($data['nome']) &&
            isset($data['preco']) &&
            isset($data['tamanho']) &&
            isset($data['ingredientes']) &&
            isset($data['detalhes']) &&
            isset($data['categoria']) &&
            isset($data['caminho'])
        ) {
            // Atribuição dos valores das variáveis
            $nome = $data['nome'];
            $preco = $data['preco'];
            $tamanho = $data['tamanho']; // TRUE = Grande, FALSE = Pequeno
            $ingredientes = $data['ingredientes'];
            $detalhes = $data['detalhes'];
            $categoria = $data['categoria']; // Ex.: "Pizza", "Suco", "Sobremesa"
            $caminho = $data['caminho'];

            // Inserção na tabela Pizzas
            $stmt = $pdo->prepare("
                INSERT INTO Pizzas (nome, preco, tamanho, ingredientes, detalhes, categoria, caminho)
                VALUES (:nome, :preco, :tamanho, :ingredientes, :detalhes, :categoria, :caminho)
            ");

            // Binding dos parâmetros
            $stmt->bindParam(':nome', $nome);
            $stmt->bindParam(':preco', $preco);
            $stmt->bindParam(':tamanho', $tamanho);
            $stmt->bindParam(':ingredientes', $ingredientes);
            $stmt->bindParam(':detalhes', $detalhes);
            $stmt->bindParam(':categoria', $categoria);
            $stmt->bindParam(':caminho', $caminho);

            // Executando o comando e verificando os resultados
            if ($stmt->execute()) {
                echo json_encode(array("success" => true, "message" => "Pizza cadastrada com sucesso"));
            } else {
                echo json_encode(array("success" => false, "message" => "Erro ao cadastrar pizza!"));
            }
        } else {
            echo json_encode(array("success" => false, "message" => "Todos os campos obrigatórios devem ser preenchidos!"));
        }
    } else {
        echo json_encode(array("success" => false, "message" => "Método não permitido. Use POST."));
    }
} catch (PDOException $e) {
    echo json_encode(array("success" => false, "error" => $e->getMessage()));
}
?>