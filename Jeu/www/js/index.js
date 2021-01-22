/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

// Wait for the deviceready event before using any of Cordova's device APIs.
// See https://cordova.apache.org/docs/en/latest/cordova/events/events.html#deviceready

//serveur

// Create the Web socket !
function onDeviceReady() {

  //affichage device ready
  var li = document.createElement('h2');
  li.innerText = "device ready ";
  document.getElementById('messages').appendChild(li);
}

//pseudo joueur 1 et 2
var joueur;
var adv
//numero du joueur
var Numjoueur;
//joueur
var joueur1;
var joueur2;


//envoyer le pseudo
var sendPseudo = function () {
  var text = document.getElementById('pseudo').value;

  //verifie que le pseudo saisi est valide
  if (estValide()) {
    document.getElementById("formulaire").style.display = "none";
    socket.emit('pseudo', text);
  }
}
//met a jour la direction du joueur adversaire grace au message du serveur
var receive = function (direction) {
  var cyclej;
  //recupere la liste des cycles du joueur adverse
  if (Numjoueur == 2) {
    cyclej = game.cycles;
  } else {
    cyclej = game.cycles2;
  }
  //parcours tous les cycles realises
  for (let i = 0; i < cyclej.length; i++) {
    const cycle = cyclej[i];

    //si le cycle n'est pas celui en cours passe a l'iteration suivante
    if (!cycle.active) {
      continue;
    }
    //cree une nouvelle direction en fonction du message envoye par le serveur
    let newDirection;
    if (direction == "haut") {
      newDirection = { x: 0, y: -1 };
    } else if (direction == "bas") {
      newDirection = { x: 0, y: 1 };
    } else if (direction == "gauche") {
      newDirection = { x: -1, y: 0 };
    } else if (direction == "droite") {
      newDirection = { x: 1, y: 0 };
    } else {
      //si aucune des directions n'est la bonne passe a la suite sans rien faire
      continue;
    }
    //met a jour la direction du dernier cycle de l'adversaire
    if (Numjoueur == 2) {
      game.cycles[i].direction = newDirection;
    } else {
      game.cycles2[i].direction = newDirection;
    }
  }
};

//recupere les statistiques du joueur fournies par le serveur
var receiveStats = function (msg) {
  //parse les message pour le transformer en json
  var infos = JSON.parse(msg);
  joueur = infos["Pseudo"];
  //met a  jour les informations affichees sur la page web
  document.getElementById('infosPseudo').innerHTML = '&nbsp &nbsp &nbsp Pseudo : ' + infos["Pseudo"];
  document.getElementById('infos').innerHTML = '&nbsp Victoire : ' + infos["nbVictoire"] + '&nbsp Parties jouées : ' + infos["nbPartie"] + "  ";
}

//reçoit le pseudo de l'adversaire, le stocke et met a jour l'affichage de la page web
var receiveAdv = function (msg) {
  adv = msg;
  document.getElementById('adv').innerHTML = "  Votre adversaire : " + msg;
  console.log(msg);
}

//reçoit le message annonçant le debut de partie et le numero du joueur
var receiveDp = function (msg) {
  //stocke le numero de joueur
  Numjoueur = msg;
  //lance la partie
  lancerJeu()
  //stocke les pseudos des joueurs dans joueur1 et joueur2 selon le msg reçu
  if (msg == 1) {
    joueur1 = joueur;
    joueur2 = adv;
  } else {
    joueur1 = adv;
    joueur2 = joueur;
  }

  //colore l'affichage du pseudo de l'adversaire et du joueur en fonction de leur numero
  if (Numjoueur == 1) {
    document.getElementById('infosPseudo').style.color = "#f00";
    document.getElementById("adv").style.color = "#FF1493";
  } else {
    document.getElementById('adv').style.color = "#f00";
    document.getElementById("infosPseudo").style.color = "#FF1493";
  }
}

//traite le cas ou l'adversaire se deconnecte
var receiveAdvParti = function (msg) {
  //si la partie n'est pas finie
  if (!finPartie) {
    //affiche un popup pour prevenir l'adversaire puis recharge la page
    alert("Votre adversaire s'est deconnecté, la partie ne peut pas continuer");
    document.location.reload();
  }

}
document.addEventListener('deviceready', onDeviceReady, false);

var socket = io('ws://192.168.56.1:8000');

