import { Keypair } from "@solana/web3.js";
import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  createHash,
} from "node:crypto";
import bs58 from "bs58";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;

function deriveKey(secret: string): Buffer {
  return createHash("sha256").update(secret).digest();
}

export function generateKeypair(): Keypair {
  return Keypair.generate();
}

export function keypairFromPrivateKey(privateKeyBase58: string): Keypair {
  const decoded = bs58.decode(privateKeyBase58);
  return Keypair.fromSecretKey(decoded);
}

export function encryptPrivateKey(
  privateKeyBase58: string,
  encryptionKey: string,
): { iv: string; authTag: string; ciphertext: string } {
  const key = deriveKey(encryptionKey);
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  const ciphertext = Buffer.concat([
    cipher.update(Buffer.from(privateKeyBase58, "utf-8")),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return {
    iv: iv.toString("hex"),
    authTag: authTag.toString("hex"),
    ciphertext: ciphertext.toString("hex"),
  };
}

export function decryptPrivateKey(
  encrypted: { iv: string; authTag: string; ciphertext: string },
  encryptionKey: string,
): string {
  const key = deriveKey(encryptionKey);
  const decipher = createDecipheriv(
    ALGORITHM,
    key,
    Buffer.from(encrypted.iv, "hex"),
  );
  decipher.setAuthTag(Buffer.from(encrypted.authTag, "hex"));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encrypted.ciphertext, "hex")),
    decipher.final(),
  ]);

  return decrypted.toString("utf-8");
}

export function getPublicKey(privateKeyBase58: string): string {
  const keypair = keypairFromPrivateKey(privateKeyBase58);
  return keypair.publicKey.toBase58();
}

export function privateKeyToKeypair(privateKeyBase58: string): Keypair {
  return keypairFromPrivateKey(privateKeyBase58);
}
