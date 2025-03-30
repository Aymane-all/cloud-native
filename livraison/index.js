const express = require("express"); 
const app = express(); 
const Port = process.env.PORT_ONE || 4004; 
 
const mongoose = require("mongoose"); 
const Livraison = require("./livraison"); 
 
app.use(express.json());
 
app.listen(Port, () => { 
    console.log("Rest Api via ExpressJs"); 
    console.log(`livraison-Service at ${Port}`); 
}); 
 
// Correction 1: Ajout de gestion de connexion avec .then/.catch
mongoose.connect("mongodb://localhost:27017/livraisons")
  

app.post("/livraison/ajouter", (request, result) => { 
    console.log(request.body);
    const { commande_id, transporteur_id, statut, adresse_livraison } = request.body;

    if (!commande_id || !transporteur_id || !statut || !adresse_livraison) {
        return result.status(400).json({ message: "Tous les champs sont obligatoires !" });
    }

    const newLivraison = new Livraison({
        commande_id,
        transporteur_id,
        statut,
        adresse_livraison,
    });

    newLivraison
        .save()
        .then((livraison) => result.status(201).json(livraison)) 
        .catch((error) => result.status(500).json({ error: "Erreur serveur", details: error.message })); // Correction 2: error.message au lieu de error
});

// Correction 3: Amélioration de la route PUT
app.put("/livraison/:id", (request, result) => { 
    const id = request.params.id; 
    const statut = request.body.statut; 
    if (!statut) { // Correction 3a: Ajout de validation
        return result.status(400).json({ message: "Le statut est requis" });
    }
    Livraison.updateOne({ _id: id }, { $set: { statut: statut } }) 
        .then((livraison) => {
            if (livraison.nModified === 0) { // Correction 3b: Vérifie si une mise à jour a eu lieu
                return result.status(404).json({ message: "Livraison non trouvée ou statut inchangé" });
            }
            result.status(200).json(livraison);
        }) 
        .catch((error) => result.status(500).json({ error: "Erreur serveur", details: error.message })); // Correction 3c: Retourne l'erreur au client au lieu de juste console.log
});