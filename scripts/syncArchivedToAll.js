const admin = require("firebase-admin");
const fs = require("fs");

// Carrega o ficheiro da conta de serviço
const serviceAccount = require("./Adminkey.json");

// Inicializa a app do Firebase
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function copyArchivedToAll() {
  try {
    const snapshot = await db.collection("services").get();
    
    if (snapshot.empty) {
      console.log("Nenhum documento encontrado.");
      return;
    }

    const batch = db.batch();

    snapshot.forEach(doc => {
      const allServicesRef = db.collection("allservices").doc(doc.id);
      batch.set(allServicesRef, doc.data());
    });

    await batch.commit();
    console.log("Todos os serviços arquivados foram copiados para allservices!");
  } catch (error) {
    console.error("Erro ao copiar documentos:", error);
  }
}

copyArchivedToAll();