const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function backupFirestore() {
  const collections = await db.listCollections();

  for (const collection of collections) {
    const snapshot = await collection.get();
    const data = [];

    snapshot.forEach(doc => {
      data.push({ id: doc.id, ...doc.data() });
    });

    const filePath = path.join(__dirname, `backup_${collection.id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`✅ Backup da coleção '${collection.id}' salvo em: ${filePath}`);
  }
}

backupFirestore()
  .then(() => console.log("🎉 Backup completo!"))
  .catch(err => console.error("❌ Erro no backup:", err));
