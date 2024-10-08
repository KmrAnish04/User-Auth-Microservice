## Architecture Diagram

This diagram illustrates the Single Sign-On (SSO) architecture for my project. The system handles user authentication and session management across multiple applications, using Redis for session storage and Docker for containerization. It supports single logout and secure token-based authentication flow.

### 1. Single Sing On

![SSO Architecture](./Docs/Single-Sign-On_(SSO).gif)

### 2. Single Logout

![SSO Architecture](./Docs/Single-Logout_(SLO).gif)




To Do:
1. Add User Logout functionality
2. Add Rate Limiter for those routes which can be misused like hitting login, like, or something submit buttons again and again. 
3. Link normal account and google account of same person, if he logs in with these two accounts at different time, bcoz that time we will
   got to that from email that the same user using different accounts, so link both accounts.
4. Add Forgot Password Functionality of microservices.
5. Shift data storage task from local to Database (Redis Cache) like SSO_TOKEN_CACHE, USER_SESSION, APP_SESSION, APP_TOKENS etc
6. Integrate DB functions with other services. For example: if user likes the post then that like count should added in post model as well
   as user model in the MongoDB, so how to link these kind of tasks in case. (Kafka, Event Driven Arch., Saga)
7. Add Access ans Refresh Token Functionality
8. Make User Register SSO Microservice Functionality
9.  Make SSO Service with Google Auth Strategy
10. Create middleware for protected routes (like jwt authenticate in Devfolio)
11. Bug Fixing, Testing and Handling Corner Cases
12. Give Profile Photo upload feature while signup





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

### 1. To generate with openSSL (No Base64 Encoded):
- **Command:**
  ```sh
  openssl rand -hex 16
### 2. To generate With Cryto/HashIds (Base64 Encoded):
- **Command:**
  ```sh
  node ./src/generateAppTokens.js 
