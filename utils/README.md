# Utility Scripts

This directory contains utility scripts for the project.

## File Encryption Utility

The `encrypt.js` script provides a simple way to encrypt and decrypt sensitive files before committing them to a repository. This is useful for protecting training data, scraping scripts, and other sensitive information.

### Prerequisites

- Node.js installed

### Usage

#### Encrypting a File

```bash
node encrypt.js encrypt path/to/file.js yourpassword
```

This will create an encrypted file at `path/to/file.js.enc`.

#### Decrypting a File

```bash
node encrypt.js decrypt path/to/file.js.enc yourpassword
```

This will create a decrypted file at `path/to/file.js`.

### Important Notes

- Store your encryption password securely - if you lose it, you won't be able to decrypt your files
- The encryption used is AES-256-CBC, which is secure for most purposes
- For extremely sensitive data, consider using more robust encryption tools
- Always add the original (unencrypted) files to your `.gitignore` to prevent accidental commits
