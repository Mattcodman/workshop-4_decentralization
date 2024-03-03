import bodyParser from "body-parser";
import express from "express";
import { BASE_USER_PORT } from "../config";

export type SendMessageBody = {
  message: string;
  destinationUserId: number;
};

export type Message = {
  content: string;
};



let lastReceivedMessage: Message | null = null;
let lastSentMessage: Message | null = null;




export async function user(userId: number) {
  const _user = express();
  _user.use(express.json());
  _user.use(bodyParser.json());

  // TODO implement the status route
  _user.get("/status", (req, res) => {
    res.status(200).send('live');


  });

  _user.post("/message", (req, res) => {
    const { message }: { message: string } = req.body;
    //message= "AZERT";

    // Mettez à jour la variable lastReceivedMessage avec le message reçu
    lastReceivedMessage = { content: message };

    res.status(200).send('Message received');

  });
  // Route pour obtenir le dernier message reçu
  _user.get("/getLastReceivedMessage", async (req, res) => {
    // Renvoie le dernier message reçu au format JSON
    res.status(200).json({ result: lastReceivedMessage });
  });

  // Route pour obtenir le dernier message envoyé
  _user.get("/getLastSentMessage", async (req, res) => {
    // Renvoie le dernier message envoyé au format JSON
    res.status(200).json({ result: lastSentMessage });
  });






  const server = _user.listen(BASE_USER_PORT + userId, () => {
    console.log(
      `User ${userId} is listening on port ${BASE_USER_PORT + userId}`
    );
  });

  return server;
}