//verifie que le pseudo fourni est valide
function estValide() {
  //n'autorise que les pseudos avec des lettres majuscules et minuscules ou des chiffres
  var pseudo = document.getElementById('pseudo').value;
  let regex = /^[a-zA-Z1-9]+$/;
  //affiche un message d'erreur si le pseudo contient d'autre caractères ou est vide
  if (!regex.test(pseudo) || pseudo.length == 0) {
    document.getElementById('erreur').innerHTML = 'Le pseudo ne peut être composé que des lettres ou des chiffres' + '<br>';
    return false;
  }
  //affiche un message d'erreur si le pseudo est trop court
  else if (pseudo.length < 4) {
    document.getElementById('erreur').innerHTML = 'Le pseudo doit avoir au moins 4 caractères' + '<br>';
    return false;
  }
  //affiche un message d'erreur si le pseudo est trop long
  else if (pseudo.length >= 15) {
    document.getElementById('erreur').innerHTML = 'Le pseudo ne peut pas avoir plus de 15 caractères' + '<br>';
    return false;
  }
  //sinon retourne true
  return true;
}

//reception de tous les messages envoyés par le serveur
socket.on('chat message', receive)
socket.on("stats", receiveStats);
socket.on("adv", receiveAdv);
socket.on("debut partie", receiveDp);
socket.on("adv parti", receiveAdvParti);

//jeu

//initialise la fin de partie a false
finPartie = false;

document.addEventListener('deviceready', onDeviceReady, false);
function onDeviceReady() {
  console.log('Running cordova-' + cordova.platformId + '@' + cordova.version);
  document.getElementById('deviceready').classList.add('ready');
}

const taille = 10;
const BACKGROUND_COLOR = "gray";

//classe avec les methodes et attributs du jeu
class Jeu {
  constructor(canvasId, taille) {

    this.canvas = document.getElementById("myCanvas").getContext("2d");
    document.onkeydown = this.handleKeyboardEvent.bind(this);

    //recupère la taille du canva et initialise la taille de la moto
    this.taille = taille;
    this.width = document.getElementById("myCanvas").width;
    this.height = document.getElementById("myCanvas").height;

    //iniitalise les cycles de jeu des deux adversaires et les positions qu'ils vont avoir
    this.cycles = [];
    this.cycles2 = [];
    this.positions = [];
  }

  //ajoute les cycles fournis dans les tableaux de cycle des deux joueurs
  //cycle est l'objet joueur a un instant t, avec une direction particuliere
  addcycle(cycle, cycle2) {
    this.cycles.push(Object.assign({}, cycle));
    this.cycles2.push(Object.assign({}, cycle2));
  }

  //permet de déplacer la moto du joueur a l'aide des boutons de direction
  deplacer(depl) {
    //recupere le cycle du joueur et le stocke
    var cyclej;
    if (Numjoueur == 1) {
      cyclej = this.cycles;
    } else {
      cyclej = this.cycles2;
    }

    //parcours tous les cycles pour trouver celui actif
    for (let i = 0; i < cyclej.length; i++) {
      const cycle = cyclej[i];

      //si le cycle n'est pas actif passe a l'iteration suivante
      if (!cycle.active) {
        continue;
      }
      //cree une nouvelle direction en fonction de l'argument passe en parametre
      //et envoi au serveur la nouvelle direction prise
      let newDirection;
      if (depl == "up") {
        newDirection = { x: 0, y: -1 };
        socket.emit('chat message', 'haut');
      } else if (depl == "down") {
        newDirection = { x: 0, y: 1 };
        socket.emit('chat message', 'bas');
      } else if (depl == "left") {
        newDirection = { x: -1, y: 0 };
        socket.emit('chat message', 'gauche');
      } else if (depl == "right") {
        newDirection = { x: 1, y: 0 };
        socket.emit('chat message', 'droite');
      } else {
        continue;
      }
      //si la direction est la meme que la precedante passe a l'iteration suivante
      if (
        (newDirection.x === cycle.direction.x &&
          newDirection.y !== cycle.direction.y) ||
        (newDirection.y === cycle.direction.y &&
          newDirection.x !== cycle.direction.x)
      ) {
        continue;
      }
      //met a jour la direction du cycle
      if (Numjoueur == 1) {
        this.cycles[i].direction = newDirection;
      } else {
        this.cycles2[i].direction = newDirection;
      }
    }

  }

