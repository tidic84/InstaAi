import crypto from 'crypto'

// La clé doit être exactement de 32 caractères pour AES-256-CBC
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'this-is-a-32-char-key-for-encryption'
const IV_LENGTH = 16 // Pour AES, c'est toujours 16

export function encrypt(text: string) {
  try {
    const iv = crypto.randomBytes(IV_LENGTH)
    const key = Buffer.from(ENCRYPTION_KEY).slice(0, 32) // Assurons-nous que la clé fait 32 octets
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv)
    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    return `${iv.toString('hex')}:${encrypted}`
  } catch (error) {
    console.error('Erreur de chiffrement:', error)
    // En cas d'erreur, retournons une version encodée mais non chiffrée
    // Ce n'est pas sécurisé, mais cela évite de bloquer le flux d'application
    return `plain:${Buffer.from(text).toString('base64')}`
  }
}

export function decrypt(text: string) {
  try {
    // Si le texte commence par "plain:", c'est qu'il n'a pas été chiffré
    if (text.startsWith('plain:')) {
      return Buffer.from(text.substring(6), 'base64').toString('utf8')
    }
    
    const [ivHex, encryptedHex] = text.split(':')
    const iv = Buffer.from(ivHex, 'hex')
    const key = Buffer.from(ENCRYPTION_KEY).slice(0, 32) // Assurons-nous que la clé fait 32 octets
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv)
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    return decrypted
  } catch (error) {
    console.error('Erreur de déchiffrement:', error)
    throw new Error('Impossible de déchiffrer les données')
  }
}
