
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

To Do:
1. Add User Logout functionality
2. Shift data storage task from local to Database (Redis Cache) like SSO_TOKEN_CACHE, USER_SESSION, APP_SESSION, APP_TOKENS etc
3. Make SSO Service with Google Auth Strategy
4. Make User Register SSO Microservice Functionality
5. Add Access ans Refresh Token Functionality
6. Add Forgot Password Functionality
7. Add Rate Limiter for those routes which can be misused like hitting login, like, or something submit buttons again and again. 
8. Integrate DB functions with other services. For example: if user likes the post then that like count 
   should added in post model as well as user model in the MongoDB, so how to link these kind of tasks in case
   of microservices.
9. Bug Fixing, Testing and Handling Corner Cases
10. Give Profile Photo upload feature while signup





## Generating RSA Private and Public Keys with OpenSSL

To generate RSA private and public keys, follow these steps:

### 1. Private Key

- **Syntax:**
  ```sh
  openssl genrsa -out filename.ext bitsize
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



## Generating App Tokens

To generate tokens for applications that need to access the authentication microservice, follow these steps:

### 1. To generate with openSSL (No Base64):
- **Command:**
  ```sh
  openssl rand -hex 16
### 2. To generate With Cryto/HashIds (Base64):
- **Command:**
  ```sh
  node ./src/generateAppTokens.js 