  //permet de déplacer la moto du joueur a l'aide des touches du clavier
  handleKeyboardEvent(e) {
    //recupere les cycles du joueur et les stocke
    var cyclej;
    if (Numjoueur == 1) {
      cyclej = this.cycles;
    } else {
      cyclej = this.cycles2;
    }
    //parcours les cycle pour trouver celui actif
    for (let i = 0; i < cyclej.length; i++) {
      const cycle = cyclej[i];
      //s'il n'est pas actif passe a l'iteration suivante
      if (!cycle.active) {
        continue;
      }
      //creer une nouvelle direction en fonction de la touche appuyée
      let newDirection;
      if (e.keyCode === cycle.keyBindings.up) {
        newDirection = { x: 0, y: -1 };
        socket.emit('chat message', 'haut');
      } else if (e.keyCode === cycle.keyBindings.down) {
        newDirection = { x: 0, y: 1 };
        socket.emit('chat message', 'bas');
      } else if (e.keyCode === cycle.keyBindings.left) {
        newDirection = { x: -1, y: 0 };
        socket.emit('chat message', 'gauche');
      } else if (e.keyCode === cycle.keyBindings.right) {
        newDirection = { x: 1, y: 0 };
        socket.emit('chat message', 'droite');
      } else {
        //si ne correspond a aucune prevue passe a l'iteration suivante
        continue;
      }
      //si la direction est la meme que la precedante passe a l'iteration suivante
      if (
        (newDirection.x === cycle.direction.x &&
          newDirection.y !== cycle.direction.y) ||
        (newDirection.y === cycle.direction.y &&
          newDirection.x !== cycle.direction.x)
      ) {
        continue;
      }
      //met a jour la direction du cycle
      if (Numjoueur == 1) {
        this.cycles[i].direction = newDirection;
      } else {
        this.cycles2[i].direction = newDirection;
      }
    }
  }

  //veirife si le joueur a touche un mur ou est sorti du cadre
  playerShouldDie(cycle) {
    //si la position sort du cadre
    if (
      cycle.position.x <= 0 ||
      cycle.position.y <= 0 ||
      cycle.position.x >= (this.width) ||
      cycle.position.y >= (this.height)
    ) {
      //retourne true
      return true;
    }
    //parcourt toutes les positions deja prise par les motos (les murs)
    for (let i = 0; i < this.positions.length; i++) {
      const position = this.positions[i].point;
      //si la position est deja une prise (le joueur a percute un mur)
      if (
        cycle.position.x - (this.taille - 1) / 2 <= position.x &&
        position.x <= cycle.position.x + (this.taille - 1) / 2 + 1 &&
        cycle.position.y - (this.taille - 1) / 2 <= position.y &&
        position.y <= cycle.position.y + (this.taille - 1) / 2 + 1
      ) {
        //renvoie true
        return true;
      }
    }
    //sinon renvoiefalse
    return false;
  }

  //met a jour la liste des positions prises par les motos en ajoutant la derniere
  updateCell(newPosition, newColor) {
    for (let i = 0; i < this.positions.length; i++) {
      const position = this.positions[i];
      //si la position est deja dans le tableau
      if (position.point === newPosition) {
        position.color = newColor;
        return;
      }
    }
    //sinon cree une nouvelle position avec le point et la couleur du mur passes en parametre
    this.positions.push({
      point: newPosition,
      color: newColor
    });
  }

  //
  update() {
    //parcours les cycles pour trouver celui actif (indice identique pour les deux joeurs)
    for (let i = 0; i < this.cycles.length; i++) {
      const cycle = this.cycles[i];
      const cycle2 = this.cycles2[i];

      //si le cycle n'est pas actif passe a l'iteration suivante
      if (!cycle2.active) {
        continue;
      }

      //recupere la derniere position des joueurs
      const previousPosition = cycle.position;
      const previousPosition2 = cycle2.position;

      //calcule la nouvelle position a l'aide de la precedente et de la direction
      // et met a jour la position pour chaque joueur
      cycle.position = {
        x: Math.min(
          cycle.position.x + cycle.direction.x * this.taille,
          this.width - this.taille / 2
        ),
        y: Math.min(
          cycle.position.y + cycle.direction.y * this.taille,
          this.height - this.taille / 2
        )
      };
      cycle2.position = {
        x: Math.min(
          cycle2.position.x + cycle2.direction.x * this.taille,
          this.width - this.taille / 2
        ),
        y: Math.min(
          cycle2.position.y + cycle2.direction.y * this.taille,
          this.height - this.taille / 2
        )
      };

      //si aucun des deux joueurs n'a perdu
      if (!this.playerShouldDie(cycle) && !this.playerShouldDie(cycle2)) {
        //met a jour les positions stockees dans le tableau de positions
        this.updateCell(cycle.position, cycle.color);
        this.updateCell(previousPosition, cycle.traceColor);
        this.updateCell(cycle2.position, cycle2.color);
        this.updateCell(previousPosition2, cycle2.traceColor);
      } else {
        //sinon si le joueur 1 a perdu
        if (this.playerShouldDie(cycle)) {
          //marque la partie comme finie et met l'attribut gagne du joueur 2 a true
          finPartie = true;
          players[1].gagne = true;
          console.log("gagnant " + players[1].name);
          //met a jour l'affichage pour indiquer la victoire du joueur et afficher le bouton pour recharger une partie
          document.getElementById('gagnant').innerHTML = joueur2 + ' a gagné la partie';
          document.getElementById('gagnant').style.color = "#FF1493";
          document.getElementById('reload').style.display = "block";
          //stock dans un boolean si le joueur a gagne ou perdu
          var gagne;
          if (Numjoueur == 1) {
            gagne = false;
          } else {
            gagne = true;
          }
          //envoie le message de fin de partie au serveur
          socket.emit("fin partie", gagne);
          clearTimeout(timeout);
        } 
        //sinon si le joueur 2 a perdu
        else if (this.playerShouldDie(cycle2)) {       
          //marque la partie comme finie et met l'attribut gagne du joueur 2 a true
          finPartie = true;
          players[0].gagne = true;
          console.log("gagnant " + players[0].name);
          //met a jour l'affichage pour indiquer la victoire du joueur et afficher le bouton pour recharger une partie
          document.getElementById('gagnant').innerHTML = joueur1 + ' a gagné la partie';
          document.getElementById('gagnant').style.color = "#f00";
          document.getElementById('reload').style.display = "block";
          //stock dans un boolean si le joueur a gagne ou perdu
          var gagne;
          if (Numjoueur == 1) {
            gagne = true;
          } else {
            gagne = false;
          }
          //envoie le message de fin de partie au serveur
          socket.emit("fin partie", gagne);
          clearTimeout(timeout);
        }
      }
    }
    this.draw();
  }

