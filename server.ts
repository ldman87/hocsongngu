import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, setDoc, deleteDoc } from "firebase/firestore";

const app = express();
const PORT = 3000;
const REGISTRATIONS_FILE = path.join(process.cwd(), "registrations.json");

app.use(express.json());

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyC1MxHW2X1aM5StrzqyybiYO5GDv6r37CQ",
  authDomain: "gen-lang-client-0903900820.firebaseapp.com",
  projectId: "gen-lang-client-0903900820",
  storageBucket: "gen-lang-client-0903900820.firebasestorage.app",
  messagingSenderId: "927393458628",
  appId: "1:927393458628:web:6d4a772d12df9908ad9c91"
};

let db: any = null;
try {
  const firebaseApp = initializeApp(firebaseConfig);
  db = getFirestore(firebaseApp, "ai-studio-8d2b9b2a-cce2-43f8-985a-681b713028a0");
  console.log("Firebase initialized successfully on server-side.");
} catch (error) {
  console.error("Failed to initialize Firebase on server-side:", error);
}

// Helper: Read registrations from local JSON file
function readLocalRegistrations(): any[] {
  try {
    if (fs.existsSync(REGISTRATIONS_FILE)) {
      const data = fs.readFileSync(REGISTRATIONS_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("Error reading local registrations file:", error);
  }
  return [];
}

// Helper: Write registrations to local JSON file
function writeLocalRegistrations(registrations: any[]) {
  try {
    fs.writeFileSync(REGISTRATIONS_FILE, JSON.stringify(registrations, null, 2), "utf-8");
  } catch (error) {
    console.error("Error writing local registrations file:", error);
  }
}

// Sync from Firestore to Local File on Startup
async function syncFromFirestore() {
  if (!db) return;
  try {
    console.log("Syncing registrations from Firestore...");
    const querySnapshot = await getDocs(collection(db, "registrations"));
    const registrations: any[] = [];
    querySnapshot.forEach((doc) => {
      registrations.push({ ...doc.data(), id: doc.id });
    });
    if (registrations.length > 0) {
      writeLocalRegistrations(registrations);
      console.log(`Synced ${registrations.length} registrations from Firestore.`);
    }
  } catch (error) {
    console.error("Error syncing from Firestore on startup:", error);
  }
}

// Initialize registrations.json if not exists
if (!fs.existsSync(REGISTRATIONS_FILE)) {
  writeLocalRegistrations([]);
}

// API Routes
app.get("/api/registrations", (req, res) => {
  const data = readLocalRegistrations();
  res.json(data);
});

app.post("/api/registrations", async (req, res) => {
  const { studentName, selectedSubjects, timestamp, updatedAt } = req.body;
  if (!studentName) {
    return res.status(400).json({ error: "studentName is required" });
  }

  const registrations = readLocalRegistrations();
  const existingIndex = registrations.findIndex(r => r.studentName === studentName);

  const registrationData = {
    studentName,
    selectedSubjects: selectedSubjects || [],
    timestamp,
    updatedAt
  };

  if (existingIndex >= 0) {
    registrations[existingIndex] = registrationData;
  } else {
    registrations.push(registrationData);
  }

  // Always write locally first (guarantees success to client)
  writeLocalRegistrations(registrations);

  // Background sync to Firestore (async, does not block client response)
  if (db) {
    setDoc(doc(db, "registrations", studentName), registrationData)
      .then(() => console.log(`Backed up registration for ${studentName} to Firestore.`))
      .catch((err: any) => console.error(`Failed to back up registration for ${studentName} to Firestore:`, err));
  }

  res.json({ success: true, registration: registrationData });
});

// Admin API to clear data
app.post("/api/registrations/clear", async (req, res) => {
  writeLocalRegistrations([]);
  
  if (db) {
    try {
      const querySnapshot = await getDocs(collection(db, "registrations"));
      const promises: any[] = [];
      querySnapshot.forEach((document) => {
        promises.push(deleteDoc(doc(db, "registrations", document.id)));
      });
      await Promise.all(promises);
      console.log("Cleared Firestore registrations backup.");
    } catch (err) {
      console.error("Failed to clear Firestore registrations backup:", err);
    }
  }
  
  res.json({ success: true });
});

// Main execution function to setup Vite
async function startServer() {
  // Sync on startup
  await syncFromFirestore();

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
