<?php
// api_update_user.php

// Configurações para exibir erros durante o desenvolvimento.
// Em produção, mude display_errors para 0 e use error_log.
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// --- Configurações do Banco de Dados ---
$host = 'wesley.mysql.dbaas.com.br';
$dbname = 'wesley';
$username_db = 'wesley';
$password_db = 'tI7u96pYDAv3I#';

// --- Headers ---
header('Content-Type: application/json; charset=utf-8');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Lidar com requisições OPTIONS (preflight CORS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// --- Conexão com o Banco de Dados (PDO) ---
try {
    $pdo = new PDO(
        "mysql:host=$host;dbname=$dbname;charset=utf8mb4",
        $username_db,
        $password_db,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]
    );
} catch (PDOException $e) {
    error_log("API_UPDATE_USER - DB Connection Error: " . $e->getMessage());
    http_response_code(503);
    echo json_encode(['success' => false, 'message' => 'Serviço indisponível. Não foi possível conectar ao banco de dados.']);
    exit;
}

// --- Lógica da API ---

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método de requisição inválido. Use POST.']);
    exit;
}

$inputJSON = file_get_contents('php://input');
// Log do JSON bruto recebido (para depuração)
error_log("API_UPDATE_USER - Raw Input JSON: " . $inputJSON);
$input = json_decode($inputJSON, true);

if ($input === null && json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400);
    error_log("API_UPDATE_USER - JSON Decode Error: " . json_last_error_msg());
    echo json_encode(['success' => false, 'message' => 'Erro ao processar os dados da requisição (JSON inválido).']);
    exit;
}

// Log dos dados decodificados (para depuração)
error_log("API_UPDATE_USER - Decoded Input Data: " . print_r($input, true));

// Validação dos Dados de Entrada
// O frontend envia 'uf' (minúsculo) e 'numeroCasa' (camelCase) conforme corrigido anteriormente
$camposObrigatorios = ['id', 'nome', 'logradouro', 'cidade', 'uf', 'cep', 'complemento', 'numeroCasa', 'email', 'telefone'];
$camposFaltando = [];
foreach ($camposObrigatorios as $campo) {
    if (!isset($input[$campo]) || ($campo !== 'complemento' && is_string($input[$campo]) && trim($input[$campo]) === '')) {
        $camposFaltando[] = $campo;
    }
}

if (!empty($camposFaltando)) {
    http_response_code(400);
    error_log("API_UPDATE_USER - Campos Faltando: " . implode(', ', $camposFaltando) . " - Input Recebido: " . print_r($input, true));
    echo json_encode(['success' => false, 'message' => 'Dados insuficientes. Campos obrigatórios faltando: ' . implode(', ', $camposFaltando)], JSON_UNESCAPED_UNICODE);
    exit;
}

// Sanitizar e atribuir variáveis
$id = filter_var($input['id'], FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
$nome = trim(strip_tags($input['nome']));
$logradouro = trim(strip_tags($input['logradouro']));
$cidade = trim(strip_tags($input['cidade']));
$uf_input = strtoupper(trim(strip_tags($input['uf'])));
$cep = preg_replace('/[^0-9]/', '', $input['cep']);
$complemento = trim(strip_tags($input['complemento']));
$numeroCasa_input = trim(strip_tags($input['numeroCasa']));
$email = filter_var(trim($input['email']), FILTER_VALIDATE_EMAIL);
$telefone = preg_replace('/[^0-9]/', '', $input['telefone']); // Apenas números para telefone

// Validações adicionais
if ($id === false) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'ID do usuário inválido.'], JSON_UNESCAPED_UNICODE);
    exit;
}
if (empty($nome)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'O campo nome é obrigatório.'], JSON_UNESCAPED_UNICODE);
    exit;
}
if ($email === false) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Formato de e-mail inválido.'], JSON_UNESCAPED_UNICODE);
    exit;
}
if (strlen($uf_input) !== 2) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'UF inválida. Deve conter 2 caracteres.'], JSON_UNESCAPED_UNICODE);
    exit;
}
if (strlen($cep) !== 8) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'CEP inválido. Deve conter 8 dígitos.'], JSON_UNESCAPED_UNICODE);
    exit;
}

