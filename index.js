const {
  SecretsManagerClient,
  GetSecretValueCommand,
} = require("@aws-sdk/client-secrets-manager");

const express = require("express");
const helmet = require("helmet");
const cors = require("cors");

const app = new express();

app.use(express.json());
app.use(helmet());
app.use(cors());

app.get("/secret/:id", (req, res) => {
  res.status(200).json({ value: process.env[req.params.id] });
});

class SecretManager {
  client = new SecretsManagerClient({
    region: "ap-south-1",
  });

  secretIds = {
    development: "tc_stage",
    production: "tc_prod",
  };

  #setSecrets(secrets) {
    const parsed = JSON.parse(secrets);
    Object.keys(parsed).map((e) => (process.env[e] = parsed[e]));
  }

  async fetchSecrets(environment) {
    try {
      const response = await this.client.send(
        new GetSecretValueCommand({
          SecretId: this.secretIds[environment],
          VersionStage: "AWSCURRENT",
        })
      );

      this.#setSecrets(response.SecretString);
    } catch (error) {
      throw error;
    }
  }
}

const secretManager = new SecretManager();

secretManager
  .fetchSecrets(process.env.NODE_ENV)
  .then((res) => {
    app.listen(3000);
  })
  .catch((err) => {
    console.log(err);
  });
