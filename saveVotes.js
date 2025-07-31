const admin = require("firebase-admin");
const { initializeApp } = require("firebase/app");
const { getDatabase, ref, set } = require("firebase/database");
const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));

// 🔐 Lire la clé FIREBASE_KEY depuis la variable d'environnement
console.log("🔐 Lecture de la clé FIREBASE_KEY...");
if (!process.env.FIREBASE_KEY) {
  throw new Error("❌ Erreur : variable d'environnement FIREBASE_KEY introuvable.");
}

// 🔓 Décoder la clé encodée en base64
let decodedKey;
try {
  decodedKey = JSON.parse(Buffer.from(process.env.FIREBASE_KEY, 'base64').toString('utf8'));
} catch (error) {
  throw new Error("❌ Erreur : la clé FIREBASE_KEY n'est pas un JSON valide (base64 attendu).");
}

const firebaseConfig = {
  credential: admin.credential.cert(decodedKey),
  databaseURL: "https://projecttogether-26e40-default-rtdb.europe-west1.firebasedatabase.app/",
};

console.log("🧩 Initialisation Firebase...");
admin.initializeApp(firebaseConfig);

const firebaseApp = initializeApp({
  databaseURL: firebaseConfig.databaseURL,
});

const db = getDatabase(firebaseApp);

// 🌐 Fonction pour récupérer les votes depuis l’API Top-Serveur
async function getVotes() {
  console.log("🌐 Récupération des votes depuis Top-Serveur...");
  const res = await fetch("https://api.top-serveurs.net/v1/servers/E35CNFSUG83F2X/players-ranking");
  const json = await res.json();
  console.log(`📥 ${json.players.length} joueurs récupérés.`);
  return json.players;
}

// 💾 Fonction principale de sauvegarde
async function saveVotes() {
  const moisActuel = new Date().toISOString().slice(0, 7); // ex: "2025-07"
  console.log("🚀 Démarrage du script de sauvegarde des votes...");

  const votes = await getVotes();

  console.log("🗃️ Sauvegarde des votes pour le mois :", moisActuel);

  const data = {};
  for (const player of votes) {
    const pseudo = player.playername.replace(/[.#$/[\]]/g, "_"); // nettoyer pour Firebase
    data[pseudo] = player.votes;
  }

  console.log("📤 Envoi des données vers Firebase...");
  await set(ref(db, `votes/${moisActuel}`), data);

  console.log(`✅ ${votes.length} votes enregistrés pour le mois ${moisActuel}.`);
}

// ▶️ Lancer le script

saveVotes().catch((err) => {
  console.error("❌ Erreur pendant l'enregistrement des votes :", err);
  process.exit(1); // en cas d'erreur
}).finally(() => {
  process.exit(0); // en cas de succès
});