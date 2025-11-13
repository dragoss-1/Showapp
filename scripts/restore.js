const admin = require("firebase-admin");
const fs = require("fs");

const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

//Alterar consoante os backups necessários repor
const collections = ['cars', 'clients', 'codigos', 'compras', 'purchases', 'services'];

async function restoreAll() {
  for (const collectionName of collections) {
    const backup = JSON.parse(fs.readFileSync(`./backup_${collectionName}.json`, 'utf-8'));

    for (const doc of backup) {
      if (!doc.id) {
        console.warn(`⚠️ Documento sem campo "id" ignorado em '${collectionName}'.`);
        continue;
      }

      const { id, ...data } = doc; // separa o id do resto dos dados
      await db.collection(collectionName).doc(id).set(data);
    }

    console.log(`✅ Coleção '${collectionName}' restaurada com sucesso.`);
  }

  console.log("🎉 Todas as coleções foram restauradas corretamente.");
}

restoreAll();