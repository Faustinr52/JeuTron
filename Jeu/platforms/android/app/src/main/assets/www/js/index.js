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
function onDeviceReady () {

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
 var sendPseudo = function(){
  var text = document.getElementById('pseudo').value;

  if(estValide()){
    document.getElementById("formulaire").style.display = "none";
    socket.emit('pseudo', text); 
  }
}
 //recuperer le text taper sur le champs de texte
 var receive = function(direction){
    console.log(direction);

    var cyclej;
    if(Numjoueur == 2){
      cyclej = game.cycles;
    } else {
      cyclej = game.cycles2;
    }
    for (let i = 0; i < cyclej.length; i++) {
      const cycle = cyclej[i];

      if (!cycle.active) {
        continue;
      }
      let newDirection;
      if (direction == "haut") {
        newDirection = { x: 0, y: -1 };
      } else if (direction == "bas") {
        newDirection = { x: 0, y: 1 };
      } else if (direction == "gauche") {
        newDirection = { x: -1, y: 0 };
      }else if (direction == "droite") {
        newDirection = { x: 1, y: 0 };
      }else {
        console.log("continue")
        continue;
      }
      console.log(newDirection);
      
      if(Numjoueur == 2){
        game.cycles[i].direction = newDirection;
      } else {
        game.cycles2[i].direction = newDirection;
      }
    }
    console.log("fin bouge adv");

 };
 var receiveStats = function(msg){
  var infos = JSON.parse(msg);
    joueur = infos["Pseudo"] ;
    document.getElementById('infosPseudo').innerHTML = '&nbsp &nbsp &nbsp Pseudo : '+ infos["Pseudo"];
    document.getElementById('infos').innerHTML = '&nbsp Victoire : '+infos["nbVictoire"]+'&nbsp Parties jouées : '+infos["nbPartie"] +"  ";
    console.log(msg);
 }
 var receiveAdv = function(msg){
    adv = msg;
    document.getElementById('adv').innerHTML = "  Votre adversaire : "+msg;
    console.log(msg);
}

var receiveDp = function(msg){
  Numjoueur = msg;
  lancerJeu()
  console.log(adv);
  console.log(joueur);
  if(msg == 1){
    joueur1 = joueur;
    joueur2 = adv;
  } else {
    joueur1 = adv;
    joueur2 = joueur;
  }
  if(Numjoueur == 1){
    document.getElementById('infosPseudo').style.color = "#f00";
    document.getElementById("adv").style.color = "#FF1493";
  } else {
    document.getElementById('adv').style.color = "#f00";
    document.getElementById("infosPseudo").style.color = "#FF1493";
  }
  console.log("joueur 1 : "+joueur1+" joueur 2 : "+joueur2);
}
var receiveAdvParti = function(msg){
  if(!finPartie){
    alert("Votre adversaire s'est deconnecté, la partie ne peut pas continuer");
    document.location.reload();
    console.log("adv parti "+msg);
  }

}
document.addEventListener('deviceready', onDeviceReady, false);

var socket = io('ws://192.168.3.9:8000');

//se connecter avec un pseudo

function estValide(){
var pseudo = document.getElementById('pseudo').value;
let regex = /^[a-zA-Z1-9]+$/;
if(!regex.test(pseudo) || pseudo.length  == 0){
  document.getElementById('erreur').innerHTML = 'Le pseudo ne peut être que des lettres ou des chiffres'+'<br>';
  return false;
}
else if(pseudo.length < 4){
  document.getElementById('erreur').innerHTML = 'Le pseudo doit avoir au moins 4 caractères'+'<br>';
  return false;
}else if(pseudo.length >= 15){
  document.getElementById('erreur').innerHTML = 'Le pseudo ne peut pas avoir plus de 15 caractères'+'<br>';
  return false;
}
return true;
}
socket.on('pseudo',()=>{
  if(!estValide()){
      document.getElementById('erreur').innerHTML = 'Veuillez entrez un pseudo'+'<br>';
  }
});
socket.on('chat message', receive)
socket.on("stats", receiveStats);
socket.on("adv", receiveAdv);
socket.on("debut partie", receiveDp);
socket.on("adv parti", receiveAdvParti);


//jeu

finPartie = false;

document.addEventListener('deviceready', onDeviceReady, false);
function onDeviceReady() {
    // Cordova is now initialized. Have fun!

    console.log('Running cordova-' + cordova.platformId + '@' + cordova.version);
    document.getElementById('deviceready').classList.add('ready');
}

const taille = 10;
const BACKGROUND_COLOR = "gray";

class Jeu {
  constructor(canvasId, taille) {
    this.canvas = document.getElementById("myCanvas").getContext("2d");
    document.onkeydown = this.handleKeyboardEvent.bind(this);

    this.taille = taille;
    this.width = document.getElementById("myCanvas").width;
    this.height = document.getElementById("myCanvas").height;

    this.cycles = [];
    this.cycles2 = [];
    this.positions = [];
  }

  addcycle(cycle, cycle2) {
    this.cycles.push(Object.assign({}, cycle));
    this.cycles2.push(Object.assign({}, cycle2));
  }

  deplacer(depl){
    var cyclej;
    if(Numjoueur == 1){
      cyclej = this.cycles;
    } else {
      cyclej = this.cycles2;
    }
    for (let i = 0; i < cyclej.length; i++) {
      const cycle = cyclej[i];

      if (!cycle.active) {
        continue;
      }
      let newDirection;
      if (depl == "up") {
        newDirection = { x: 0, y: -1 };
        socket.emit('chat message','haut');
      } else if (depl == "down") {
        newDirection = { x: 0, y: 1 };
        socket.emit('chat message','bas');
      } else if (depl == "left") {
        newDirection = { x: -1, y: 0 };
        socket.emit('chat message','gauche');
      }else if (depl == "right") {
        newDirection = { x: 1, y: 0 };
        socket.emit('chat message','droite');
      }else {
        continue;
      }
      console.log("fin envoi");
      if (
        (newDirection.x === cycle.direction.x &&
          newDirection.y !== cycle.direction.y) ||
        (newDirection.y === cycle.direction.y &&
          newDirection.x !== cycle.direction.x)
      ) {
        continue;
      }
      if(Numjoueur == 1){
        this.cycles[i].direction = newDirection;
      } else {
        this.cycles2[i].direction = newDirection;
      }
    }

  }



  handleKeyboardEvent(e) {

    var cyclej;
    if(Numjoueur == 1){
      cyclej = this.cycles;
    } else {
      cyclej = this.cycles2;
    }
    for (let i = 0; i < cyclej.length; i++) {
      const cycle = cyclej[i];

      if (!cycle.active) {
        continue;
      }
      
      let newDirection;
      if (e.keyCode === cycle.keyBindings.up) {
        newDirection = { x: 0, y: -1 };
        socket.emit('chat message','haut');
      } else if (e.keyCode === cycle.keyBindings.down) {
        newDirection = { x: 0, y: 1 };
        socket.emit('chat message','bas');
      } else if (e.keyCode === cycle.keyBindings.left) {
        newDirection = { x: -1, y: 0 };
        socket.emit('chat message','gauche');
      }else if (e.keyCode === cycle.keyBindings.right) {
        newDirection = { x: 1, y: 0 };
        socket.emit('chat message','droite');
      }else {
        continue;
      }
      
      if (
        (newDirection.x === cycle.direction.x &&
          newDirection.y !== cycle.direction.y) ||
        (newDirection.y === cycle.direction.y &&
          newDirection.x !== cycle.direction.x)
      ) {
        continue;
      }

      if(Numjoueur == 1){
        this.cycles[i].direction = newDirection;
      } else {
        this.cycles2[i].direction = newDirection;
      }
  
    }
  }

  playerShouldDie(cycle) {
  
    if (
      cycle.position.x <= 0 ||
      cycle.position.y <= 0 ||
      cycle.position.x >= (this.width) ||
      cycle.position.y >= (this.height)
    ) {

      return true;
    }
    for (let i = 0; i < this.positions.length; i++) {
      const position = this.positions[i].point;

      if (
        cycle.position.x - (this.taille - 1) / 2 <= position.x &&
        position.x <= cycle.position.x + (this.taille - 1) / 2 + 1 &&
        cycle.position.y - (this.taille - 1) / 2 <= position.y &&
        position.y <= cycle.position.y + (this.taille - 1) / 2 + 1
      ) {

        return true;
      }
    }
    return false;
  }
  updateCell(newPosition, newColor) {
    for (let i = 0; i < this.positions.length; i++) {
      const position = this.positions[i];

      if (position.point === newPosition) {
        position.color = newColor;
        return;
      }
    }
    this.positions.push({
      point: newPosition,
      color: newColor
    });
  }

  update() {
    for (let i = 0; i < this.cycles.length; i++) {
      const cycle = this.cycles[i];
      const cycle2 = this.cycles2[i];

      if (!cycle2.active) {
        continue;
      }
      const previousPosition = cycle.position;
      const previousPosition2 = cycle2.position;


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

      if (!this.playerShouldDie(cycle) && !this.playerShouldDie(cycle2)) {
        this.updateCell(cycle.position, cycle.color);
        this.updateCell(previousPosition, cycle.traceColor);

        this.updateCell(cycle2.position, cycle2.color);
        this.updateCell(previousPosition2, cycle2.traceColor);
      } else {
        
        if(this.playerShouldDie(cycle)){
          finPartie = true;
          players[1].gagne = true;
          console.log("gagnant "+ players[1].name);
          document.getElementById('gagnant').innerHTML = joueur2 + ' a gagné la partie';
          document.getElementById('gagnant').style.color = "#FF1493";
          document.getElementById('reload').style.display = "block";
          var gagne;
          if(Numjoueur == 1){
            gagne = false;
          } else {
            gagne = true;    
          }
          socket.emit("fin partie", gagne);
          console.log(gagne);
          clearTimeout(timeout);
        }else if(this.playerShouldDie(cycle2)){
          finPartie = true;
          players[0].gagne = true;
          console.log("gagnant "+ players[0].name);
          document.getElementById('gagnant').innerHTML = joueur1 + ' a gagné la partie';
          document.getElementById('gagnant').style.color = "#f00";
          document.getElementById('reload').style.display = "block";
          var gagne;
          if(Numjoueur == 1){ 
            gagne = true;
          } else {
            gagne = false;
          }
          socket.emit("fin partie", gagne);
          console.log(gagne);
          clearTimeout(timeout);
        }
 
      }
    }
    this.draw();
  }
  draw() {
    this.canvas.fillStyle = BACKGROUND_COLOR;
    this.canvas.fillRect(0, 0, this.width, this.height);

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
players = [
  {
    name: "Player1",
    position: {
      x: 0,
      y: 0
    },
    direction: { x: 0, y: -1 },
    color: "#8B0000",
    traceColor: "#f00",
    keyBindings: {
      up: 38,
      down: 40,
      left: 37,
      right: 39
    },
    active: true,
    gagne : false
  },
  {
    name: "Player2",
    position: {
      x: 0,
      y: 0
    },
    direction: { x: 1, y: 0 },
    color: "#8B008B",
    traceColor: "#FF1493",
    keyBindings: {
      up: 38,
      down: 40,
      left: 37,
      right: 39
    },
    active: true,
    gagne : false
  }
];

function load() {
  const game = new Jeu("myCanvas",taille);
    directions = [
      { x: 0, y: -1 },
      { x: 0, y: 1 },
      { x: 1, y: 0 },
      { x: -1, y: 0 }
    ];
    players[0].position = {
          x: 10,
          y: document.getElementById('myCanvas').height - taille
        };
    players[1].position = {
          x: 40,
          y: document.getElementById('myCanvas').height - taille
        };
    game.addcycle(players[0],players[1]);
  return game;
}
let game = load();

function main() {
  game.update();
  var timeout = setTimeout(function() {
    main();
    }, 300);
}
function lancerPartie(){
    main();
    document.getElementById("formulaire").style.display = "none";
    document.getElementById("debut").style.display = 'none';
    document.getElementById('buttons').style.display = 'block';
}

function lancerJeu(){
  var timeleft = 5;
  var downloadTimer = setInterval(function(){
    if(timeleft <= 0){
      lancerPartie();
      clearInterval(downloadTimer);
    }
    document.getElementById("debut").textContent= 'Votre jeu commence dans : '+timeleft+' sec';
    timeleft -= 1;
  }, 1000);
}
window.onload = function() {
  document.getElementById('buttons').style.display = 'none';

};



