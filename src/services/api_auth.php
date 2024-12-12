<?php
header("Content-Type: application/json");

// Configuração do banco de dados
$host = 'devweb3sql.mysql.dbaas.com.br';
$dbname = 'devweb3sql';
$user = 'devweb3sql';
$pass = 'h2023_FaTEC#$';

// Conexão com o banco de dados usando PDO
try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    echo json_encode(array('error' => 'Erro de conexão: ' . $e->getMessage()));
    exit;
}

// Recebendo e decodificando o JSON enviado
$input = file_get_contents("php://input");
$data = json_decode($input, true);

// Verifica se o JSON foi decodificado corretamente
if ($data === null && json_last_error() !== JSON_ERROR_NONE) {
    echo json_encode(array('success' => false, 'message' => 'Erro ao decodificar o JSON enviado.'));
    exit;
}

// Extrai e valida as credenciais de autenticação
$email = isset($data['email']) ? $data['email'] : '';
$senha = isset($data['senha']) ? $data['senha'] : '';

if (empty($email) || empty($senha)) {
    echo json_encode(array('success' => false, 'message' => 'Email ou senha não informados.'));
    exit;
}

// Consulta ao banco de dados para verificar o email e obter informações do usuário
try {
    $query = "SELECT id, nome, senha FROM cliente WHERE email = :email";
    $stmt = $pdo->prepare($query);
    $stmt->bindParam(':email', $email);
    $stmt->execute();
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    // Verifica se o usuário existe e a senha está correta
    if ($user && $senha === $user['senha']) {
        echo json_encode(array(
            'success' => true,
            'message' => 'Autenticacao bem-sucedida.',
            'user' => array(
                'id' => $user['id'],
                'nome' => $user['nome'],
                'email' => $email
            )
        ));
    } else {
        echo json_encode(array('success' => false, 'message' => 'Email ou senha incorretos.'));
    }
} catch (PDOException $e) {
    echo json_encode(array('error' => 'Erro na consulta: ' . $e->getMessage()));
    exit;
}
?>
