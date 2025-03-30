const express = require("express");
const app = express();
const Port = process.env.PORT_ONE || 4003;
const mongoose = require("mongoose");
const Produits = require("./commande"); // Make sure this path is correct

app.use(express.json());

// MongoDB Connection
mongoose.connect("mongodb://localhost:27017/produits")
  .then(() => console.log("Connected to MongoDB"))
  .catch(err => console.error("MongoDB connection error:", err));

app.listen(Port, () => {
  console.log("Rest Api via ExpressJs");
  console.log(`commande-Service at ${Port}`);
});

app.post("/produit/ajouter", (req, res) => {
  const { nom, description, prix, stock } = req.body;
  const newProduit = new Produits({ // Note: using Produits (plural) to match the import
    nom,
    description,
    prix,
    stock
  });
  
  newProduit
    .save()
    .then((produit) => res.status(200).json(produit))
    .catch((error) => res.status(500).json({ error: error.message }));
});

app.get("/produit/:id", (req, res) => {
  const id = req.params.id;
  Produits.findById(id)
    .then((produit) => {
      if (!produit) return res.status(404).json({ message: "Product not found" });
      res.status(200).json(produit);
    })
    .catch((error) => res.status(500).json({ error: error.message }));
});

app.patch("/produit/:id/stock", (req, res) => {
  const id = req.params.id;
  const { stock } = req.body;
  Produits.updateOne({ _id: id }, { $set: { stock } })
    .then((result) => {
      if (result.n === 0) return res.status(404).json({ message: "Product not found" });
      res.status(200).json({ message: "Stock updated successfully" });
    })
    .catch((error) => res.status(500).json({ error: error.message }));
});