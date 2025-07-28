import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getDatabase, ref, get, child } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";

// 🔐 Ta config Firebase ici (pas ta clé privée !)
const firebaseConfig = {
  databaseURL: "https://projecttogether-26e40-default-rtdb.europe-west1.firebasedatabase.app"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const classementEl = document.getElementById("classement");
const moisSelect = document.getElementById("mois");
const recherche = document.getElementById("recherche");

async function chargerVotes() {
  const snapshot = await get(child(ref(db), "votes"));
  if (!snapshot.exists()) return;

  const data = snapshot.val();
  const moisList = Object.keys(data).sort().reverse();

  moisSelect.innerHTML = moisList.map(mois => `<option value="${mois}">${mois}</option>`).join("");
  afficherClassement(moisList[0], data[moisList[0]]);

  moisSelect.addEventListener("change", () => {
    afficherClassement(moisSelect.value, data[moisSelect.value]);
  });

  recherche.addEventListener("input", () => {
    afficherClassement(moisSelect.value, data[moisSelect.value]);
  });
}

function afficherClassement(mois, votes) {
  const terme = recherche.value.toLowerCase();
  const joueurs = Object.entries(votes)
    .filter(([nom]) => nom.toLowerCase().includes(terme))
    .sort(([, a], [, b]) => b - a);

  classementEl.innerHTML = joueurs.map(
    ([nom, score]) => `<li><strong>${nom}</strong><span>${score} votes</span></li>`
  ).join("");
}

chargerVotes();
