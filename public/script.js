let token = "";
let email = "";

const loginContainer = document.getElementById("loginContainer");
const chatContainer = document.getElementById("chatContainer");
const chatbox = document.getElementById("chatbox");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const toggleTheme = document.getElementById("toggleTheme");

document.getElementById("signupBtn").addEventListener("click", async () => {
  const username = document.getElementById("username").value;
  email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const res = await fetch("/api/signup", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({username,email,password}) });
  const data = await res.json();
  document.getElementById("loginMsg").innerText = data.message || data.error;
});

document.getElementById("loginBtn").addEventListener("click", async () => {
  email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const res = await fetch("/api/login", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({email,password}) });
  const data = await res.json();
  if(data.token){
    token = data.token;
    loginContainer.style.display="none";
    chatContainer.style.display="flex";
    data.chatHistory.forEach(msg=>addMessage(msg.message,msg.role));
  } else {
    document.getElementById("loginMsg").innerText = data.error;
  }
});

toggleTheme.addEventListener("click", ()=>{ document.body.classList.toggle("dark"); });

sendBtn.addEventListener("click", sendMessage);
userInput.addEventListener("keypress", e=>{ if(e.key==="Enter") sendMessage(); });

async function sendMessage(){
  const text = userInput.value.trim();
  if(!text) return;
  addMessage(text,"user");
  userInput.value="";
  typeMessage("Typing...","bot");

  const res = await fetch("/api/chat", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({message:text,email}) });
  const data = await res.json();
  chatbox.lastChild.textContent="";
  typeMessage(data.reply,"bot");
}

function addMessage(text,sender){
  const msg = document.createElement("div");
  msg.classList.add("message",sender);
  msg.textContent=text;
  chatbox.appendChild(msg);
  chatbox.scrollTop=chatbox.scrollHeight;
}

function typeMessage(text,sender){
  const msg = document.createElement("div");
  msg.classList.add("message",sender);
  chatbox.appendChild(msg);
  let i=0;
  function type(){
    if(i<text.length){
      msg.textContent+=text.charAt(i);
      i++;
      chatbox.scrollTop=chatbox.scrollHeight;
      setTimeout(type,20);
    }
  }
  type();
}
