const admin = require("firebase-admin");
const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));

// 🔐 Lecture de la clé FIREBASE_KEY depuis l'environnement
console.log("🔐 Lecture de la clé FIREBASE_KEY...");
if (!process.env.FIREBASE_KEY) {
  throw new Error("❌ Erreur : variable d'environnement FIREBASE_KEY introuvable.");
}

// 🧩 Initialisation Firebase Admin SDK
console.log("🧩 Initialisation Firebase...");
admin.initializeApp({
  credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_KEY)),
  databaseURL: "https://projecttogether-26e40-default-rtdb.europe-west1.firebasedatabase.app/"
});

const db = admin.database();

// 🌐 Fonction pour récupérer les votes depuis Top-Serveur
async function getVotes() {
  console.log("🌐 Récupération des votes depuis Top-Serveur...");
  const res = await fetch("https://api.top-serveurs.net/v1/servers/E35CNFSUG83F2X/players-ranking");
  const json = await res.json();
  console.log(`📥 ${json.players.length} joueurs récupérés.`);
  return json.players;
}

// 💾 Fonction principale de sauvegarde des votes
async function saveVotes() {
  const moisActuel = new Date().toISOString().slice(0, 7); // ex: "2025-07"
  console.log("🚀 Sauvegarde des votes pour le mois :", moisActuel);

  const votes = await getVotes();

  // Nettoyer les pseudos et préparer les données
  const data = {};
  for (const player of votes) {
    const pseudo = player.playername.replace(/[.#$/[\]]/g, "_");
    data[pseudo] = player.votes;
  }

  // Envoi des données
  console.log("📤 Envoi des données vers Firebase...");
  await db.ref(`votes/${moisActuel}`).set(data);

  console.log(`✅ ${votes.length} votes enregistrés pour le mois ${moisActuel}.`);
}

// ▶️ Lancer le script
saveVotes().catch((err) => {
  console.error("❌ Erreur pendant l'enregistrement des votes :", err);
});
