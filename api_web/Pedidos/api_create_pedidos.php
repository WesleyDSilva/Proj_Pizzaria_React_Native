<?php
header('Content-Type: application/json');

// Importando conexão com o Banco de Dados
require_once __DIR__ . '/../db_config/config.php';

try {
    // Conectando ao Banco de Dados
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $data = json_decode(file_get_contents("php://input"), true);

        // Verificação de campos obrigatórios
        if (
            isset($data['cliente_id']) &&
            isset($data['funcionario_id']) &&
            isset($data['status'])
        ) {
            // Atribuição dos valores das variáveis
            $cliente_id = $data['cliente_id'];
            $funcionario_id = $data['funcionario_id'];
            $status = $data['status'];

            // Início da transação
            $pdo->beginTransaction();

            try {
                // Obter os itens do carrinho do cliente
                $stmt_carrinho = $pdo->prepare("SELECT * FROM carrinho WHERE cliente_id = :cliente_id");
                $stmt_carrinho->bindParam(':cliente_id', $cliente_id);
                $stmt_carrinho->execute();
                $itens_carrinho = $stmt_carrinho->fetchAll(PDO::FETCH_ASSOC);

                if (empty($itens_carrinho)) {
                    throw new Exception("O carrinho do cliente está vazio.");
                }

                // Gerar um número único para o pedido
                $n_pedido = "PED" . time(); // Exemplo: PED1698765432

                // Calcular o total do pedido
                $total = 0;
                foreach ($itens_carrinho as $item) {
                    $total += $item['preco'];
                }

                // Inserir os itens do carrinho na tabela Pedidos
                $stmt_pedido = $pdo->prepare("
                    INSERT INTO Pedidos
                    (n_pedido, cliente_id, data_pedido, total, funcionario_id, status, produto_id, quantidade, obs)
                    VALUES (:n_pedido, :cliente_id, NOW(), :total, :funcionario_id, :status, :produto_id, 1, :obs)
                ");

                foreach ($itens_carrinho as $item) {
                    $stmt_pedido->bindParam(':n_pedido', $n_pedido);
                    $stmt_pedido->bindParam(':cliente_id', $cliente_id);
                    $stmt_pedido->bindParam(':total', $total);
                    $stmt_pedido->bindParam(':funcionario_id', $funcionario_id);
                    $stmt_pedido->bindParam(':status', $status);
                    $stmt_pedido->bindParam(':produto_id', $item['pizza_id']);
                    $stmt_pedido->bindValue(':obs', $item['tipo_pizza']); // Usando tipo_pizza como observação
                    $stmt_pedido->execute();
                }

                // Excluir os itens do carrinho do cliente
                $stmt_limpar_carrinho = $pdo->prepare("DELETE FROM carrinho WHERE cliente_id = :cliente_id");
                $stmt_limpar_carrinho->bindParam(':cliente_id', $cliente_id);
                $stmt_limpar_carrinho->execute();

                // Confirmar a transação
                $pdo->commit();

                echo json_encode(array("success" => true, "message" => "Pedido criado com sucesso.", "n_pedido" => $n_pedido));
            } catch (Exception $e) {
                // Reverter a transação em caso de erro
                $pdo->rollBack();
                echo json_encode(array("success" => false, "message" => "Erro ao criar o pedido: " . $e->getMessage()));
            }
        } else {
            echo json_encode(array("success" => false, "message" => "Todos os campos obrigatórios devem ser preenchidos."));
        }
    } else {
        echo json_encode(array("success" => false, "message" => "Método não permitido. Use POST."));
    }
} catch (PDOException $e) {
    echo json_encode(array("success" => false, "error" => $e->getMessage()));
}
?>