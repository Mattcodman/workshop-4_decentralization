import express from "express";
import { BASE_ONION_ROUTER_PORT, REGISTRY_PORT } from "../config";
import axios from 'axios';
import {
  rsaDecrypt,
  symDecrypt,
  exportPrvKey,
  generateRsaKeyPair, exportPubKey
} from "../crypto";

export async function simpleOnionRouter(nodeId: number) {
  const onionRouter = express();
  onionRouter.use(express.json());

  let lastReceivedEncryptedMessage: string | null = null;
  let lastReceivedDecryptedMessage: string | null = null;
  let lastMessageDestination: number | null = null;

  const { publicKey, privateKey } = await generateRsaKeyPair();
  const pubKey = await exportPubKey(publicKey);

  onionRouter.get("/status", (_req, res) => res.status(200).send('live'));

  onionRouter.get("/getLastReceivedEncryptedMessage", (_req, res) => res.json({
    result: lastReceivedEncryptedMessage }));

  onionRouter.get("/getLastReceivedDecryptedMessage", (_req, res) => res.json({
    result: lastReceivedDecryptedMessage }));

  onionRouter.get("/getLastMessageDestination", (_req, res) => res.json({
    result: lastMessageDestination }));

  onionRouter.get("/getPrivateKey", async (_req, res) => {
    const prvKey = await exportPrvKey(privateKey);
    return res.json({ result: prvKey });
  });

  onionRouter.post('/message', async (req, res) => {
    const { message } = req.body;

    try {
      const encryptedKey = message.substring(0, 344);
      const restMessage = message.substring(344);

      const decryptedSymKey = await rsaDecrypt(encryptedKey, privateKey);
      const decryptedContent = await symDecrypt(decryptedSymKey, restMessage);

      const destinationId = parseInt(decryptedContent.substring(0, 10), 10);
      const originalMessage = decryptedContent.substring(10);

      lastMessageDestination = destinationId;
      lastReceivedEncryptedMessage = message;
      lastReceivedDecryptedMessage = originalMessage;

      await axios.post(`http://localhost:${lastMessageDestination}/message`, { message: originalMessage });
      res.status(200).send("success");
    } catch (error) {
      console.error("Error processing message:", error);
      res.status(500).send("Error processing message.");
    }
  });

  const server = onionRouter.listen(BASE_ONION_ROUTER_PORT + nodeId, () => {
    console.log(`Onion router ${nodeId} is listening on port ${BASE_ONION_ROUTER_PORT + nodeId}`);
  });

  // Register node with the registry immediately after server starts
  axios.post(`http://localhost:${REGISTRY_PORT}/registerNode`, { nodeId, pubKey });

  return server;
}
