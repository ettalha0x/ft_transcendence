import Http from "../http/http.js";
import Link from "./link.js";
import { ips } from "../http/ip.js";

export default class ProfileInfo extends HTMLElement {
  constructor() {
    super();
    this.user = Http.user;
    this.username = this.getAttribute("user");
    console.log("id : " + this.username);
  }
  connectedCallback() {
    if (this.username != this.user.username) {
      Http.getData("Get", `api/user/${this.username}`).then((data) => {
        if (data.error) {
          Link.navigateTo("/404");
          Http.website_stats.notify("toast", {
            message: data.error.detail,
            type: "error",
          });
        }
        this.user = data;
        console.log(this.user);
        this.render();
        this.markUnearnedAchievements();
        this.setupEventListeners();
      });
    } else {
      this.render();
      this.markUnearnedAchievements();
      this.setupEventListeners();
      this.setupEventListeners();
    }
  }

  markUnearnedAchievements() {
    const achievements = document.querySelectorAll(".achievement_list img");
    for (let i = 0; i < this.user.level; i++) {
      achievements[i].classList.add("earned");
    }
  }
  async fetchOrCreateConversation(senderId, receiverId) {
    try {
      const response = await fetch(
        `${ips.baseUrl}/chat/conversations/fetch_or_create/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.token}`,
          },
          credentials: "include",
          body: JSON.stringify({
            sender: senderId,
            receiver: receiverId,
          }),
        }
      );

