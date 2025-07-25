const { fetch } = require('undici');
const admin = require('firebase-admin');

// 🔐 Lire la clé depuis la variable d'environnement FIREBASE_KEY
const firebaseKey = process.env.FIREBASE_KEY;

if (!firebaseKey) {
  console.error('❌ Erreur : variable d\'environnement FIREBASE_KEY introuvable.');
  process.exit(1);
}

let serviceAccount;
try {
  serviceAccount = JSON.parse(firebaseKey);
} catch (error) {
  console.error('❌ Erreur : impossible de lire ou parser FIREBASE_KEY.');
  process.exit(1);
}

// 🔗 Initialiser Firebase avec la clé et l’URL de ta base
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://projecttogether-26e40-default-rtdb.europe-west1.firebasedatabase.app/"
});

const db = admin.database();

// 🔄 Fonction pour récupérer les votes depuis l’API Top-Serveur
async function getVotes() {
  const response = await fetch('https://api.top-serveurs.net/v1/servers/E35CNFSUG83F2X/players-ranking');
  const data = await response.json();
  return data.players;
}

// 💾 Fonction pour enregistrer les votes dans Firebase
async function saveVotes() {
  try {
    const players = await getVotes();
    const month = new Date().toISOString().slice(0, 7); // Format YYYY-MM

    const updates = {};
players.forEach(player => {
  const safeName = player.playername.replace(/[.#$/\[\]]/g, '_'); // remplace les caractères interdits
  updates[`${month}/${safeName}`] = player.votes;
});


    await db.ref('votes').update(updates);

    console.log(`✅ ${players.length} votes enregistrés pour le mois ${month}.`);
  } catch (error) {
    console.error('❌ Erreur pendant l\'enregistrement des votes :', error);
  }
}

// ▶️ Exécuter
saveVotes();
// Exécuter la fonction toutes les 24 heures