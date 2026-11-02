<?php

namespace App\Domains\Backup\Support;

use RuntimeException;

final class BackupCipher
{
    public const MAGIC = "INVBAK\0";
    public const VERSION = 1;

    public const KDF_ARGON2ID = 1;
    public const KDF_PBKDF2 = 2;

    public const CIPHER_XCHACHA = 1;
    public const CIPHER_AES_GCM = 2;

    private const TAG_LENGTH = 16;
    private const SALT_LENGTH = 16;

    public static function isEncrypted(string $path): bool
    {
        $handle = @fopen($path, 'rb');
        if (! $handle) {
            return false;
        }

        $magic = fread($handle, strlen(self::MAGIC));
        fclose($handle);

        return $magic === self::MAGIC;
    }

    public function encryptFile(string $source, string $destination, string $password): array
    {
        [$kdf, $cipher] = $this->capabilities();
        $salt = random_bytes(self::SALT_LENGTH);
        $baseNonce = random_bytes($cipher === self::CIPHER_XCHACHA ? 24 : 12);
        [$param1, $param2] = $this->kdfParams($kdf);
        $key = $this->deriveKey($password, $salt, $kdf, $param1, $param2);

        $header = self::MAGIC
            . chr(self::VERSION)
            . chr($kdf)
            . chr($cipher)
            . chr(strlen($salt)).$salt
            . chr(strlen($baseNonce)).$baseNonce
            . pack('N', $param1)
            . pack('N', $param2);

        $in = fopen($source, 'rb');
        $out = fopen($destination, 'wb');

        if (! $in || ! $out) {
            throw new RuntimeException('Unable to open files for encryption.');
        }

        try {
            fwrite($out, $header);

            $chunkSize = max(1024, (int) config('backup.crypto.chunk_bytes', 4 * 1024 * 1024));
            $index = 0;

            while (! feof($in)) {
                $chunk = fread($in, $chunkSize);
                if ($chunk === false || $chunk === '') {
                    break;
                }

                $nonce = $this->chunkNonce($baseNonce, $cipher, $index);
                $aad = $header.pack('N', $index);
                $sealed = $this->seal($chunk, $key, $nonce, $cipher, $aad);

                fwrite($out, pack('N', strlen($chunk)));
                fwrite($out, $sealed);
                $index++;
            }

            fwrite($out, pack('N', 0));
        } finally {
            fclose($in);
            fclose($out);
            $this->wipe($key);
        }

        return ['cipher' => $cipher, 'kdf' => $kdf];
    }

    public function decryptFile(string $source, string $destination, string $password): array
    {
        $header = $this->readHeader($source);
        $key = $this->deriveKey($password, $header['salt'], $header['kdf'], $header['param1'], $header['param2']);

        $in = fopen($source, 'rb');
        $out = fopen($destination, 'wb');

        if (! $in || ! $out) {
            throw new RuntimeException('Unable to open backup for decryption.');
        }

        try {
            fseek($in, $header['payload_offset']);
            $maxChunk = max(1024, (int) config('backup.crypto.chunk_bytes', 4 * 1024 * 1024)) * 2;
            $index = 0;

            while (true) {
                $lengthBytes = $this->readExactly($in, 4, 'chunk length');
                $length = unpack('N', $lengthBytes)[1];

                if ($length === 0) {
                    break;
                }

                if ($length < 0 || $length > $maxChunk) {
                    throw new RuntimeException('Backup contains an invalid chunk length.');
                }

                $sealed = $this->readExactly($in, $length + self::TAG_LENGTH, 'chunk payload');
                $nonce = $this->chunkNonce($header['nonce'], $header['cipher'], $index);
                $aad = $header['raw_header'].pack('N', $index);
                $plain = $this->open($sealed, $key, $nonce, $header['cipher'], $aad);

                fwrite($out, $plain);
                $index++;
            }
        } finally {
            fclose($in);
            fclose($out);
            $this->wipe($key);
        }

        return ['cipher' => $header['cipher'], 'kdf' => $header['kdf'], 'chunks' => $index];
    }

