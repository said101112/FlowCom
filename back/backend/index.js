import express from 'express'
import mongoose from 'mongoose';
const app = express();
import { Server } from 'socket.io';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import authRoutes from './routes/index.js';
import http from 'http'
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import user from './models/user.js';
import { generateSuggestions } from './Utils/AI.js';
dotenv.config();

const server = http.createServer(app);

// Middleware pour lire les cookies
app.use(cors({
  origin: 'http://localhost:4200',
  credentials: true
}));

app.use(cookieParser());

const PORT=3000;

app.use(express.json());

mongoose.connect(process.env.MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log("✅ MongoDB connecté"))
  .catch((err) => console.error("❌ Erreur de connexion MongoDB :", err));


app.use('/auth',authRoutes);

// initialiser socket server 

export const io = new Server(server,{
  cors:{origin :'http://localhost:4200',
    credentials: true}
});

// Store online users 
const MAX_LAST_MESSAGES = 8; 
export const Msg ={};
export const onlineUser = {} ;
io.on("connection",(socket)=>{
  /* const userId = socket.handshake.query.userId ; */
  const token = socket.handshake.headers.cookie?.split('auth_token=')[1];

  if (!token) return socket.disconnect();
  try{
  const payload=jwt.verify(token,process.env.JWT_SECRET);
  const userId=payload.id;
  console.log(" user connected ",userId);
  if(userId) onlineUser[userId] = socket.id;
  console.log( 'Users Online : ',onlineUser );

  io.emit("getOnlineUsers",Object.keys(onlineUser));
  socket.on('sendMessage', async({Room,message})=>{
     
     console.log('new msg sender',message);
     console.log('room of user :' , Room);
     if(!Msg[Room]) Msg[Room]=[];
     Msg[Room].push({
      id:message.senderId,
      text:message.text

     })

     if(Msg[Room].length>MAX_LAST_MESSAGES){
      Msg[Room]=Msg[Room].slice(-MAX_LAST_MESSAGES);
     }

     const lastm= Msg[Room].map((m)=>({
      user:m.id,
      text:m.text
     })
     )
      const s = await generateSuggestions(message.text,lastm);


      console.log("sssesgestion : ",s);
      const dest = onlineUser[message.receverId];
      if(dest){
        io.to(dest).emit('ai_segg',{
          s
        })
      }
   

  })
    socket.on('joinRoom',(r)=>{
    socket.join(r);
     console.log(`${socket.id} a rejoint ${r}`);
  })




socket.on('AddFriend', async ({ id, CodeConnectF }) => {
    console.log('[AddFriend] reçu', { id, CodeConnectF });

    try {
      // 1) récupération 'me'
      const me = await user.findById(id);
      if (!me) {
        console.log('[AddFriend] utilisateur me introuvable', id);
        socket.emit('AddFriendError', { message: 'Utilisateur introuvable' });
        return;
      }
      console.log('[AddFriend] me trouvé:', me._id.toString());

      // 2) récup friend (ATTENTION au nom du champ)
      // adapte "ConnectCode" si ton champ est différent
      const friend = await user.findOne({ ConnectCode: CodeConnectF });
      if (!friend) {
        console.log('[AddFriend] friend non trouvé pour code', CodeConnectF);
        socket.emit('AddFriendError', { message: 'Code introuvable' });
        return;
      }
      console.log('[AddFriend] friend trouvé:', friend._id.toString());

      // 3) self-check
      if (me._id.equals(friend._id)) {
        console.log('[AddFriend] tentative auto-ajout refusée');
        socket.emit('AddFriendError', { message: "Tu ne peux pas t'ajouter toi-même" });
        return;
      }

      // 4) check déjà ami — comparer en string ou equals
      const meHasFriend = Array.isArray(me.amis) && me.amis.some(a => a.equals(friend._id));
      if (meHasFriend) {
        console.log('[AddFriend] déjà amis entre', me._id.toString(), 'et', friend._id.toString());
        socket.emit('AddFriendError', { message: 'Vous êtes déjà amis' });
        return;
      }

      // 5) push + save (log avant/après)
      me.amis = me.amis || [];
      friend.amis = friend.amis || [];

      me.amis.push(friend._id);
      friend.amis.push(me._id);

      console.log('[AddFriend] me.amis before save:', me.amis.map(x => x.toString()));
      console.log('[AddFriend] friend.amis before save:', friend.amis.map(x => x.toString()));

      await me.save();
      console.log('[AddFriend] me saved OK');

      await friend.save();
      console.log('[AddFriend] friend saved OK');

      // 6) notify both users in real-time (si rooms exist)
      io.to(friend._id.toString()).emit('newFriend', {
        from: me._id.toString(),
        username: me.username || null
      });
      socket.emit('friendAdded', {
        friendId: friend._id.toString(),
        username: friend.username || null
      });

      console.log('[AddFriend] émissions envoyées');
    } catch (err) {
      console.error('[AddFriend] erreur:', err);
      socket.emit('AddFriendError', { message: 'Erreur serveur lors de l\'ajout', detail: err.message });
    }
  });


  socket.on("disconnect",()=>{
    delete onlineUser[userId];
    io.emit("getOnlineUsers",Object.keys(onlineUser))
  })
  } catch (err) {
    console.log('JWT invalide', err);
    socket.disconnect();
  }
  
})


server.listen(PORT,()=>{
    console.log(`Backend is listen in port ${PORT}`);
})