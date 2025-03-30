const express = require("express"); 
const app = express(); 
const Port = 4002; 
const mongoose = require("mongoose"); 
const Utilisateur = require("./authenfication"); 
const jwt = require('jsonwebtoken'); 
const bcrypt = require('bcryptjs'); 
app.use(express.json()); 
app.listen(Port, () => {
     console.log("Rest Api via ExpressJs"); 
     console.log(`Auth-Service at ${Port}`); 
    });
     // Connection to mongodb 
     mongoose.connect("mongodb://localhost:27017/Authentification");

     app.post("/auth/register", async (request, result) => { 
        let nom = request.body.nom; 
        let email = request.body.email; 
        let mot_passe = request.body.mot_passe; 
        
        const UserExist = await Utilisateur.findOne({ email: email });
         if (UserExist) { 
            return result.json({ message: "Cet utilisateur existe déja" });
         } else { 
            await bcrypt.hash(mot_passe, 10, async (error, hash) => { 
                if (error) { 
                    console.error("Hashing error:", error); 
                    return result.status(500).json({ error: error }); 
                } else { 
                    mot_passe = hash; 
                    const newUtilisateur = new Utilisateur({ 
                        nom: nom, 
                        email: email, 
                        mot_passe: mot_passe,
                     }); 
                     newUtilisateur 
                     .save() 
                     .then((utilisateur) => result.status(200).json(utilisateur)) 
                     .catch((error) => result.status(500).json(error));
                     }
                     }); 
                    }
                 });

        app.post("/auth/login", async (request, result) => { 
            const email = request.body.email; 
            const mot_passe = request.body.mot_passe; 
            try { 
                const utilisateur = await Utilisateur.findOne({ email: email }); 
                if (!utilisateur) { 
                    return result.status(400).json({ message: "Utilisateur introuvable" });
                 } 
                 const isMatch = await bcrypt.compare(mot_passe, utilisateur.mot_passe); 
                 if (!isMatch) { 
                    return result.status(400).json({ message: "Mot de passe incorrect" });
                 } 
                 const payload = { 
                    email: utilisateur.email, 
                    nom: utilisateur.nom, 
                }; 
                jwt.sign(payload, "secret", (error, token) => { 
                    if (error) { 
                        console.error("Error generating token:", error); 
                        return result 
                        .status(500) 
                        .json({ error: "Erreur lors de la génération du token" });
                     } 
                     return result.status(200).json({ token: token });
                     });
                     } catch (error) { 
                        console.error("Error during login:", error); 
                        return result.status(500).json({ error: "Erreur de connexion" }); 
                    } 
     });