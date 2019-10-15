# OPRETURN Data parser & search

## Usage

#### Dependencies

Before running the application, the following dependencies need to be installed:

| Dependencies     | Version |
| ---------------- | ------- |
| NodeJS           | 10.15+  |
| PostgreSQL       | 10+     |
| Bitcoind         | 0.18.1  |

### Setup

Using psql or any other PostgreSQL client, create a new database:

```
$ createdb parser
```
Then, install NPM dependencies:

```
$ npm install
```

NOTE: In order for the parser to run, the RPC API has to be enabled on Bitcoind. 


### Usage

The following environment variables need to be set before starting the application:

- DB_USER
- DB_NAME
- DB_PASSWORD
- RPC_USERNAME
- RPC_PASSWORD
- NETWORK: testnet | mainnet
- LOG_LEVEL: info | debug | trace

Once the environment variables are set, you can run the program as in two steps:

Transpile Typescript to Javascript

```
$ npm run build
```

Start the application

```
$ node dist/index.js | npx bunyan -o short
```
