<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

// Obtém os dados do corpo da requisição
$data = json_decode(file_get_contents("php://input"), true);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if ($data) {
        echo json_encode([
            "status" => "sucesso",
            "mensagem" => "Dados recebidos com sucesso!",
            "dados" => $data
        ]);
    } else {
        echo json_encode([
            "status" => "erro",
            "mensagem" => "Nenhum dado recebido ou formato inválido."
        ]);
    }
} else {
    echo json_encode([
        "status" => "erro",
        "mensagem" => "Método inválido. Apenas POST é permitido."
    ]);
}
