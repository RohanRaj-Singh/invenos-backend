<?php
$db = require __DIR__ . "/config/database.php";
$conn = $db["connections"][$db["default"]];
$backupFile = __DIR__ . "/storage/invenos-backup-" . date("Ymd-His") . ".sql";
try {
    $pdo = new PDO("mysql:host={$conn["host"]};dbname={$conn["database"]}", $conn["username"], $conn["password"]);
    $tables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
    $sql = "-- Invenos Backup " . date("Y-m-d H:i:s") . "\n\n";
    foreach ($tables as $table) {
        $create = $pdo->query("SHOW CREATE TABLE $table")->fetch();
        $sql .= "-- Table: $table\n";
        $sql .= $create[1] . ";\n\n";
        $rows = $pdo->query("SELECT * FROM $table");
        if ($rows && $rows->rowCount() > 0) {
            while ($row = $rows->fetch(PDO::FETCH_NUM)) {
                $vals = array_map(function($v) use ($pdo) { return $v === null ? "NULL" : $pdo->quote((string)$v); }, $row);
                $sql .= "INSERT INTO $table VALUES (" . implode(",", $vals) . ");\n";
            }
        }
        $sql .= "\n";
    }
    file_put_contents($backupFile, $sql);
    echo "Backup created: " . basename($backupFile) . " (" . round(filesize($backupFile)/1024) . " KB)\n";
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
