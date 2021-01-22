// Collection contient des parties

var mongoose = require('mongoose');
var Schema = mongoose.Schema;


//Definition d'un schéma pour la modelisation des données
var PartieSchema = new Schema({

    Joueur1: {
        type: String, 
        required: true, 
        trim : true, // trim aidera à supprimer les espaces blancs
    },

    Joueur2: {
        type: String, 
        required: true, 
        trim : true, 
    },

    Gagnant: {
        type : String,
        trim : true,  
    },
});

mongoose.model('Partie', PartieSchema);