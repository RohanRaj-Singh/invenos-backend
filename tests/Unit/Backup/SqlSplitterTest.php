<?php

namespace Tests\Unit\Backup;

use App\Domains\Backup\Support\SqlSplitter;
use Tests\TestCase;

class SqlSplitterTest extends TestCase
{
    public function test_splits_simple_statements(): void
    {
        $statements = SqlSplitter::split("CREATE TABLE a (id int);\nINSERT INTO a VALUES (1);\n");

        $this->assertCount(2, $statements);
        $this->assertSame('CREATE TABLE a (id int)', $statements[0]);
        $this->assertSame('INSERT INTO a VALUES (1)', $statements[1]);
    }

    public function test_ignores_semicolons_inside_strings_and_comments(): void
    {
        $sql = <<<'SQL'
-- a comment; with semicolon
INSERT INTO notes (body) VALUES ('hello; world');
/* block; comment */
INSERT INTO notes (body) VALUES ("another; value");
SQL;

        $statements = SqlSplitter::split($sql);

        $this->assertCount(2, $statements);
        $this->assertStringContainsString("'hello; world'", $statements[0]);
        $this->assertStringContainsString('"another; value"', $statements[1]);
    }

    public function test_supports_the_delimiter_directive_for_routines(): void
    {
        $sql = <<<'SQL'
DELIMITER $$
CREATE PROCEDURE p()
BEGIN
  SELECT 1;
  SELECT 2;
END$$
DELIMITER ;
INSERT INTO t VALUES (1);
SQL;

        $statements = SqlSplitter::split($sql);

        $this->assertCount(2, $statements);
        $this->assertStringContainsString('CREATE PROCEDURE p()', $statements[0]);
        $this->assertStringContainsString('INSERT INTO t', $statements[1]);
    }

    public function test_escaped_quotes_do_not_end_a_statement(): void
    {
        $statements = SqlSplitter::split("INSERT INTO t VALUES ('it\\'s fine');\nINSERT INTO t VALUES ('done');");

        $this->assertCount(2, $statements);
        $this->assertStringContainsString("it\\'s fine", $statements[0]);
    }
}
