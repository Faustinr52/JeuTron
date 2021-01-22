const { disconnect } = require('process');


// utilisation des modules express et socket.io afin de gérer respectivement 
// la communications bidirectionnelles entre les clients et le serveur

var express = require('express');

// base de données
var mongoose = require('mongoose');
require('./Connection_bdd');

//Modeles
require('./model/Partie');
require('./model/User');
var Partie = mongoose.model('Partie');
var User = mongoose.model('User');


// on recharge express
var app = require('express')();

//l'utilisation du serveur de app
var http = require('http').Server(app);

//l'utilisation de socket.io
var io = require('socket.io')(http, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Middleware CORS
var cors = require('cors');

// Accepter les requêtes de toutes les origines (URL)
app.use(cors())

//utilisation de uuid pour generer des id
const { v4: uuidv4 } = require('uuid');


// on dit au serveur  de retourner quelque chose quand on fais un
//un appel http
//quand on arrive a la racine la reponse est => retouner un fichier 
//client.html dans un serveur http

app.use(express.static('../../DevMobile/Jeu/www'));
app.get("/",function(req,res){
    res.sendFile('index.html');
}) 

//liste des rooms qui existent
var rooms = new Array();


//1- on ecoute tous les client qui se connectent et qui se deconnectent
io.on('connection', function (socket) {

    socket.on('disconnect', function () {
        var r = 0;
        rooms.forEach(room => {
            //si la salle est celle du joueur
            if (room.id == socket.room) {
                console.log("room a supprimer " + room);
                var i = 0
                //parcours les utilisateurs de la salle
                room.sockets.forEach(s => {
                    //si la socket est celle de l'utilisateur qui se deconnecte
                    if (s == socket) {
                        //l'enleve de la liste
                        room.sockets.splice(i, 1);
                    }
                    i = i + 1;
                })
                //si la salle est vide
                if (room.sockets.length == 0) {
                    //la supprime
                    rooms.splice(r, 1);
                } else {//previent l'utlisateur restant que son adversaire est parti
                    io.to(room.id).emit("adv parti", true);
                }
            }
            r = r + 1;
        })
        console.log('utilisateur deconnecté ' + socket.room);
    });

    //infos déroulement de la partie
    socket.on('chat message', function (msg) {
        console.log('message recu: ' + msg);

        //envoyer le message du client a l'autre joueur de la room
        socket.to(socket.room).emit('chat message', msg);
    });

    //renvoyer le message recu par le client au client
   
    socket.on('connexion',(pseudo)=>{
        console.log(pseudo +' se connecte');
        io.emit('connexion',pseudo);
    })
    //quand le joueur envoi son pseudo
    socket.on('pseudo', function (pseudo) {
        console.log('pseudo recu: ' + pseudo);
        socket.pseudo = pseudo;

        function trouveJ(p) {
            return User.findOne({ Pseudo: p }, function (err, res) {

                if (err) {
                    return handleError(err);
                }

                //statsJoueur prend le joueur trouve en base de donnees
                var statsJoueur = res;
                console.log("stats " + statsJoueur);
                var stats;

                //si le pseudo existe
                if (statsJoueur != null) {
                    console.log("pseudo trouvé");
                    //transforme l'objet en string pour l'envoyer au joueur
                    stats = JSON.stringify(statsJoueur);

                    //stocke les donnees utilisees par la suite
                    socket.nbPartie = statsJoueur.nbPartie;
                    socket.nbVictoire = statsJoueur.nbVictoire;
                    socket.drn_adv = statsJoueur.drn_adversaire;
                } else {
                    socket.nbPartie = 0;
                    socket.nbVictoire = 0;
                    socket.drn_adv = "None";

                    //cree le joueur en base de donnees et les stats
                    console.log("creation " + pseudo);
                    let j = new User({
                        "Pseudo": pseudo,
                        "nbVictoire": 0,
                        "nbPartie": 0,
                        "drn_adversaire": "None"
                    })
                    j.save().then(result => {
                        console.log(result);
                    }).catch(err => console.log(err));

                    stats = JSON.stringify({
                        "Pseudo": pseudo,
                        "nbVictoire": 0,
                        "nbPartie": 0,
                        "drn_adversaire": "None"
                    });
                }

                //envoi stats du joueur au joueur
                socket.emit("stats", stats);

                //a true quand le client est mis dans une salle
                rejoin = false;

                //cherche s'il existe une salle avec une personne
                rooms.forEach(room => {
                    //verifie qu'il n'y a qu'un joueur, que le client n'est pas déjà dans une salle et qu'il n'est pas de nouveau contre le même joueur
                    if (room.sockets.length == 1 && !rejoin && room.sockets[0].pseudo != socket.drn_adv) {
                        //si les conditions sont remplies l'ajoute dans la salle
                        socket.join(room.id);
                        socket.room = room.id;
                        room.sockets.push(socket);
                        rejoin = true;
                    }
                })

                //sinon le rajoute dans une nouvelle salle
                if (!rejoin) {
                    var Id = uuidv4();
                    socket.join(Id);
                    socket.room = Id;
                    var room = {
                        "id": Id,
                        "sockets": [socket]
                    }
                    rooms.push(room);
                }
                console.log('utilisateur connecté et dans la salle ' + socket.room);

                //verifie qu'il peut lancer la partie
                rooms.forEach(room => {
                    //verifie que c'est la salle du joueur et qu'il y a deux joueurs dedans
                    if (room.id == socket.room && room.sockets.length == 2) {
                        console.log("partie lancee");

                        //envoi a chque joueur le pseudo de son adversaire et enregistre le pseudo de l'adversaire
                        room.sockets[0].to(room.id).emit("adv", room.sockets[0].pseudo);
                        room.sockets[0].adv = room.sockets[1].pseudo;
                        room.sockets[1].to(room.id).emit("adv", room.sockets[1].pseudo);
                        room.sockets[1].adv = room.sockets[0].pseudo;

                        //lance la partie
                        room.sockets[0].emit("debut partie", 1);
                        room.sockets[1].emit("debut partie", 2);
                    }

                })
            })

        }
        statsJoueur = trouveJ(pseudo);

    });

    //quand le client a calcule une fin de partie
    socket.on('fin partie', function (msg) {
        //met a jour le dernier adversaire et le nombre de parties jouees
        socket.nbPartie = socket.nbPartie + 1;
        console.log("fin partie"+msg);
        let user = User.updateOne({ Pseudo: socket.pseudo }, { drn_adversaire: socket.adv, nbPartie: socket.nbPartie }, function () {
            if (msg == true) {
                //si a gagne incremente le nombre de victoire
                socket.nbVictoire = socket.nbVictoire + 1;
                User.updateOne({ Pseudo: socket.pseudo }, { nbVictoire: socket.nbVictoire }, function () {
                    //le gagnant est celui charge d'enregistrer la partie
                    let p = new Partie({
                        "Joueur1": socket.pseudo,
                        "Joueur2": socket.adv,
                        "Gagnant": socket.pseudo
                    });
                    p.save().then(result => {
                        console.log(result);
                    }).catch(err => console.log(err));
                });

            }
        });


    });
});
//lancer le serveur pour qu'il ecoute
http.listen(8000, function () {
    console.log('le serveur tourne sur le port 8000');
})


