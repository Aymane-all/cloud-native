const express = require("express");
const { MongoClient } = require("mongodb");

const app = express();
app.use(express.json());

const url = "mongodb://localhost:27017";
const dbName = "produits_service";
let db;

async function connectDB() {
  try {
    const client = await MongoClient.connect(url);
    console.log(" Connexion réussie avec Mongo");
    db = client.db(dbName);

    const PORT = 4001;
    app.listen(PORT, () => {
      console.log(`Serveur en ligne : http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error(" Erreur de connexion à MongoDB :", err);
    process.exit(1); 
  }
}


app.get("/", (req, res) => {
  res.send("Hi");
});


app.get("/commandes", async (req, res) => {
  if (!db) {
    return res.status(500).send(" Base de données non initialisée");
  }

  try {
    const commandes = await db.collection("commandes").find({}).toArray();
    res.status(200).json(commandes);
  } catch (err) {
    console.error(" Erreur lors de la récupération des données :", err);
    res.status(500).send("Erreur serveur");
  }
});


app.get("/commande/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const commande = await db.collection("commandes").findOne({ id: id });
    if (!commande) {
      return res.status(404).json({ message: "Commande non trouvé" });
    }
    res.status(200).json(commande);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});



app.post("/commande/ajouter", async (req, res) => {
  try {
    const nouvelleCommande = req.body;

    // Validation basique
    if (!nouvelleCommande.produits || !nouvelleCommande.produits.length) {
      return res
        .status(400)
        .json({ message: "Données de commande incomplètes" });
    }

   
    if (!nouvelleCommande.id) {
      
      const derniereCommande = await db
        .collection("commandes")
        .find()
        .sort({ id: -1 })
        .limit(1)
        .toArray();
      let nouveauNumero = 1;

      if (derniereCommande.length > 0 && derniereCommande[0].id) {
        const dernierNumero = parseInt(
          derniereCommande[0].id.replace("CMD", "")
        );
        if (!isNaN(dernierNumero)) {
          nouveauNumero = dernierNumero + 1;
        }
      }

      nouvelleCommande.id = `CMD${nouveauNumero.toString().padStart(3, "0")}`;
    }

    
    let montantTotal = 0;

    for (const item of nouvelleCommande.produits) {
      const produit = await db
        .collection("produits")
        .findOne({ id: item.produit_id });

      
      if (!produit) {
        return res
          .status(404)
          .json({ message: `Produit avec ID ${item.produit_id} non trouvé` });
      }

     
      if (produit.stock < item.quantite) {
        return res.status(400).json({
          message: `Stock insuffisant pour ${produit.nom}. Disponible: ${produit.stock}, Demandé: ${item.quantite}`,
        });
      }


      item.nom = produit.nom;
      item.prix_unitaire = produit.prix;
      item.sous_total = produit.prix * item.quantite;

      montantTotal += item.sous_total;
    }

    if (!nouvelleCommande.date_commande) {
      nouvelleCommande.date_commande = new Date().toISOString();
    }

    if (!nouvelleCommande.statut) {
      nouvelleCommande.statut = "en attente";
    }

    if (!nouvelleCommande.paiement) {
      nouvelleCommande.paiement = {
        methode: "carte",
        statut: "en attente",
        reference: `PAY${Math.floor(Math.random() * 1000000)
          .toString()
          .padStart(6, "0")}`,
      };
    }
    nouvelleCommande.paiement.montant_total = montantTotal;

    const resultat = await db
      .collection("commandes")
      .insertOne(nouvelleCommande);

    // Mettre à jour le stock pour chaque produit
    for (const item of nouvelleCommande.produits) {
      await db
        .collection("produits")
        .updateOne(
          { id: item.produit_id },
          { $inc: { stock: -item.quantite } }
        );
    }

    res.status(201).json({
      message: "Commande créée avec succès",
      id: nouvelleCommande.id,
      montant_total: montantTotal,
    });

  } catch (error) {
    console.error(" Erreur lors de la création de la commande:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

connectDB();
