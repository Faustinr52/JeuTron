//chargement de mongoose
let mongoose = require('mongoose');

// tron_db c'est le nom de notre base de données
//var database = 'localhost:27017/"tron-db"';
const serve = "127.0.0.1:27017";
const database = "tron-db";

class Database {
    constructor() {
        this._connect();
    }

    // la connexion à la base de données
    _connect() {
        mongoose.connect('mongodb://'+serve+'/'+database,  
            {
                 useNewUrlParser: true,
                 useUnifiedTopology: true, 
                 useFindAndModify: false
            })
        .then(() => {
            console.log('la connexion à la base de données à reussie.');
        })
        .catch((error) => {
            console.error('la connexion à la base de données a échouée ', error);
        })
    }
}

module.exports = new Database();