    public function readHeader(string $path): array
    {
        $handle = fopen($path, 'rb');
        if (! $handle) {
            throw new RuntimeException('Backup file cannot be read.');
        }

        try {
            $start = ftell($handle);
            $magic = fread($handle, strlen(self::MAGIC));
            if ($magic !== self::MAGIC) {
                throw new RuntimeException('Not an Invenos backup file.');
            }

            $version = ord($this->readExactly($handle, 1, 'version'));
            if ($version !== self::VERSION) {
                throw new RuntimeException("Unsupported backup format version: {$version}.");
            }

            $kdf = ord($this->readExactly($handle, 1, 'kdf'));
            $cipher = ord($this->readExactly($handle, 1, 'cipher'));

            if (! in_array($kdf, [self::KDF_ARGON2ID, self::KDF_PBKDF2], true)) {
                throw new RuntimeException('Unsupported key derivation in backup.');
            }

            if (! in_array($cipher, [self::CIPHER_XCHACHA, self::CIPHER_AES_GCM], true)) {
                throw new RuntimeException('Unsupported cipher in backup.');
            }

            $saltLength = ord($this->readExactly($handle, 1, 'salt length'));
            $salt = $this->readExactly($handle, $saltLength, 'salt');

            $nonceLength = ord($this->readExactly($handle, 1, 'nonce length'));
            $nonce = $this->readExactly($handle, $nonceLength, 'nonce');

            $params = unpack('N2', $this->readExactly($handle, 8, 'kdf parameters'));

            $payloadOffset = ftell($handle);
            fseek($handle, $start);
            $rawHeader = fread($handle, $payloadOffset - $start);

            return [
                'version' => $version,
                'kdf' => $kdf,
                'cipher' => $cipher,
                'salt' => $salt,
                'nonce' => $nonce,
                'param1' => $params[1],
                'param2' => $params[2],
                'payload_offset' => $payloadOffset,
                'raw_header' => $rawHeader,
            ];
        } finally {
            fclose($handle);
        }
    }

    private function capabilities(): array
    {
        if (function_exists('sodium_crypto_aead_xchacha20poly1305_ietf_encrypt')) {
            return [self::KDF_ARGON2ID, self::CIPHER_XCHACHA];
        }

        if (! extension_loaded('openssl')) {
            throw new RuntimeException('Neither sodium nor openssl is available for backup encryption.');
        }

        return [self::KDF_PBKDF2, self::CIPHER_AES_GCM];
    }

    private function kdfParams(int $kdf): array
    {
        if ($kdf === self::KDF_ARGON2ID) {
            return [
                (int) config('backup.crypto.argon_ops', 4),
                (int) config('backup.crypto.argon_mem', 67108864),
            ];
        }

        return [(int) config('backup.crypto.pbkdf2_iterations', 310000), 0];
    }

    private function deriveKey(string $password, string $salt, int $kdf, int $param1, int $param2): string
    {
        if ($password === '') {
            throw new RuntimeException('A password is required to decrypt this backup.');
        }

        if ($kdf === self::KDF_ARGON2ID) {
            if (! function_exists('sodium_crypto_pwhash')) {
                throw new RuntimeException('Argon2id is not available on this server.');
            }

            $key = sodium_crypto_pwhash(
                32,
                $password,
                $salt,
                $param1,
                $param2,
                SODIUM_CRYPTO_PWHASH_ALG_ARGON2ID13
            );

            if ($key === false) {
                throw new RuntimeException('Key derivation failed.');
            }

            return $key;
        }

        return hash_pbkdf2('sha256', $password, $salt, max(10000, $param1), 32, true);
    }

    private function chunkNonce(string $baseNonce, int $cipher, int $index): string
    {
        $prefixLength = $cipher === self::CIPHER_XCHACHA ? 20 : 8;

        return substr($baseNonce, 0, $prefixLength).pack('N', $index);
    }

    private function seal(string $plain, string $key, string $nonce, int $cipher, string $aad): string
    {
        if ($cipher === self::CIPHER_XCHACHA) {
            return sodium_crypto_aead_xchacha20poly1305_ietf_encrypt($plain, $aad, $nonce, $key);
        }

        $tag = '';
        $ciphertext = openssl_encrypt($plain, 'aes-256-gcm', $key, OPENSSL_RAW_DATA, $nonce, $tag, $aad, 16);

        if ($ciphertext === false) {
            throw new RuntimeException('Backup encryption failed.');
        }

        return $ciphertext.$tag;
    }

    private function open(string $sealed, string $key, string $nonce, int $cipher, string $aad): string
    {
        if ($cipher === self::CIPHER_XCHACHA) {
            $plain = sodium_crypto_aead_xchacha20poly1305_ietf_decrypt($sealed, $aad, $nonce, $key);

            if ($plain === false) {
                throw new RuntimeException('Backup could not be decrypted: wrong password or corrupted file.');
            }

            return $plain;
        }

        $tag = substr($sealed, -self::TAG_LENGTH);
        $ciphertext = substr($sealed, 0, -self::TAG_LENGTH);
        $plain = openssl_decrypt($ciphertext, 'aes-256-gcm', $key, OPENSSL_RAW_DATA, $nonce, $tag, $aad);

        if ($plain === false) {
            throw new RuntimeException('Backup could not be decrypted: wrong password or corrupted file.');
        }

        return $plain;
    }

    private function readExactly($handle, int $length, string $label): string
    {
        if ($length === 0) {
            return '';
        }

        $buffer = '';

        while (strlen($buffer) < $length) {
            $chunk = fread($handle, $length - strlen($buffer));

            if ($chunk === false || $chunk === '') {
                throw new RuntimeException("Backup is truncated while reading {$label}.");
            }

            $buffer .= $chunk;
        }

        return $buffer;
    }

    private function wipe(string $key): void
    {
        if (function_exists('sodium_memzero')) {
            sodium_memzero($key);
        }
    }
}
