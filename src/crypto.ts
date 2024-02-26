import { webcrypto } from "crypto";
import {randomBytes} from "crypto";


// #############
// ### Utils ###
// #############

// Function to convert ArrayBuffer to Base64 string
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  return Buffer.from(buffer).toString("base64");
}

// Function to convert Base64 string to ArrayBuffer
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  var buff = Buffer.from(base64, "base64");
  return buff.buffer.slice(buff.byteOffset, buff.byteOffset + buff.byteLength);
}

// ################
// ### RSA keys ###
// ################

// Generates a pair of private / public RSA keys
type GenerateRsaKeyPair = {
  publicKey: webcrypto.CryptoKey;
  privateKey: webcrypto.CryptoKey;
};

//
export async function generateRsaKeyPair(): Promise<GenerateRsaKeyPair> {
  const algorithm = "RSA-OAEP"; // Specify the desired RSA encryption algorithm

  // Generate the RSA key pair
  const { publicKey, privateKey } = await webcrypto.subtle.generateKey(
      {
        name: algorithm,
        modulusLength: 2048, // Specify the desired modulus length
        publicExponent: new Uint8Array([0x01, 0x00, 0x01]), // Specify the public exponent
        hash: { name: "SHA-256" }, // Specify the desired hash algorithm
      },
      true, // Specify that the keys are extractable
      ["encrypt", "decrypt"]
  );

  return { publicKey, privateKey };
}

// Export a crypto public key to a base64 string format
export async function exportPubKey(key: webcrypto.CryptoKey): Promise<string> {
  const exportedKey = await webcrypto.subtle.exportKey("spki", key);
  const exportedKeyBuffer = Buffer.from(exportedKey);
  const base64Key = exportedKeyBuffer.toString("base64");
  return base64Key;
}

// Export a crypto private key to a base64 string format
export async function exportPrvKey(
  key: webcrypto.CryptoKey | null
): Promise<string | null> {
  if (key === null) {
    return null;
  }
  const exportedKey = await webcrypto.subtle.exportKey("pkcs8", key);
  const exportedKeyBuffer = Buffer.from(exportedKey);
  const base64Key = exportedKeyBuffer.toString("base64");
  return base64Key;
  // TODO implement this function to return a base64 string version of a private key

}

// Import a base64 string public key to its native format
export async function importPubKey(
  strKey: string
): Promise<webcrypto.CryptoKey> {
  // TODO implement this function to go back from the result of the exportPubKey function to it's native crypto key object

  // remove this
  return {} as any;
}

// Import a base64 string private key to its native format
export async function importPrvKey(
  strKey: string
): Promise<webcrypto.CryptoKey> {
  const base64KeyBuffer = Buffer.from(strKey, "base64");
  const keyData = new Uint8Array(base64KeyBuffer);
  const importedKey = await webcrypto.subtle.importKey(
      "pkcs8",
      keyData,
      { name: "RSA-OAEP", hash: "SHA-256" },
      true,
      ["decrypt"] // Specify the key's purpose
  );

  return importedKey;
}

// Encrypt a message using an RSA public key
export async function rsaEncrypt(
  b64Data: string,
  strPublicKey: string
): Promise<string> {
  const publicKeyBuffer = Buffer.from(strPublicKey, "base64");
  const publicKeyData = new Uint8Array(publicKeyBuffer);
  const publicKey = await webcrypto.subtle.importKey(
      "spki",
      publicKeyData,
      { name: "RSA-OAEP", hash: "SHA-256" },
      true,
      ["encrypt"] // Specify the key's purpose
  );

  const dataBuffer = Buffer.from(b64Data, "base64");
  const data = new Uint8Array(dataBuffer);
  const encrypted = await webcrypto.subtle.encrypt(
      { name: "RSA-OAEP" },
      publicKey,
      data
  );

  const encryptedBuffer = Buffer.from(encrypted);
  const encryptedData = encryptedBuffer.toString("base64");
  return encryptedData;
}

// Decrypts a message using an RSA private key
export async function rsaDecrypt(
  data: string,
  privateKey: webcrypto.CryptoKey
): Promise<string> {
  const encryptedData = Buffer.from(data, "base64");
  const decrypted = await webcrypto.subtle.decrypt(
      { name: "RSA-OAEP" },
      privateKey,
      encryptedData
  );

  const decryptedBuffer = Buffer.from(decrypted);
  const decryptedData = decryptedBuffer.toString("utf8");
  return decryptedData;
}

// ######################
// ### Symmetric keys ###
// ######################

// Generates a random symmetric key
export async function createRandomSymmetricKey(): Promise<webcrypto.CryptoKey>{
  const key = await webcrypto.subtle.generateKey(
      {
        name: "AES-GCM",
        length: 256,
      },
      true,
      ["encrypt", "decrypt"]
  );

  return key;
}

// Export a crypto symmetric key to a base64 string format
export async function exportSymKey(key: webcrypto.CryptoKey): Promise<string> {
  const exportedKey = await webcrypto.subtle.exportKey("raw", key);
  const exportedKeyBuffer = Buffer.from(exportedKey);
  const base64Key = exportedKeyBuffer.toString("base64");
  return base64Key;
}

// Import a base64 string format to its crypto native format
export async function importSymKey(
  strKey: string
): Promise<webcrypto.CryptoKey> {
  const keyBuffer = Uint8Array.from(atob(strKey), c => c.charCodeAt(0));
  const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyBuffer,
      { name: "AES-CBC" },
      false,
      ["encrypt", "decrypt"]
  );
  return cryptoKey;
}

// Encrypt a message using a symmetric key
export async function symEncrypt(
  key: webcrypto.CryptoKey,
  data: string
): Promise<string> {
  const encoder = new TextEncoder();
  const encodedData = encoder.encode(data);

  const encryptedData = await webcrypto.subtle.encrypt(
      { name: "AES-GCM", iv: crypto.getRandomValues(new Uint8Array(12)) },
      key,
      encodedData
  );

  const encryptedBuffer = Buffer.from(encryptedData);
  const base64Encrypted = encryptedBuffer.toString("base64");
  return base64Encrypted;
}

// Decrypt a message using a symmetric key
export async function symDecrypt(
  strKey: string,
  encryptedData: string
): Promise<string> {
  const keyBuffer = Buffer.from(strKey, "base64");
  const key = await webcrypto.subtle.importKey(
      "raw",
      keyBuffer,
      { name: "AES-GCM" },
      true,
      ["encrypt", "decrypt"]
  );

  const encryptedBuffer = Buffer.from(encryptedData, "base64");
  const decryptedData = await webcrypto.subtle.decrypt(
      { name: "AES-GCM", iv: new Uint8Array(12) },
      key,
      encryptedBuffer
  );

  const decoder = new TextDecoder();
  const decryptedText = decoder.decode(decryptedData);
  return decryptedText;
}
