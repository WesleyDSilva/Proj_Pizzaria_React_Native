<?php
// Set headers for JSON response and CORS
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *'); // Be more specific in production if needed
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization'); // Add others if needed

// Handle CORS preflight requests (OPTIONS method)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// --- IMPORTANT: Adjust the path to your actual config file ---
require_once __DIR__ . 'config.php'; // Or the correct relative/absolute path

// Check if it's a POST request
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405); // Method Not Allowed
    echo json_encode(["success" => false, "message" => "Método não permitido. Use POST."]);
    exit;
}

// Get input data from the request body
$data = json_decode(file_get_contents("php://input"), true);

// --- Input Validation ---
if (!isset($data['cliente_id']) || !is_numeric($data['cliente_id'])) {
    http_response_code(400); // Bad Request
    echo json_encode(["success" => false, "message" => "ID do cliente inválido ou ausente."]);
    exit;
}
$cliente_id = intval($data['cliente_id']);
// Observation is optional, default to empty string
$observacao = isset($data['observacao']) ? trim((string) $data['observacao']) : '';

try {
    // --- Database Connection ---
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_EMULATE_PREPARES, false); // Good practice

    // --- Start Transaction ---
    $pdo->beginTransaction();

    // 1. Fetch all cart items for the client
    // Select necessary fields: pizza_id and price are essential
    $stmt_fetch_cart = $pdo->prepare("SELECT pizza_id, preco FROM carrinho WHERE cliente_id = :cliente_id");
    $stmt_fetch_cart->bindParam(':cliente_id', $cliente_id, PDO::PARAM_INT);
    $stmt_fetch_cart->execute();
    $cart_items = $stmt_fetch_cart->fetchAll(PDO::FETCH_ASSOC);

    // Check if cart is empty
    if (empty($cart_items)) {
        $pdo->rollBack(); // Rollback transaction
        http_response_code(400); // Bad Request
        echo json_encode(["success" => false, "message" => "O carrinho está vazio. Não é possível criar um pedido."]);
        exit;
    }

    // 2. Calculate Total Order Value & Group Items by pizza_id
    $total_pedido = 0;
    $grouped_items = [];
    foreach ($cart_items as $item) {
        // Sum up the total price
        $total_pedido += floatval($item['preco']);

        // Group by pizza_id to count quantity
        $key = $item['pizza_id'];
        if (!isset($grouped_items[$key])) {
            $grouped_items[$key] = [
                'pizza_id' => intval($item['pizza_id']),
                'quantidade' => 0,
            ];
        }
        $grouped_items[$key]['quantidade'] += 1;
    }
    // Format total to 2 decimal places for storage if needed (depends on DB column type)
    // $total_pedido = number_format($total_pedido, 2, '.', '');


    // 3. Generate Unique Order Number (Consider more robust methods for high volume)
    $n_pedido = "PED" . time() . rand(100, 999);

    // 4. Insert grouped items into Pedidos table
    // Note: funcionario_id is set to NULL, status to 'Pendente'
    $stmt_insert_pedido = $pdo->prepare("
        INSERT INTO Pedidos
        (n_pedido, cliente_id, data_pedido, total, status, produto_id, quantidade, obs, funcionario_id)
        VALUES
        (:n_pedido, :cliente_id, NOW(), :total, 'Pendente', :produto_id, :quantidade, :obs, NULL)
    ");

    foreach ($grouped_items as $item_group) {
        $stmt_insert_pedido->bindParam(':n_pedido', $n_pedido, PDO::PARAM_STR);
        $stmt_insert_pedido->bindParam(':cliente_id', $cliente_id, PDO::PARAM_INT);
        $stmt_insert_pedido->bindParam(':total', $total_pedido); // Use the overall total for each row
        $stmt_insert_pedido->bindParam(':produto_id', $item_group['pizza_id'], PDO::PARAM_INT);
        $stmt_insert_pedido->bindParam(':quantidade', $item_group['quantidade'], PDO::PARAM_INT);
        $stmt_insert_pedido->bindParam(':obs', $observacao, PDO::PARAM_STR); // User observation for the whole order

        $stmt_insert_pedido->execute();
    }

    // 5. Delete items from the cart for this client
    $stmt_delete_cart = $pdo->prepare("DELETE FROM carrinho WHERE cliente_id = :cliente_id");
    $stmt_delete_cart->bindParam(':cliente_id', $cliente_id, PDO::PARAM_INT);
    $stmt_delete_cart->execute();

    // --- Commit Transaction ---
    $pdo->commit();

    // --- Success Response ---
    http_response_code(201); // 201 Created
    echo json_encode([
        "success" => true,
        "message" => "Pedido criado com sucesso.",
        "n_pedido" => $n_pedido,
        "total" => $total_pedido
    ]);

} catch (PDOException $e) {
    // Rollback on database error
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500); // Internal Server Error
    error_log("Database Error processing order for client $cliente_id: " . $e->getMessage()); // Log detailed error
    echo json_encode(["success" => false, "message" => "Erro interno do servidor ao processar o pedido."]); // Generic message to client
} catch (Exception $e) {
    // Rollback on general error (like empty cart handled above, but catch others)
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500); // Or a more specific code if known
    error_log("Error processing order for client $cliente_id: " . $e->getMessage()); // Log detailed error
    echo json_encode(["success" => false, "message" => "Erro ao processar o pedido: " . $e->getMessage()]);
} finally {
    // Close connection (optional with PDO, happens automatically)
    $pdo = null;
}
?>