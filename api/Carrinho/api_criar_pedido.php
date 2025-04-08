<?php
// Set headers for JSON response and CORS
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle CORS preflight requests (OPTIONS method)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// --- Use the correct path to your config file ---
require_once __DIR__ . '/db_settings.php'; // Corrected based on previous info

// Check if it's a POST request
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Método não permitido. Use POST."]);
    exit;
}

// Get input data
$data = json_decode(file_get_contents("php://input"), true);

// --- Input Validation ---
if (!isset($data['cliente_id']) || !is_numeric($data['cliente_id'])) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "ID do cliente inválido ou ausente."]);
    exit;
}
$cliente_id = intval($data['cliente_id']);
$observacao = isset($data['observacao']) ? trim((string) $data['observacao']) : '';

// --- Declare $pdo outside try block for finally ---
$pdo = null;

try {
    // --- Database Connection ---
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_EMULATE_PREPARES, false);

    // --- Start Transaction ---
    $pdo->beginTransaction();

    // 1. Fetch cart items INCLUDING unit price
    //    Assuming 'preco' in 'carrinho' IS the unit price
    $stmt_fetch_cart = $pdo->prepare("
        SELECT pizza_id, preco
        FROM carrinho
        WHERE cliente_id = :cliente_id
    ");
    $stmt_fetch_cart->bindParam(':cliente_id', $cliente_id, PDO::PARAM_INT);
    $stmt_fetch_cart->execute();
    $cart_items = $stmt_fetch_cart->fetchAll(PDO::FETCH_ASSOC);

    // Check if cart is empty
    if (empty($cart_items)) {
        $pdo->rollBack();
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "O carrinho está vazio. Não é possível criar um pedido."]);
        exit;
    }

    // 2. Calculate Total & Group Items (Now also storing unit price per group)
    $total_pedido = 0;
    $grouped_items = [];
    foreach ($cart_items as $item) {
        $total_pedido += floatval($item['preco']);
        $key = $item['pizza_id']; // Grouping by pizza_id

        if (!isset($grouped_items[$key])) {
            $grouped_items[$key] = [
                'pizza_id' => intval($item['pizza_id']),
                'quantidade' => 0,
                // *** STORE THE UNIT PRICE FOR THIS PIZZA TYPE ***
                'preco_unitario' => floatval($item['preco'])
            ];
        }
        $grouped_items[$key]['quantidade'] += 1;
        // Note: This assumes the price for a given pizza_id is the same
        // for all items of that ID in the cart. If not, grouping needs refinement.
    }

    // 3. Generate Unique Order Number
    $n_pedido = "PED" . time() . rand(100, 999);

    // 4. Prepare INSERT statement for Pedidos (including preco_unitario)
    //    Replace 'preco_unitario' with your actual column name if different
    $stmt_insert_pedido = $pdo->prepare("
        INSERT INTO Pedidos
        (n_pedido, cliente_id, data_pedido, total, status, produto_id, quantidade, preco_unitario, obs, funcionario_id)
        VALUES
        (:n_pedido, :cliente_id, NOW(), :total, 'Pendente', :produto_id, :quantidade, :preco_unitario, :obs, NULL)
    ");
    //          ^^^ Make sure column order matches your table ^^^                        ^^^ Make sure placeholder order matches ^^^

    // 5. Insert each grouped item into Pedidos
    foreach ($grouped_items as $item_group) {
        $stmt_insert_pedido->bindParam(':n_pedido', $n_pedido, PDO::PARAM_STR);
        $stmt_insert_pedido->bindParam(':cliente_id', $cliente_id, PDO::PARAM_INT);
        $stmt_insert_pedido->bindParam(':total', $total_pedido); // Overall order total
        $stmt_insert_pedido->bindParam(':produto_id', $item_group['pizza_id'], PDO::PARAM_INT);
        $stmt_insert_pedido->bindParam(':quantidade', $item_group['quantidade'], PDO::PARAM_INT);
        // *** BIND THE UNIT PRICE ***
        $stmt_insert_pedido->bindParam(':preco_unitario', $item_group['preco_unitario']); // Bind the stored unit price
        $stmt_insert_pedido->bindParam(':obs', $observacao, PDO::PARAM_STR); // User observation

        $stmt_insert_pedido->execute();
    }

    // 6. Delete items from the cart
    $stmt_delete_cart = $pdo->prepare("DELETE FROM carrinho WHERE cliente_id = :cliente_id");
    $stmt_delete_cart->bindParam(':cliente_id', $cliente_id, PDO::PARAM_INT);
    $stmt_delete_cart->execute();

    // --- Commit Transaction ---
    $pdo->commit();

    // --- Success Response ---
    http_response_code(201);
    echo json_encode([
        "success" => true,
        "message" => "Pedido criado com sucesso.",
        "n_pedido" => $n_pedido,
        "total" => $total_pedido
    ]);

} catch (PDOException $e) {
    if ($pdo && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    error_log("Database Error processing order for client $cliente_id: " . $e->getMessage());
    echo json_encode(["success" => false, "message" => "Erro interno do servidor ao processar o pedido (DB)."]);
} catch (Exception $e) {
    if ($pdo && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    error_log("Error processing order for client $cliente_id: " . $e->getMessage());
    echo json_encode(["success" => false, "message" => "Erro ao processar o pedido: " . $e->getMessage()]);
} finally {
    $pdo = null;
}
?>