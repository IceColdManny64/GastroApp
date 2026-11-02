<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once "config.php";

$method = $_SERVER['REQUEST_METHOD'];
$rawInput = file_get_contents("php://input");
$input = json_decode($rawInput, true);

if (!is_array($input) || empty($input)) {
    $input = !empty($_POST) ? $_POST : [];
}

$action = isset($input['action']) ? strtolower(trim($input['action'])) : '';

if ($method === 'POST' && $action === 'update') {
    $method = 'PUT';
} elseif ($method === 'POST' && $action === 'delete') {
    $method = 'DELETE';
}

switch ($method) {
    case 'GET':
        if (isset($_GET['id'])) {
            $id = intval($_GET['id']);
            $stmt = $conn->prepare("SELECT * FROM gastroRecipe WHERE id = ?");
            $stmt->bind_param("i", $id);
            $stmt->execute();
            $result = $stmt->get_result();
            $data = $result->fetch_assoc();
            echo json_encode($data ? $data : ["error" => "Recipe not found"]);
        } else if (isset($_GET['search'])) {
            $search = "%" . $_GET['search'] . "%";
            $stmt = $conn->prepare("SELECT * FROM gastroRecipe WHERE title LIKE ? OR description LIKE ?");
            $stmt->bind_param("ss", $search, $search);
            $stmt->execute();
            $result = $stmt->get_result();
            $data = [];
            while ($row = $result->fetch_assoc()) {
                $data[] = $row;
            }
            echo json_encode($data);
        } else {
            $result = $conn->query("SELECT * FROM gastroRecipe");
            $recipes = [];
            while ($row = $result->fetch_assoc()) {
                $recipes[] = $row;
            }
            echo json_encode($recipes);
        }
        break;

    case 'POST':
        $title = isset($input['title']) ? trim($input['title']) : '';
        $description = isset($input['description']) ? trim($input['description']) : '';
        $imageURL = isset($input['imageURL']) ? trim($input['imageURL']) : (isset($input['image']) ? trim($input['image']) : '');
        $preparetime = isset($input['preparetime']) ? trim($input['preparetime']) : (isset($input['prepareTime']) ? trim($input['prepareTime']) : '00:30:00');
        $likerate = isset($input['likerate']) ? intval($input['likerate']) : (isset($input['likeRate']) ? intval($input['likeRate']) : 90);
        $category = isset($input['category']) ? trim($input['category']) : 'Mexicanas';
        $difficulty = isset($input['difficulty']) ? trim($input['difficulty']) : 'Facil';

        if (empty($title) || empty($description)) {
            http_response_code(400);
            echo json_encode(["status" => "error", "error" => "Missing required fields: title, description"]);
            exit;
        }

        $stmt = $conn->prepare(
            "INSERT INTO gastroRecipe (title, description, imageURL, preparetime, likerate, category, difficulty) VALUES (?, ?, ?, ?, ?, ?, ?)"
        );
        $stmt->bind_param("ssssiss", $title, $description, $imageURL, $preparetime, $likerate, $category, $difficulty);

        if ($stmt->execute()) {
            $insertedId = intval($stmt->insert_id);
            echo json_encode([
                "status" => "success",
                "store" => "success",
                "id" => $insertedId,
                "title" => $title,
                "description" => $description,
                "imageURL" => $imageURL,
                "preparetime" => $preparetime,
                "likerate" => $likerate,
                "category" => $category,
                "difficulty" => $difficulty
            ]);
        } else {
            http_response_code(500);
            echo json_encode(["status" => "error", "error" => "Database insert failed: " . $stmt->error]);
        }
        break;

    case 'PUT':
        $id = isset($_GET['id']) ? intval($_GET['id']) : (isset($input['id']) ? intval($input['id']) : 0);
        $title = isset($input['title']) ? trim($input['title']) : '';
        $description = isset($input['description']) ? trim($input['description']) : '';
        $imageURL = isset($input['imageURL']) ? trim($input['imageURL']) : (isset($input['image']) ? trim($input['image']) : '');
        $preparetime = isset($input['preparetime']) ? trim($input['preparetime']) : (isset($input['prepareTime']) ? trim($input['prepareTime']) : '00:30:00');
        $likerate = isset($input['likerate']) ? intval($input['likerate']) : (isset($input['likeRate']) ? intval($input['likeRate']) : 90);
        $category = isset($input['category']) ? trim($input['category']) : 'Mexicanas';
        $difficulty = isset($input['difficulty']) ? trim($input['difficulty']) : 'Facil';

        if ($id <= 0 || empty($title) || empty($description)) {
            http_response_code(400);
            echo json_encode(["status" => "error", "error" => "Missing required fields: id, title, description"]);
            exit;
        }

        $stmt = $conn->prepare(
            "UPDATE gastroRecipe SET title = ?, description = ?, imageURL = ?, preparetime = ?, likerate = ?, category = ?, difficulty = ? WHERE id = ?"
        );
        $stmt->bind_param("ssssissi", $title, $description, $imageURL, $preparetime, $likerate, $category, $difficulty, $id);

        if ($stmt->execute()) {
            echo json_encode([
                "status" => "success",
                "update" => "success",
                "id" => $id,
                "affected_rows" => $stmt->affected_rows
            ]);
        } else {
            http_response_code(500);
            echo json_encode(["status" => "error", "error" => "Database update failed: " . $stmt->error]);
        }
        break;

    case 'DELETE':
        $id = isset($_GET['id']) ? intval($_GET['id']) : (isset($input['id']) ? intval($input['id']) : 0);
        if ($id <= 0) {
            http_response_code(400);
            echo json_encode(["status" => "error", "error" => "ID is required"]);
            exit;
        }

        $stmt = $conn->prepare("DELETE FROM gastroRecipe WHERE id = ?");
        $stmt->bind_param("i", $id);

        if ($stmt->execute()) {
            echo json_encode([
                "status" => "success",
                "delete" => "success",
                "id" => $id,
                "affected_rows" => $stmt->affected_rows
            ]);
        } else {
            http_response_code(500);
            echo json_encode(["status" => "error", "error" => "Database delete failed: " . $stmt->error]);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(["error" => "Method Not Allowed"]);
        break;
}
?>
