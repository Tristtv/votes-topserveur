const admin = require("firebase-admin");
const { initializeApp } = require("firebase/app");
const { getDatabase, ref, get, update } = require("firebase/database");
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
  throw new Error("❌ Erreur : la clé FIREBASE_KEY n'est pas un JSON base64 valide.");
}

// 🔧 Configuration Firebase Admin
console.log("🧩 Initialisation Firebase...");
admin.initializeApp({
  credential: admin.credential.cert(decodedKey),
  databaseURL: "https://projecttogether-26e40-default-rtdb.europe-west1.firebasedatabase.app/",
});

// 🔧 Initialisation Firebase SDK client
const firebaseApp = initializeApp({
  databaseURL: "https://projecttogether-26e40-default-rtdb.europe-west1.firebasedatabase.app/",
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
  const now = new Date();
  const dateFr = new Date(now.getTime() + 2 * 60 * 60 * 1000); // UTC+2 (heure de Paris)
  const moisActuel = dateFr.toISOString().slice(0, 7); // ex: "2025-08"
  console.log("🚀 Démarrage du script de sauvegarde des votes...");

  const votes = await getVotes();

  console.log("🗃️ Sauvegarde des votes pour le mois :", moisActuel);

  const data = {};
  for (const player of votes) {
    const pseudo = player.playername.replace(/[.#$/[\]]/g, "_"); // nettoyer pour Firebase
    data[pseudo] = player.votes;
  }

  const voteRef = ref(db, `votes/${moisActuel}`);

  // 🔄 Récupérer les données existantes pour les fusionner
  const snapshot = await get(voteRef);
  const existing = snapshot.exists() ? snapshot.val() : {};

  // 🔁 Fusionner (addition des votes si déjà présent)
  for (const pseudo in data) {
    if (existing[pseudo]) {
      existing[pseudo] += data[pseudo]; // ajouter les votes
    } else {
      existing[pseudo] = data[pseudo]; // ou créer la valeur
    }
  }

  console.log("📤 Envoi des données fusionnées vers Firebase...");
  await update(voteRef, existing);

  console.log(`✅ ${votes.length} votes fusionnés et enregistrés pour le mois ${moisActuel}.`);
}

// ▶️ Lancer le script
saveVotes().catch((err) => {
  console.error("❌ Erreur pendant l'enregistrement des votes :", err);
  process.exit(1);
}).finally(() => {
  process.exit(0);
});
// Fin du script
console.log("🛑 Script terminé.");