  //met a jour l'affichage des murs sur le canvas
  draw() {
    this.canvas.fillStyle = BACKGROUND_COLOR;
    this.canvas.fillRect(0, 0, this.width, this.height);
    //parcours les positions pour savoir comment colorier le canvans
    for (let i = 0; i < this.positions.length; i++) {
      const { point: position, color } = this.positions[i];
      this.canvas.fillStyle = color;
      this.canvas.fillRect(
        position.x - (this.taille - 1) / 2,
        position.y - (this.taille - 1) / 2,
        this.taille,
        this.taille
      );
    }
  }
}
//tableau contenant les informations sur les deux joueurs
players = [
  {
    name: "Player1",
    position: {
      x: 0,
      y: 0
    },
    //direction de depart
    direction: { x: 0, y: -1 },
    //couleur du mur et de la moto
    color: "#8B0000",
    traceColor: "#f00",
    //touches utilisees
    keyBindings: {
      up: 38,
      down: 40,
      left: 37,
      right: 39
    },
    active: true,
    gagne: false
  },
  {
    name: "Player2",
    position: {
      x: 0,
      y: 0
    },
    //direction de depart
    direction: { x: 1, y: 0 },
    //couleur du mur et de la moto
    color: "#8B008B",
    traceColor: "#FF1493",
    //touche utilisees
    keyBindings: {
      up: 38,
      down: 40,
      left: 37,
      right: 39
    },
    active: true,
    gagne: false
  }
];

//fonction appellee au chargement du jeu
function load() {
  //cree une instance du jeu
  const game = new Jeu("myCanvas", taille);
  directions = [
    { x: 0, y: -1 },
    { x: 0, y: 1 },
    { x: 1, y: 0 },
    { x: -1, y: 0 }
  ];
  //posiionne les joeurs
  players[0].position = {
    x: 10,
    y: document.getElementById('myCanvas').height - taille
  };
  players[1].position = {
    x: 40,
    y: document.getElementById('myCanvas').height - taille
  };
  //cree le premier cycle de chaque joueur
  game.addcycle(players[0], players[1]);
  //renvoie le jeu
  return game;

}

//cree le jeu
let game = load();

//fonction recursive permettant d'appeler update a interval regulier
function main() {
  game.update();
  var timeout = setTimeout(function () {
    main();
  }, 300);
}

//met a jour l'affichage de la page web et appelle la methode main pour lancer la partie
function lancerPartie() {
  main();
  document.getElementById("formulaire").style.display = "none";
  document.getElementById("debut").style.display = 'none';
  document.getElementById('buttons').style.display = 'block';
}

//lance le jeu
function lancerJeu() {
  //execute un compte a rebours de 5 secondes
  var timeleft = 5;
  var downloadTimer = setInterval(function () {
    //une fois le compte a rebours fini lance la partie
    if (timeleft <= 0) {
      lancerPartie();
      clearInterval(downloadTimer);
    }
    document.getElementById("debut").textContent = 'Votre jeu commence dans : ' + timeleft + ' sec';
    timeleft -= 1;
  }, 1000);
}

//cache les boutons de direction au chargement de la page
window.onload = function () {
  document.getElementById('buttons').style.display = 'none';

};



