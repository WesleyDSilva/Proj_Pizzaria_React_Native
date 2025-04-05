<?php
header('Content-Type: application/json');

// Importando conexão com o banco de dados
require_once __DIR__ . '/../db_config/config.php';

// Conectando ao banco
$conn = new mysqli($host, $username, $password, $dbname);

// Verificando conexão com o banco de dados
if (!$conn) {
    echo json_encode(array(
        'error' => true,
        'message' => 'Erro de conexão' . mysqli_connect_error()
    ));
    exit;
}

// Configurando charset
mysqli_set_charset($conn, "utf8");

// Verificando o método da requisição
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Obtendo o ID do funcionário
    $funcionario_id = isset($_GET['funcionario_id']) ? intval($_GET['funcionario_id']) : null;

    // Validando se o ID do funcionário foi fornecido
    if ($funcionario_id) {
        // Query
        $query = "SELECT funcionario_id, nome, cargo, placa, telefone, perfil FROM Funcionarios WHERE funcionario_id = ?";

        $stmt = mysqli_prepare($conn, $query);

        if ($stmt) {
            // Associando o parâmetro
            mysqli_stmt_bind_param($stmt, "i", $funcionario_id);

            // Executando a query
            mysqli_stmt_execute($stmt);

            if (!mysqli_stmt_execute($stmt)) {
                echo json_encode(array('error' => true, 'message' => 'Erro na execução da consulta: ' . mysqli_stmt_error($stmt)));
                exit;
            }

            // Associando as variáveis para os resultados
            mysqli_stmt_bind_result($stmt, $funcionario_id_result, $funcionario_nome_result, $funcionario_cargo_result, $funcionario_placa_result, $funcionario_telefone_result, $funcionario_perfil_result);

            $funcionario = array();

            while (mysqli_stmt_fetch($stmt)) {
                $funcionario[] = array(
                    'funcionario_id' => $funcionario_id_result,
                    'nome' => $funcionario_nome_result,
                    'cargo' => $funcionario_cargo_result,
                    'placa' => $funcionario_placa_result,
                    'telefone' => $funcionario_telefone_result,
                    'perfil' => $funcionario_perfil_result
                );
            }

            // Se encontrou o funcionário, retorna os dados
            if (!empty($funcionario)) {
                echo json_encode($funcionario);
            } else {
                echo json_encode(array()); // Array vazio caso não haja pedidos
            }

            // Fechando a declaração
            mysqli_stmt_close($stmt);
        } else {
            echo json_encode(array());
        }
    } else {
        echo json_encode(array()); // Retorna array vazio caso não tenha 'funcionario_id'
    }
} else {
    echo json_encode(array()); // Retorna array vazio para método inválido
}

// Fechando a conexão com o banco de dados
mysqli_close($conn);

?>