      if (response.ok) {
        const conversation = await response.json();
        console.log("Fetched or created conversation:", conversation);
        return conversation;
      } else {
        const errorData = await response.json();
        console.error(
          "Error fetching or creating conversation:",
          errorData.detail || response.statusText
        );
      }
    } catch (error) {
      console.error("Error:", error);
    }
  }
  setupWebSocket() {
    this.websocket = new WebSocket(
      `${ips.socketUrl}/ws/chat/${Http.user.id}/${this.user.id}/`
    );

    this.websocket.addEventListener("open", function (event) {
      console.log("WebSocket connection opened.");
    });

    this.websocket.addEventListener("close", function (event) {
      console.log("WebSocket connection closed.");
    });
  }
  h;

  async sendMessage() {
    try {
      let conversation = await this.fetchOrCreateConversation(
        Http.user.id,
        this.user.id
      );
      // console.log("id : "+conversation.conversation.id);
      const messageContent = document.querySelector(".message-input").value;
      const messageData = {
        sender: Http.user.id,
        message: messageContent,
        timestamp: new Date().toISOString(),
        conversation: conversation.conversation.id,
      };

      this.setupWebSocket();
      const response = await fetch(`${ips.baseUrl}/chat/messages/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.token}`,
        },
        credentials: "include",
        body: JSON.stringify(messageData),
      });

      if (response.ok) {
        const data = await response.json();
        const dataWs = {
          type: "message",
          message: data.message,
          sender: data.sender,
        };
        console.log("Message saved:", data);
        this.websocket.send(JSON.stringify(dataWs));
        document.querySelector(".message-input").value = "";
      } else {
        const errorData = await response.json();
        console.error(
          "Error saving message:",
          errorData.detail || response.statusText
        );
      }
    } catch (error) {
      console.error("Error:", error);
    }
  }

  async setupEventListeners() {
    const buttonNew = document.querySelector(".new-msg");
    const buttonClose = document.querySelector(".close-btn");
    const msgPrompt = document.querySelector(".msg-prompt");
    const buttonSend = document.querySelector(".send-button");
    const add_friend = document.querySelector(".add_friend");

    if (add_friend !== null) {
      add_friend.addEventListener("click", async () => {
        let apiUrl = `${ips.baseUrl}/api/friends/`;

        fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            user1: Http.user.id,
            user2: this.user.id,
          }),
        })
          .then((response) => {
            console.log(response);
            if (response.ok) {
              Http.notification_socket.send(
                JSON.stringify({
                  type: "FRQ",
                  sender: Http.user.id,
                  receiver: this.user.id,
                  message: "Friend Request from " + Http.user.username,
                })
              );
            } else {
              console.error("Error:", response.statusText);
            }
          })
          .catch((error) => {
            console.error("Error:", error);
          });
      });
    }
    if (buttonNew) {
      buttonNew.addEventListener("click", () => {
        console.log("button message pressed");
        if (msgPrompt.classList.contains("hidden")) {
          msgPrompt.classList.remove("hidden");
          msgPrompt.classList.add("visible");
        } else {
          msgPrompt.classList.remove("visible");
          msgPrompt.classList.add("hidden");
        }
      });
    }

    buttonClose.addEventListener("click", () => {
      console.log("button close pressed");

      msgPrompt.classList.remove("visible");
      msgPrompt.classList.add("hidden");
    });

    buttonSend.addEventListener("click", () => {
      this.sendMessage();
      buttonClose.click();
    });

    const input_message = document.querySelector(".message-input");
    input_message.addEventListener("keypress", function (event) {
      if (event.key === "Enter") {
        event.preventDefault();
        buttonSend.click();
      }
    });
  }

  render() {
    this.innerHTML = /*HTML*/ `
    <style>
      .profile_img > img{
        width:150px;
        height:150px;
        margin: 0 25px ;
      }
      .av_img{
        width: 40px;
        height: 40px;
        object-fit: contain;
        margin: 15px 5px 0 5px;
      }
    </style>
        <div class="profile" >
      <div class="profile_img">
        <img src='${ips.baseUrl}${
      this.user.profile_pic
    }' class="profile_img" alt="profile" loading="lazy">
      </div>
      <div class="profile_info">
      <div class="wrapper_info_profile">
        <div class="name_n_login">
          <h1 id="user_name">${this.user.full_name}</h1>
          <h6 id="login">${this.user.username}</h6>
        </div>
        ${
          this.username === Http.user.username
            ? ""
            : `<div class="wallet_data_wrapper">
        <span>
        <i class="fa-sharp fa-light fa-coins" style="color: #04BF8A;"></i>
        </span>
        <span id="user_coins">2300$
        </span>
        <button class="new-msg send_msg no_style">
                <i class="fa-regular fa-message"></i>
              </button>
          <button class="add_friend no_style">
          <i class="fa fa-user-plus" aria-hidden="true"></i>
          </button>
        </div>`
        }
      </div>
        <div class="achievement">
          <div class="achievement_list">
          <img src="/public/assets/ranks/1.png" alt="medal" loading="lazy" class="av_img">
          <img src="/public/assets/ranks/2.png" alt="medal" loading="lazy" class="av_img">
          <img src="/public/assets/ranks/3.png" alt="medal" loading="lazy" class="av_img">
          <img src="/public/assets/ranks/4.png" alt="medal" loading="lazy" class="av_img">
          <img src="/public/assets/ranks/5.png" alt="medal" loading="lazy" class="av_img">
          <img src="/public/assets/ranks/6.png" alt="medal" loading="lazy" class="av_img">
          <img src="/public/assets/ranks/7.png" alt="medal" loading="lazy" class="av_img">
          </div>
          <h4 class="level">
            <span>${this.user.level}</span>
            <span>${this.user.exp}%</span>
          </h4>
          <div class="level-bar">
            <span style="width: ${this.user.exp}%;"></span>
          </div>
        </div>
        <div class="msg-prompt hidden" style="height: 150px;padding: 25px;border-radius: 12px;border: 1px solid white;">
        <div class="wrapper_modal" style="height: 100%;display: flex;flex-direction: column;justify-content: space-around;">

          <button class="close-btn">
            <i class="fa fa-close"> </i>
          </button>
        <div class="msg-prompt_sub1">
          <!-- <p>message to ${this.user.username}</p> -->
          <br><br><br>
        </div>
        <div class="msg-prompt_sub2">
          <input type="text" class="message-input" placeholder="Write your message here...">
          <button class="send-button send_btn_modal">
            <i class="fa fa-send"></i>
          </button>
        </div>
      </div>
      </div>
    </div>
    `;
  }
}

customElements.define("profile-info", ProfileInfo);
