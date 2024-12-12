<?php
header('Content-Type: application/json');

// Configurações do banco de dados
$host = 'devweb3sql.mysql.dbaas.com.br';
$dbname = 'devweb3sql';
$user = 'devweb3sql';
$pass = 'h2023_FaTEC#$';

try {
    // Conexão com o banco de dados
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Consulta SQL
    $stmt = $pdo->query("SELECT * FROM usuarios"); // Substitua 'tabela_usuarios' pelo nome da sua tabela

    // Recupera os dados
    $usuarios = array(); // Usar array() para compatibilidade com PHP 5.2

    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $usuarios[] = $row; // Adiciona cada linha ao array
    }

    // Retorna os dados como JSON
    echo json_encode($usuarios);
} catch (PDOException $e) {
    // Retorna erro se houver
    echo json_encode(array('error' => $e->getMessage()));
}
?>
