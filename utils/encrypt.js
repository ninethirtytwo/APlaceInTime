/**
 * Simple file encryption/decryption utility
 * 
 * This script provides basic encryption for sensitive files like training data
 * and scraping scripts. It's meant as a basic protection layer, not for
 * high-security applications.
 * 
 * Usage:
 * - To encrypt: node encrypt.js encrypt <file> <password>
 * - To decrypt: node encrypt.js decrypt <file.enc> <password>
 */

const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

// Configuration
const ALGORITHM = 'aes-256-cbc';
const ENCODING = 'hex';

/**
 * Encrypts a file
 * @param {string} filePath - Path to the file to encrypt
 * @param {string} password - Password for encryption
 */
function encryptFile(filePath, password) {
  try {
    // Read the file
    const fileData = fs.readFileSync(filePath, 'utf8');
    
    // Generate a salt and key
    const salt = crypto.randomBytes(16);
    const key = crypto.scryptSync(password, salt, 32);
    
    // Generate an initialization vector
    const iv = crypto.randomBytes(16);
    
    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    // Encrypt the data
    let encrypted = cipher.update(fileData, 'utf8', ENCODING);
    encrypted += cipher.final(ENCODING);
    
    // Create output filename
    const outputPath = `${filePath}.enc`;
    
    // Write the encrypted data with salt and IV prepended
    fs.writeFileSync(
      outputPath,
      salt.toString(ENCODING) + 
      iv.toString(ENCODING) + 
      encrypted
    );
    
    console.log(`File encrypted successfully: ${outputPath}`);
    return outputPath;
  } catch (error) {
    console.error('Encryption failed:', error.message);
    return null;
  }
}

/**
 * Decrypts a file
 * @param {string} filePath - Path to the encrypted file
 * @param {string} password - Password for decryption
 */
function decryptFile(filePath, password) {
  try {
    // Read the encrypted file
    const fileData = fs.readFileSync(filePath, ENCODING);
    
    // Extract salt, IV, and encrypted data
    const salt = Buffer.from(fileData.slice(0, 32), ENCODING);
    const iv = Buffer.from(fileData.slice(32, 64), ENCODING);
    const encrypted = fileData.slice(64);
    
    // Generate key from password and salt
    const key = crypto.scryptSync(password, salt, 32);
    
    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    
    // Decrypt the data
    let decrypted = decipher.update(encrypted, ENCODING, 'utf8');
    decrypted += decipher.final('utf8');
    
    // Create output filename (remove .enc extension)
    const outputPath = filePath.endsWith('.enc') 
      ? filePath.slice(0, -4) 
      : `${filePath}.decrypted`;
    
    // Write the decrypted data
    fs.writeFileSync(outputPath, decrypted, 'utf8');
    
    console.log(`File decrypted successfully: ${outputPath}`);
    return outputPath;
  } catch (error) {
    console.error('Decryption failed:', error.message);
    return null;
  }
}

// Command line interface
function main() {
  const args = process.argv.slice(2);
  
  if (args.length !== 3) {
    console.log('Usage:');
    console.log('  To encrypt: node encrypt.js encrypt <file> <password>');
    console.log('  To decrypt: node encrypt.js decrypt <file.enc> <password>');
    return;
  }
  
  const [action, filePath, password] = args;
  
  if (action === 'encrypt') {
    encryptFile(filePath, password);
  } else if (action === 'decrypt') {
    decryptFile(filePath, password);
  } else {
    console.error('Invalid action. Use "encrypt" or "decrypt".');
  }
}

// Run the script if called directly
if (require.main === module) {
  main();
}

module.exports = { encryptFile, decryptFile };
