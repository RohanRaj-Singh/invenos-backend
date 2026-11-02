<?php

namespace Tests\Unit\Backup;

use App\Domains\Backup\Support\BackupCipher;
use Tests\TestCase;

class BackupCipherTest extends TestCase
{
    private string $dir;

    protected function setUp(): void
    {
        parent::setUp();
        config(['backup.crypto.chunk_bytes' => 1024, 'backup.crypto.pbkdf2_iterations' => 10000]);
        $this->dir = sys_get_temp_dir().DIRECTORY_SEPARATOR.'invenos-cipher-'.bin2hex(random_bytes(4));
        mkdir($this->dir);
    }

    protected function tearDown(): void
    {
        foreach (glob($this->dir.DIRECTORY_SEPARATOR.'*') as $file) {
            @unlink($file);
        }
        @rmdir($this->dir);
        parent::tearDown();
    }

    public function test_round_trip_preserves_bytes_across_chunks(): void
    {
        $plain = random_bytes(5000);
        file_put_contents($this->dir.'/plain.bin', $plain);

        $cipher = new BackupCipher();
        $cipher->encryptFile($this->dir.'/plain.bin', $this->dir.'/enc.invbak', 'correct horse battery');
        $cipher->decryptFile($this->dir.'/enc.invbak', $this->dir.'/decrypted.bin', 'correct horse battery');

        $this->assertSame($plain, file_get_contents($this->dir.'/decrypted.bin'));
        $this->assertTrue(BackupCipher::isEncrypted($this->dir.'/enc.invbak'));
    }

    public function test_wrong_password_is_rejected(): void
    {
        file_put_contents($this->dir.'/plain.bin', 'secret data');

        $cipher = new BackupCipher();
        $cipher->encryptFile($this->dir.'/plain.bin', $this->dir.'/enc.invbak', 'correct horse battery');

        $this->expectExceptionMessage('wrong password or corrupted');

        $cipher->decryptFile($this->dir.'/enc.invbak', $this->dir.'/out.bin', 'wrong password');
    }

    public function test_tampering_is_detected(): void
    {
        file_put_contents($this->dir.'/plain.bin', str_repeat('A', 3000));

        $cipher = new BackupCipher();
        $cipher->encryptFile($this->dir.'/plain.bin', $this->dir.'/enc.invbak', 'correct horse battery');

        $bytes = file_get_contents($this->dir.'/enc.invbak');
        $bytes[120] = chr(ord($bytes[120]) ^ 0xFF);
        file_put_contents($this->dir.'/enc.invbak', $bytes);

        $this->expectExceptionMessage('wrong password or corrupted');

        $cipher->decryptFile($this->dir.'/enc.invbak', $this->dir.'/out.bin', 'correct horse battery');
    }

    public function test_rejects_files_without_the_magic_header(): void
    {
        file_put_contents($this->dir.'/not-a-backup.bin', 'PK fake zip');

        $this->expectExceptionMessage('Not an Invenos backup file');

        (new BackupCipher())->readHeader($this->dir.'/not-a-backup.bin');
    }
}
