<?php

namespace Tests\Unit\Backup;

use App\Domains\Backup\Support\SqlSanitizer;
use Tests\TestCase;

class SqlSanitizerTest extends TestCase
{
    public function test_removes_gtid_and_session_log_statements(): void
    {
        $source = sys_get_temp_dir().DIRECTORY_SEPARATOR.'dump-src-'.bin2hex(random_bytes(4)).'.sql';
        $target = $source.'.clean';

        $sql = implode("\n", [
            '-- MySQL dump',
            'SET @MYSQLDUMP_TEMP_LOG_BIN = @@SESSION.SQL_LOG_BIN;',
            'SET @@SESSION.SQL_LOG_BIN= 0;',
            "SET @@GLOBAL.GTID_PURGED=/*!80000 '+'*/ '3e11fa47-71ca-11e1-9e33-c80aa9429562:1-5';",
            "SET @@SESSION.GTID_NEXT= 'AUTOMATIC';",
            'CREATE TABLE `products` (`id` bigint);',
            'INSERT INTO `products` VALUES (1);',
        ])."\n";

        file_put_contents($source, $sql);

        $skipped = SqlSanitizer::sanitize($source, $target);
        $result = file_get_contents($target);

        $this->assertSame(4, $skipped);
        $this->assertStringNotContainsString('GTID_PURGED', $result);
        $this->assertStringNotContainsString('SQL_LOG_BIN', $result);
        $this->assertStringContainsString('CREATE TABLE `products`', $result);
        $this->assertStringContainsString('INSERT INTO `products`', $result);

        @unlink($source);
        @unlink($target);
    }

    public function test_leaves_regular_statements_untouched(): void
    {
        $source = sys_get_temp_dir().DIRECTORY_SEPARATOR.'dump-src-'.bin2hex(random_bytes(4)).'.sql';
        $target = $source.'.clean';

        $sql = "SET NAMES utf8mb4;\nINSERT INTO t VALUES ('a;b');\n";
        file_put_contents($source, $sql);

        $this->assertSame(0, SqlSanitizer::sanitize($source, $target));
        $this->assertSame($sql, file_get_contents($target));

        @unlink($source);
        @unlink($target);
    }
}
