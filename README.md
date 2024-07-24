API's = 
[
   Authentication: /userid/auth/login, /userid/auth/logout
   Authorization: /userid/authr/signin, /userid/signout
]

// Auth/Authr Strategies
1. Email Auth
2. Phone Number Auth (OTP signIn/LogIn)
3. Email OTP SignIn
4. Google Auth
5. Github Auth
6. Twitter Auth
7. Facebook Auth
8. Instagram Auth
9. SSO

To Generate RSA Private and Public Key with openSSL

1. Private Key: 
   Syntax: genrsa -out filename.ext byte
   Example: genrsa -out ./config/keys/jwtPrivate.key 2048

2. Public Key
   Syntax: rsa -in PrivateKeyFilePath.ext -pubout -out PublicKeyFileName.ext
   Example: rsa -in ./config/keys/jwtPrivate.key -pubout -out ./config/keys/jwtPublic.key





## Generating RSA Private and Public Keys with OpenSSL

To generate RSA private and public keys, follow these steps:

### 1. Private Key

- **Syntax:**
  ```sh
  genrsa -out filename.ext bitsize
- **Example:**
  ```sh
  openssl genrsa -out ./config/keys/jwtPrivate.key 2048
### 2. Private Key

- **Syntax:**
  ```sh
  openssl rsa -in PrivateKeyFilePath.ext -pubout -out PublicKeyFileName.ext
- **Example:**
  ```sh
  openssl rsa -in ./config/keys/jwtPrivate.key -pubout -out ./config/keys/jwtPublic.key
### Explanation:

1. **Command `openssl`**: Make sure to include the `openssl` command in the instructions to specify the tool being used.
2. **Private Key Generation**:
   - The command `openssl genrsa -out ./config/keys/jwtPrivate.key 2048` generates a 2048-bit private key and saves it to the specified file.
3. **Public Key Generation**:
   - The command `openssl rsa -in ./config/keys/jwtPrivate.key -pubout -out ./config/keys/jwtPublic.key` reads the private key file, extracts the public key, and saves it to the specified file.

