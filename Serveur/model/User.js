// Collection contient des utilisateurs

var mongoose = require('mongoose');
var Schema = mongoose.Schema;


//Definition d'un schéma pour la modelisation des données
var UserSchema = new Schema({

    Pseudo: {
        type: String, 
        required: true, 
        trim : true, // trim aidera à supprimer les espaces blancs
        unique: true 
    },

    nbVictoire: {
        type : Number,
        trim : true,
        required : true
    },

    nbPartie: {
        type : Number,
        trim : true,
        required : true
    },

    drn_adversaire: {
        type: String, 
        required: true, 
        trim : true, // trim aidera à supprimer les espaces blancs
    },
});

mongoose.model('User', UserSchema);