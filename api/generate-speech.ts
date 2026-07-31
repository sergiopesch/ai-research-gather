import { generateSpeechHandler } from "../server/handlers.js";

export const config = { api: { bodyParser: { sizeLimit: "1mb" } } };

export default generateSpeechHandler;
