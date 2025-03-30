const mongoose = require('mongoose'); 
 
const livraisonSchema = mongoose.Schema({ 
    commande_id: String, 
    transporteur_id: String, 
    statut: String,  
    adresse_livraison: String,
    created_at: { 
        type: Date, 
        default: Date.now() 
    } 
}); 
 
module.exports = Livraison = mongoose.model("livraison",livraisonSchema,"livraison");
