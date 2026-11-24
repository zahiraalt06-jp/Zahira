(() => {
"use strict";
const $ = id => document.getElementById(id);
const screens = ["gate","titleScreen","gameScreen"];
const show = id => screens.forEach(s => $(s).classList.toggle("hidden", s !== id));
function unlockWithPassword(value, errorElement, inputElement){
 if(value==="Cádiz21"){show("titleScreen");if(errorElement)errorElement.textContent="";}
 else{if(errorElement)errorElement.textContent="La cerradura sigue cerrada. Prueba otra vez.";if(inputElement)inputElement.value="";}
}
$("passwordForm").addEventListener("submit",e=>{e.preventDefault();unlockWithPassword($("password").value,$("passwordError"),$("password"));});
function beginAdventure(){show("gameScreen");startGame();}
$("playBtn").addEventListener("click",beginAdventure);
$("playBtnMobile").addEventListener("click",beginAdventure);
const canvas=$("game"),ctx=canvas.getContext("2d");ctx.imageSmoothingEnabled=false;
const W=960,H=540, G=0.56;
const worlds=[
 {name:"Pueblo nevado",icon:"❄",desc:"Faroles cálidos, tejados nevados y una pista junto al viejo hotel.",sky:["#8bbbc7","#d5e8dc"],ground:"#d7e8df",accent:"#b7d8d1",platform:"#8eb7ad",hazard:"#7b9fa4",collect:"★",question:"¿En qué ciudad nos vimos por primera vez, en la puerta del hotel?",answers:["Cádiz","Sevilla","Granada"],correct:0,tip:"¡Esa primera pista estaba en Cádiz! ¡Vamos, tú puedes!"},
 {name:"Bosque encantado",icon:"🌲",desc:"Árboles luminosos guardan pequeñas señales entre sus ramas.",sky:["#254c59","#7a9f83"],ground:"#456d5b",accent:"#c4d89a",platform:"#759d79",hazard:"#b86c69",collect:"✧",question:"¿Cuál es mi comida favorita?",answers:["Pasta","Sushi","Hamburguesa"],correct:0,tip:"¡Pasta! Has encontrado otra pista. Tu amorsin está orgullosa de ti."},
 {name:"Reino de los dulces",icon:"🍬",desc:"Un paisaje navideño lleno de luces y criaturas traviesas.",sky:["#d58e9d","#f7d5b9"],ground:"#b87982",accent:"#ffe2b7",platform:"#f2c6a4",hazard:"#b94e66",collect:"✧",question:"¿Cuál es mi sueño?",answers:["Mudarme a Sevilla","Mudarme con el amor de mi vida","Mudarme debajo del puente"],correct:1,tip:"¡Ese sueño está lleno de amor! Sigue adelante, campeón."},
 {name:"Montaña de los secretos",icon:"⛰",desc:"El viento silba entre cristales de hielo. Una señal antigua esconde un mensaje.",sky:["#5a718f","#c1d9e6"],ground:"#9dbbc9",accent:"#eff7f1",platform:"#7198ad",hazard:"#61728d",collect:"♦",question:"¿Qué es lo que más me gusta de ti?",textAnswer:true,expected:"mis ojos verdes",tip:"¡Tus ojos verdes! Y tu amorsin está orgullosa de ti."},
 {name:"Castillo helado",icon:"🏰",desc:"Tras las puertas de hielo espera el último recuerdo de esta aventura.",sky:["#273b67","#a9c6dc"],ground:"#b5cbd8",accent:"#f7edce",platform:"#8aa9c5",hazard:"#6577a6",collect:"✦",question:"Zahira es…",answers:["GUAPA","FRIOLERA","Coqueta","Todas son correctas jejeje"],correct:3,tip:"¡Todas son correctas, jejeje! Has llegado al final. ¡Tu amorsin está orgullosa de ti!"}
];
const spriteNames=["idle","walk1","walk2","walk3","run1","run2","jump1","jump2","jump3","fall","happy","excited","star"];
const sprites={};spriteNames.forEach(n=>{const im=new Image();im.src=`assets/${n}.png`;sprites[n]=im;});
const loveMessages=["Te quierooo muchooo mi amorsiiin","Te amooo mi corazón de melooon","Te ilofiuuuuu cielitooooooo","Tecomotostuscromosomaaperfectosss","¡Vamossss, tú puedessss completarlo!","Tu amorsin está orgullosa de ti","¡Sigue así, campeón! Cada vez estás más cerca"];
const monsterLooks=["👹","👾","🧟","🐲","👻","🧌","🦇"];
const monsterNames=["ogro de hielo","alienígena travieso","monstruo zombi","dragón de nieve","fantasma monstruoso","trol de las nieves","murciélago monstruoso"];
const state={world:0,stars:0,lives:3,paused:false,active:false,worldStarted:false,unlocked:false,dialog:false,frame:0,cam:0,checkpoint:0,keys:{},touch:{left:false,right:false,jump:false,action:false},collected:new Set(),answered:new Set(),lastTime:0};
let player,level,toastTimer=0;
const worldLength=3000;
function platform(x,y,w,h=22,type="normal"){return{x,y,w,h,type};}
function buildLevel(){
 const w=worlds[state.world],plats=[platform(0,480,700,60),platform(760,480,600,60),platform(1420,480,680,60),platform(2160,480,900,60)];
 // Plataformas en escalera, algo más anchas y con alturas alcanzables.
 for(let i=0;i<18;i++){let x=175+i*150;let y=390-[0,28,54,32][i%4];plats.push(platform(x,y,172,20));}
 const stars=[];for(let i=0;i<18;i++){let p=plats[4+i];let x=p.x+p.w/2;let y=p.y-48;stars.push({x,y,taken:false});}
 const enemies=[];for(let i=0;i<9;i++)enemies.push({x:500+i*285,y:445,home:500+i*285,dir:i%2?1:-1,alive:true,deadTimer:0,look:monsterLooks[(i+state.world)%monsterLooks.length],name:monsterNames[(i+state.world)%monsterNames.length]});
 return {plats,stars,enemies,door:{x:2860,y:390,w:56,h:90},key:{x:2450,y:425,taken:false},chest:{x:1860,y:430,opened:false},checkpoint:{x:1500,y:420,active:false},length:worldLength,decor:Array.from({length:60},(_,i)=>({x:i*57,y:80+(i*47)%230,s:(i%3)+1}))};
}
function resetPlayer(){player={x:55,y:390,vx:0,vy:0,w:48,h:54,onGround:false,facing:1,anim:0,invuln:0,checkpointX:55,landed:false,coyote:0};}
function startGame(){state.world=0;state.stars=0;state.lives=3;state.collected.clear();state.answered.clear();beginWorld(true);}
function beginWorld(first=false){level=buildLevel();resetPlayer();state.cam=0;state.active=true;state.worldStarted=true;state.paused=false;$("worldName").textContent=worlds[state.world].name.toUpperCase();updateHud();if(!first){$("worldEmblem").textContent=worlds[state.world].icon;$("worldTitle").textContent=worlds[state.world].name;$("worldDescription").textContent=worlds[state.world].desc;$("worldOverlay").classList.remove("hidden");state.active=false;}else{toast("¡Encuentra las estrellas y la llave!");}}
function updateHud(){$("starCount").textContent=state.stars;$("lives").textContent=state.lives;$("objective").textContent=level.key.taken?"¡Encuentra la puerta!":"Recoge estrellas y busca la llave";}
function toast(msg){const t=$("toast");t.textContent=msg;t.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove("show"),1900);}
function nextWorld(){if(state.world===4){state.active=false;$("finalOverlay").classList.remove("hidden");return;}state.world++;beginWorld(false);}
$("enterWorld").onclick=()=>{$("worldOverlay").classList.add("hidden");state.active=true;toast("¡Adelante, campeón!");};
function drawBackground(){
 const w=worlds[state.world],g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,w.sky[0]);g.addColorStop(1,w.sky[1]);ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
 // distant hills and layered silhouettes
 for(let i=0;i<7;i++){let x=((i*210-state.cam*.22)%1250+1250)%1250-140;ctx.fillStyle=i%2?"#ffffff22":"#132d3a22";ctx.beginPath();ctx.moveTo(x,430);ctx.quadraticCurveTo(x+100,250+(i%3)*35,x+220,430);ctx.fill();}
 for(const d of level.decor){let x=d.x-state.cam*.48;if(x<-30||x>W+30)continue;ctx.fillStyle=state.world===2?"#fff0c055":"#f4fff055";ctx.fillRect(x,d.y,d.s*2,d.s*2);ctx.fillStyle="#ffffff88";ctx.fillRect(x+5,d.y-7,2,2);}
 // festive trees
 for(let i=0;i<14;i++){let x=((i*280-state.cam*.65)%1600+1600)%1600-100;if(x< -70||x>W+70)continue;ctx.fillStyle="#244d49";ctx.beginPath();ctx.moveTo(x,430);ctx.lineTo(x+35,330);ctx.lineTo(x+70,430);ctx.fill();ctx.fillStyle="#f4d48d";ctx.fillRect(x+33,365,5,5);}
}
function drawWorld(){
 drawBackground();ctx.save();ctx.translate(-state.cam,0);
 // floor/platforms
 for(const p of level.plats){ctx.fillStyle=p.type==="normal"?worlds[state.world].ground:worlds[state.world].platform;ctx.fillRect(p.x,p.y,p.w,p.h);ctx.fillStyle="#ffffff55";ctx.fillRect(p.x,p.y,p.w,4);ctx.fillStyle="#172e3b33";for(let x=p.x+8;x<p.x+p.w;x+=24)ctx.fillRect(x,p.y+8,9,3);}
 // checkpoint flag
 ctx.fillStyle="#624d5d";ctx.fillRect(level.checkpoint.x,level.checkpoint.y,5,60);ctx.fillStyle=level.checkpoint.active?"#f5df8e":"#d7797c";ctx.beginPath();ctx.moveTo(level.checkpoint.x+5,level.checkpoint.y);ctx.lineTo(level.checkpoint.x+38,level.checkpoint.y+12);ctx.lineTo(level.checkpoint.x+5,level.checkpoint.y+24);ctx.fill();
 // stars
 level.stars.forEach(s=>{if(!s.taken){ctx.fillStyle="#ffe49b";ctx.font="28px serif";ctx.fillText(worlds[state.world].collect,s.x,s.y+Math.sin(Date.now()/230+s.x)*4);}});
 // key, chest, door
 if(!level.key.taken){ctx.font="32px serif";ctx.fillText("🗝",level.key.x,level.key.y);}
 ctx.font="40px serif";ctx.fillText(level.chest.opened?"📦":"🎁",level.chest.x,level.chest.y);
 ctx.fillStyle="#c4e5e9";ctx.fillRect(level.door.x,level.door.y,level.door.w,level.door.h);ctx.fillStyle="#476c80";ctx.fillRect(level.door.x+9,level.door.y+10,level.door.w-18,level.door.h-10);ctx.fillStyle="#f6d78e";ctx.beginPath();ctx.arc(level.door.x+40,level.door.y+51,4,0,Math.PI*2);ctx.fill();
 // enemies
 level.enemies.forEach(e=>{if(e.alive){ctx.font="34px serif";ctx.fillText(e.look,e.x,e.y+27);}else if(e.deadTimer>0){ctx.save();ctx.globalAlpha=e.deadTimer/32;ctx.font="25px serif";ctx.fillText("✨",e.x+4,e.y+8-e.deadTimer*.7);ctx.fillText("⭐",e.x+22,e.y+4-e.deadTimer*.45);ctx.restore();}});
 // player
 drawPlayer();
 ctx.restore();
}
function drawPlayer(){
 // Cada PNG contiene un fotograma. Se han recortado los fragmentos de los
 // fotogramas vecinos para que al girar no aparezcan piezas sueltas ni desaparezca.
 let name="idle";
 if(!player.onGround){
   name=player.vy < -5 ? "jump1" : (player.vy < 2 ? "jump2" : "fall");
 }else if(Math.abs(player.vx)>.25){
   const frames=["walk1","walk2","walk3"];
   name=frames[Math.floor(player.anim/7)%frames.length];
 }
 let im=sprites[name];
 if(!im || !im.complete || !im.naturalWidth) im=sprites.idle;
 const center=player.x+player.w/2;
 const boxW=66, boxH=60;
 const scale=Math.min(boxW/im.naturalWidth,boxH/im.naturalHeight);
 const dw=im.naturalWidth*scale, dh=im.naturalHeight*scale;
 const bob=player.onGround&&Math.abs(player.vx)>.25?Math.sin(player.anim*.34)*1.8:0;
 const dy=player.y+player.h-dh+bob;
 ctx.save();
 // Transform around the character's centre in both directions. This avoids
 // negative-position drawing artefacts when the player turns left.
 ctx.translate(center,0);
 if(player.facing<0) ctx.scale(-1,1);
 if(im&&im.complete&&im.naturalWidth) ctx.drawImage(im,-dw/2,dy,dw,dh);
 else {ctx.fillStyle="#e98d45";ctx.fillRect(-18,player.y+8,36,35);}
 ctx.restore();
}
function overlaps(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;}
function update(dt){
 if(!state.active||state.paused||state.dialog)return;
 const k=state.keys,t=state.touch;let dir=(k.ArrowRight||k.KeyD||t.right?1:0)-(k.ArrowLeft||k.KeyA||t.left?1:0);
 player.vx=dir*4.5;if(dir)player.facing=dir;
 const previousBottom=player.y+player.h;
 player.x+=player.vx;
 player.vy=Math.min(player.vy+G,13.5);
 player.y+=player.vy;
 player.onGround=false;
 if(player.vy>=0){
   let landing=null;
   for(const p of level.plats){
     const currentBottom=player.y+player.h;
     if(player.x+player.w>p.x+3&&player.x<p.x+p.w-3&&previousBottom<=p.y+8&&currentBottom>=p.y){
       if(!landing||p.y<landing.y)landing=p;
     }
   }
   if(landing){player.y=landing.y-player.h;player.vy=0;player.onGround=true;player.coyote=10;}
 }
 if(player.coyote>0&&!player.onGround)player.coyote--;
 const wantsJump=k.Space||k.ArrowUp||k.KeyW||t.jump;
 if(wantsJump&&(player.onGround||player.coyote>0)){
   player.vy=-18.2;player.onGround=false;player.coyote=0;
   state.keys.Space=false;state.keys.ArrowUp=false;state.keys.KeyW=false;t.jump=false;
 }
 player.x=Math.max(0,Math.min(level.length-player.w,player.x));if(player.y>H+90){loseLife();}
 player.anim++;if(player.invuln>0)player.invuln--;
 level.enemies.forEach(e=>{if(!e.alive){if(e.deadTimer>0)e.deadTimer--;return;}e.x+=e.dir*.8;if(Math.abs(e.x-e.home)>48)e.dir*=-1;if(overlaps(player,{x:e.x,y:e.y,w:34,h:34})){if(player.vy>0&&player.y+player.h<e.y+27){e.alive=false;e.deadTimer=32;player.vy=-10;state.stars++;updateHud();toast("✨ ¡PUM! Has derrotado al "+e.name+". ¡Vamossss, campeón!");}else if(!player.invuln)loseLife();}});
 level.stars.forEach(s=>{if(!s.taken&&overlaps(player,{x:s.x-18,y:s.y-34,w:36,h:42})){s.taken=true;state.stars++;updateHud();if(state.stars%3===0)toast(loveMessages[Math.floor(Math.random()*loveMessages.length)]);}});
 if(!level.key.taken&&overlaps(player,{x:level.key.x,y:level.key.y-28,w:30,h:34})){level.key.taken=true;toast("¡Has encontrado la llave!");updateHud();}
 if(!level.chest.opened&&overlaps(player,{x:level.chest.x,y:level.chest.y-35,w:42,h:42})){level.chest.opened=true;openMemory();}
 if(!level.checkpoint.active&&player.x>level.checkpoint.x-20){level.checkpoint.active=true;player.checkpointX=level.checkpoint.x;toast("Punto de control activado");}
 if(overlaps(player,{x:level.door.x,y:level.door.y,w:level.door.w,h:level.door.h})){if(level.key.taken&&state.stars>=4){openWorldQuestion();}else toast(level.key.taken?"Te faltan estrellas para abrir el portal":"La puerta necesita una llave");}
 state.cam=Math.max(0,Math.min(level.length-W,player.x-W*.38));
}
function loseLife(){if(player.invuln)return;state.lives--;updateHud();if(state.lives<=0){toast("Se agotaron las vidas. Volvemos al punto de control.");state.lives=3;}player.x=player.checkpointX;player.y=300;player.vy=0;player.invuln=90;}
function openMemory(){
 state.active=false;state.dialog=true;
 $("dialogIcon").textContent="🎁";
 $("dialogTitle").textContent="¡Has encontrado un tesoro!";
 $("dialogText").textContent=loveMessages[Math.floor(Math.random()*loveMessages.length)];
 $("dialogChoices").innerHTML='<button id="memoryOk">¡Seguir la aventura!</button>';
 $("dialogExtra").textContent="";
 $("memoryOk").onclick=closeDialog;openDialog();
}
function openWorldQuestion(){
 if(state.answered.has(state.world)){nextWorld();return;}
 state.active=false;state.dialog=true;const w=worlds[state.world];
 $("dialogIcon").textContent=w.icon;
 $("dialogTitle").textContent="La pregunta del recuerdo";
 $("dialogText").textContent=w.question;
 $("dialogChoices").innerHTML="";$("dialogExtra").innerHTML="";
 if(w.textAnswer){
   $("dialogExtra").innerHTML='<input id="textAnswer" placeholder="Escribe tu respuesta" autocomplete="off"><button id="textAnswerCheck" class="main-btn">COMPROBAR</button>';
   $("textAnswerCheck").onclick=()=>{
     const answer=($("textAnswer").value||"").trim().toLocaleLowerCase("es").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[.!¡?¿]/g,"");
     const expected=w.expected.normalize("NFD").replace(/[\u0300-\u036f]/g,"");
     if(answer===expected)correctAnswer();else toast("¡Casi! Piensa en lo que más me gusta de ti.");
   };
 }else{
   w.answers.forEach((a,i)=>{const b=document.createElement("button");b.textContent=a;b.onclick=()=>i===w.correct?correctAnswer():toast("Esa pista no coincide. ¡Inténtalo de nuevo!");$("dialogChoices").appendChild(b);});
 }
 openDialog();
}
function correctAnswer(){state.answered.add(state.world);$("dialogTitle").textContent="¡Recuerdo desbloqueado!";$("dialogText").textContent=worlds[state.world].tip;$("dialogChoices").innerHTML='<button id="continueMemory">Continuar</button>'; $("dialogExtra").textContent="";$("continueMemory").onclick=()=>{closeDialog();nextWorld();};}
function closeDialog(){state.dialog=false;$("dialog").classList.add("hidden");state.active=true;}
$("dialogClose").onclick=closeDialog;
function openDialog(){ $("dialog").classList.remove("hidden");}
function openMemoryOrQuestion(){ }
function draw(){
 // The animation loop starts before the player enters the first world.
 // Keep the loop alive, but do not try to draw an uninitialized level.
 if(!level || !player){ctx.clearRect(0,0,W,H);return;}
 drawWorld();
}
function loop(ts){const dt=Math.min(32,ts-(state.lastTime||ts));state.lastTime=ts;update(dt/16.67);ctx.clearRect(0,0,W,H);draw();requestAnimationFrame(loop);}
requestAnimationFrame(loop);
window.addEventListener("keydown",e=>{if(["ArrowLeft","ArrowRight","ArrowUp","Space"].includes(e.code))e.preventDefault();state.keys[e.code]=true;if(e.code==="Escape")togglePause();if(e.code==="KeyE"||e.code==="Enter"){if(state.dialog)return;}});
window.addEventListener("keyup",e=>state.keys[e.code]=false);
function togglePause(){if($("gameScreen").classList.contains("hidden")||state.dialog||!state.worldStarted)return;state.paused=!state.paused;$("pauseOverlay").classList.toggle("hidden",!state.paused);state.active=!state.paused;}
$("pauseBtn").onclick=togglePause;$("resumeBtn").onclick=togglePause;
$("restartBtn").onclick=()=>{if(confirm("¿Reiniciar este mundo?"))beginWorld(true);};
$("pauseRestart").onclick=()=>{$("pauseOverlay").classList.add("hidden");beginWorld(true);};
$("toTitle").onclick=()=>{$("pauseOverlay").classList.add("hidden");state.active=false;show("titleScreen");};
$("playAgain").onclick=()=>{$("finalOverlay").classList.add("hidden");startGame();};
document.querySelectorAll(".mobile-controls button").forEach(btn=>{const key=btn.dataset.key;const down=e=>{e.preventDefault();state.touch[key]=true;};const up=e=>{e.preventDefault();state.touch[key]=false;};btn.addEventListener("pointerdown",down);btn.addEventListener("pointerup",up);btn.addEventListener("pointerleave",up);btn.addEventListener("pointercancel",up);});
$("finalMessage").textContent="Hay recuerdos que iluminan incluso la noche más fría. ¡Tu amorsin está orgullosa de ti!";
// Expose a tiny editable configuration point for future memories and the ending.
window.GAME_CUSTOM = { finalMessage: "Hay recuerdos que iluminan incluso la noche más fría. ¡Tu amorsin está orgullosa de ti!", extraQuestions: [], loveMessages };
})();