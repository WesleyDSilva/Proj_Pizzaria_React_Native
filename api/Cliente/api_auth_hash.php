<?php
header("Content-Type: application/json");

// Configuração do banco de dados
$host = 'wesley.mysql.dbaas.com.br'; // Endereço do servidor do banco de dados
$dbname = 'wesley'; // Nome do banco de dados
$username = 'wesley'; // Nome de usuário do banco de dados
$password = 'tI7u96pYDAv3I#'; // Senha do banco de dados

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    echo json_encode(array('success' => false, 'message' => 'Erro de conexão com o banco de dados.', 'error' => $e->getMessage()));
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
$email = isset($data['email']) ? trim($data['email']) : '';
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

    // Verifica se o usuário existe
    if ($user) {
        // Exibe o hash da senha armazenada para depuração (remova em produção)
        // echo json_encode(array('debug' => 'Senha armazenada: ' . $user['senha']));

        // Verifica a senha com password_verify
        if (password_verify($senha, $user['senha'])) {
            echo json_encode(array(
                'success' => true,
                'message' => 'Autenticação bem-sucedida.',
                'user' => array(
                    'id' => $user['id'],
                    'nome' => $user['nome'],
                    'email' => $email
                )
            ));
        } else {
            echo json_encode(array('success' => false, 'message' => 'Senha incorreta.'));
        }
    } else {
        echo json_encode(array('success' => false, 'message' => 'Email não encontrado.'));
    }
} catch (PDOException $e) {
    echo json_encode(array('success' => false, 'message' => 'Erro na consulta ao banco de dados.', 'error' => $e->getMessage()));
    exit;
}
?>