// --- Preparar e Executar a Query SQL ---

// Nomes das COLUNAS no banco de dados. Ajuste se forem diferentes.
// Assumindo: coluna para UF é 'UF', coluna para número da casa é 'numero_casa'
$coluna_uf_db = 'UF';
$coluna_numero_casa_db = 'numero_casa';
$coluna_senha_db = 'senha'; // Nome da coluna de senha no banco

$sqlSetParts = [
    "nome = :nome",
    "logradouro = :logradouro",
    "cidade = :cidade",
    "$coluna_uf_db = :uf_val", // Usando variável para nome da coluna
    "cep = :cep",
    "complemento = :complemento",
    "$coluna_numero_casa_db = :numero_casa_val", // Usando variável para nome da coluna
    "email = :email",
    "telefone = :telefone"
];

$params = [
    ':nome' => $nome,
    ':logradouro' => $logradouro,
    ':cidade' => $cidade,
    ':uf_val' => $uf_input,
    ':cep' => $cep,
    ':complemento' => $complemento,
    ':numero_casa_val' => $numeroCasa_input,
    ':email' => $email,
    ':telefone' => $telefone,
];

if (isset($input['senha']) && !empty(trim($input['senha']))) {
    $senha_plain = trim($input['senha']);
    if (strlen($senha_plain) < 6) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'A nova senha deve ter pelo menos 6 caracteres.'], JSON_UNESCAPED_UNICODE);
        exit;
    }
    $senha_hash = password_hash($senha_plain, PASSWORD_DEFAULT);
    if ($senha_hash === false) {
        error_log("API_UPDATE_USER - Erro ao gerar hash de senha para usuário ID: {$id}");
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Erro interno ao processar a nova senha.'], JSON_UNESCAPED_UNICODE);
        exit;
    }
    $sqlSetParts[] = "$coluna_senha_db = :senha_hash_val";
    $params[':senha_hash_val'] = $senha_hash;
}

$sql = "UPDATE cliente SET " . implode(', ', $sqlSetParts) . " WHERE id = :id_where";
$params[':id_where'] = $id;

// LOG DA QUERY E PARÂMETROS (PARA DEPURAR - REMOVER/COMENTAR EM PRODUÇÃO)
error_log("API_UPDATE_USER - SQL Query: " . $sql);
error_log("API_UPDATE_USER - Parameters: " . print_r($params, true));
// FIM DO LOG DE DEPURARÇÃO

try {
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $rowCount = $stmt->rowCount();

    if ($rowCount > 0) {
        echo json_encode(['success' => true, 'message' => 'Dados do usuário atualizados com sucesso!'], JSON_UNESCAPED_UNICODE);
    } else {
        // Verificar se o usuário existe para dar uma mensagem mais precisa
        $checkStmt = $pdo->prepare("SELECT id FROM cliente WHERE id = :id_check");
        $checkStmt->execute([':id_check' => $id]);
        if ($checkStmt->fetch()) {
            echo json_encode(['success' => true, 'message' => 'Nenhuma alteração foi aplicada (os dados podem ser os mesmos).'], JSON_UNESCAPED_UNICODE);
        } else {
            echo json_encode(['success' => false, 'message' => 'Usuário não encontrado com o ID fornecido.'], JSON_UNESCAPED_UNICODE);
        }
    }
} catch (PDOException $e) {
    // LOG DETALHADO DA EXCEÇÃO PDO (PARA DEPURAR - REMOVER/COMENTAR MENSAGEM DETALHADA EM PRODUÇÃO)
    error_log("API_UPDATE_USER - PDOException para usuário ID {$id}: " . $e->getMessage() . " | SQL: " . $sql . " | Params: " . print_r($params, true));
    http_response_code(500);
    // Em produção, mensagem mais genérica:
    // echo json_encode(['success' => false, 'message' => 'Ocorreu um erro ao tentar atualizar os dados do usuário.'], JSON_UNESCAPED_UNICODE);
    // Para depuração, pode ser útil ver o erro (mas não exponha isso ao cliente em produção):
    echo json_encode(['success' => false, 'message' => 'Erro DB: ' . $e->getMessage()], JSON_UNESCAPED_UNICODE);
}

exit;
?>