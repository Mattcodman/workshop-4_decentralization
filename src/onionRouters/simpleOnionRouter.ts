import bodyParser from "body-parser";
//import fetch from 'node-fetch';
import express from "express";
import crypto from "crypto";
import {BASE_ONION_ROUTER_PORT, REGISTRY_PORT} from "../config";




let lastReceivedEncryptedMessage: string | null = null;
let lastReceivedDecryptedMessage: string | null = null;
let lastMessageDestination: number | null = null;

let registeredNodes: number[] = [];


// Stockage des noeuds enregistrés
//let registeredNodes: RegisteredNode[] = [];

export async function simpleOnionRouter(nodeId: number) {
  const onionRouter = express();
  onionRouter.use(express.json());
  onionRouter.use(bodyParser.json());
  // Stockage des paires de clés privées pour chaque noeud
  const privateKeys: { [key: number]: crypto.KeyObject } = {}




  onionRouter.get("/status", (req, res) => {
    res.status(200).send('live');

  });




  // Route pour obtenir la clé privée d'un noeud
  onionRouter.get("/getPrivateKey", (req, res) => {
    const nodeId = Number(req.query.nodeId);
    const privateKey = privateKeys[nodeId];

    if (!privateKey) {
      return res.status(404).json({ error: 'Private key not found for the node' });
    }
    else
    {
      // Convertir la clé privée en format base64
      const privateKeyBase64 = privateKey.export({ type: 'pkcs8', format: 'pem' }).toString('base64');
      res.json({ result: privateKeyBase64 });
      return res.status(400).json({ result: privateKeyBase64 });
    }


  });


  // Route pour obtenir le dernier message reçu sous forme chiffrée
  onionRouter.get("/getLastReceivedEncryptedMessage", (req, res) => {
    res.json({ result: lastReceivedEncryptedMessage });
  });

  // Route pour obtenir le dernier message reçu sous forme déchiffrée
  onionRouter.get("/getLastReceivedDecryptedMessage", (req, res) => {
    res.json({ result: lastReceivedDecryptedMessage });
  });

  // Route pour obtenir la destination du dernier message reçu
  onionRouter.get("/getLastMessageDestination", (req, res) => {
    res.json({ result: lastMessageDestination });
  });




  // Route pour enregistrer un noeud
  onionRouter.post("/registerNode", (req, res) => {
    const { nodeId, pubKey } = req.body;

    const url = `http://localhost:${REGISTRY_PORT}/registerNode`;
    const body = JSON.stringify({ nodeId, pubKey });
    const headers = { 'Content-Type': 'application/json' };

    fetch(url, { method: 'POST', body, headers })
        .then(response => {
          if (response.ok) {
            res.status(201).json({ message: 'Node registered successfully' });
          } else {
            res.status(500).json({ error: 'Failed to register node' });
          }
        })
        .catch(error => {
          console.error('Error registering node:', error);
          res.status(500).json({ error: 'Failed to register node' });
        });

      });

  const registeredNodes: { nodeId: number, pubKey: string }[] = [];

  onionRouter.post("/getNodeRegistry", (req, res) => {
    console.log('test')
    console.log(registeredNodes)
    res.json({ nodes: registeredNodes })
  });





  const server = onionRouter.listen(BASE_ONION_ROUTER_PORT + nodeId, () => {
    console.log(
      `Onion router ${nodeId} is listening on port ${
        BASE_ONION_ROUTER_PORT + nodeId
      }`
    );
  });





  return server;



}



