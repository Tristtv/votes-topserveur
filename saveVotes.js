const { fetch } = require('undici');
const admin = require('firebase-admin');

// 🔐 Lire la clé depuis la variable d'environnement FIREBASE_KEY
console.log("🔐 Lecture de la clé FIREBASE_KEY...");
const firebaseKey = process.env.FIREBASE_KEY;

if (!firebaseKey) {
  console.error("❌ Erreur : variable d'environnement FIREBASE_KEY introuvable.");
  process.exit(1);
}

let serviceAccount;
try {
  serviceAccount = JSON.parse(firebaseKey);
} catch (error) {
  console.error("❌ Erreur : impossible de lire ou parser FIREBASE_KEY.");
  process.exit(1);
}

// 🔗 Initialiser Firebase
console.log("🧩 Initialisation Firebase...");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://projecttogether-26e40-default-rtdb.europe-west1.firebasedatabase.app/"
});

const db = admin.database();

// 🔧 Nettoyage du nom du joueur
function sanitize(name) {
  return name.replace(/[.#$/\[\]]/g, '_');
}

// 🔄 Récupération des votes depuis l’API
async function getVotes() {
  console.log("🌐 Récupération des votes depuis Top-Serveur...");
  const response = await fetch('https://api.top-serveurs.net/v1/servers/E35CNFSUG83F2X/players-ranking');
  if (!response.ok) {
    throw new Error(`Erreur API : ${response.status} ${response.statusText}`);
  }
  const data = await response.json();
  console.log(`📥 ${data.players.length} joueurs récupérés.`);
  return data.players;
}

// 💾 Enregistrement dans Firebase
async function saveVotes() {
  try {
    const players = await getVotes();
    const month = new Date().toISOString().slice(0, 7); // ex: "2025-07"

    console.log(`🗃️ Sauvegarde des votes pour le mois : ${month}`);

    const updates = {};
    players.forEach(player => {
      const safeName = sanitize(player.playername);
      updates[`${month}/${safeName}`] = player.votes;
    });

    console.log("📤 Envoi des données vers Firebase...");
    await db.ref('votes').update(updates);

    console.log(`✅ ${players.length} votes enregistrés pour le mois ${month}.`);
  } catch (error) {
    console.error("❌ Erreur pendant l'enregistrement des votes :", error);
    process.exit(1);
  }
}

// ▶️ Lancer le script
saveVotes();
// Exécuter la fonction saveVotes pour démarrer le processus
console.log("🚀 Démarrage du script de sauvegarde des votes...");