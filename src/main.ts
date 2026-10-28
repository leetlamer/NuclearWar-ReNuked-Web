import "./style.css";
import { GameApp } from "./GameApp";
const app = new GameApp();
Object.assign(window, { nuclearWar: app });
app.initialize().catch((error) => {
  document.querySelector("#error")!.textContent = String(error);
  document.querySelector("#load-status")!.textContent = "Unable to load game";
  console.error(error);
});
