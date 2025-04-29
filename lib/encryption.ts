import crypto from "crypto"

// This should be a 32-byte key stored in environment variables
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || ""

if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 32) {
  console.warn("Warning: ENCRYPTION_KEY is not properly set. It should be a 32-byte string.")
}

export function encrypt(text: string): string {
  if (!text) return ""

  try {
    // Generate a random initialization vector
    const iv = crypto.randomBytes(16)

    // Create cipher using AES-256-CBC
    const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(ENCRYPTION_KEY), iv)

    // Encrypt the text
    let encrypted = cipher.update(text, "utf8", "hex")
    encrypted += cipher.final("hex")

    // Return IV + encrypted data as a single string
    return iv.toString("hex") + ":" + encrypted
  } catch (error) {
    console.error("Encryption error:", error)
    throw new Error("Failed to encrypt data")
  }
}

export function decrypt(encryptedText: string): string {
  if (!encryptedText) return ""

  try {
    // Split the IV and encrypted data
    const parts = encryptedText.split(":")
    if (parts.length !== 2) {
      throw new Error("Invalid encrypted format")
    }

    const iv = Buffer.from(parts[0], "hex")
    const encrypted = parts[1]

    // Create decipher
    const decipher = crypto.createDecipheriv("aes-256-cbc", Buffer.from(ENCRYPTION_KEY), iv)

    // Decrypt the data
    let decrypted = decipher.update(encrypted, "hex", "utf8")
    decrypted += decipher.final("utf8")

    return decrypted
  } catch (error) {
    console.error("Decryption error:", error)
    throw new Error("Failed to decrypt data")
  }
}
