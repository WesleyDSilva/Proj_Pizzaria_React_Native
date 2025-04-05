<?php
// Configurações do banco de dados
$host = "wesley.mysql.dbaas.com.br";   // Endereço do servidor (ou IP)
$dbname = "wesley"; // Nome do banco de dados
$username = "wesley";    // Usuário do banco
$password = "tI7u96pYDAv3I#";        // Senha do banco

try {
    // Criando a conexão usando PDO
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);

    // Definindo o modo de erro para exceções
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Mensagem opcional de sucesso (remova em produção)
    // echo "Conexão bem-sucedida!";
} catch (PDOException $e) {
    // Em caso de erro, exibe a mensagem
    die("Erro de conexão: " . $e->getMessage());
}
?>