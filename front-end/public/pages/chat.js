import Http from "../http/http.js";

export default class Chat extends HTMLElement {
  constructor() {
    super();
    this.user = Http.user;
    this.token = localStorage.getItem("token");
    this.receiverId = null;
    this.chatContainer = null;
    this.websocket = null;
  }

  connectedCallback() {
    this.render();
    this.fetchUsersWithConversations();
    this.setupEventListeners();
    this.setupWebSocket();
  }

  setupWebSocket() {
    this.websocket = new WebSocket("ws://127.0.0.1:8000/ws/chat/");
    this.websocket.onerror = function (event) {
      console.error("WebSocket error observed:", event);
    };

    this.websocket.addEventListener("open", function (event) {
      console.log("WebSocket connection opened.");
    });

    this.websocket.onmessage = this.handleWebSocketMessage.bind(this);
    this.websocket.addEventListener("close", function (event) {
      console.log("WebSocket connection closed.");
    });
  }
  handleWebSocketMessage(event) {
    const message = JSON.parse(event.data);
    console.log("ws got " + message);
    this.fetchChatData(this.user.id, this.receiverId);
  }

  async fetchChatData(senderId, receiverId) {
    try {
      const response = await fetch(
        `http://localhost:8000/chat/messages/conversation/?sender_id=${senderId}&receiver_id=${receiverId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      if (response.ok) {
        const chatData = await response.json();
        console.log(chatData);
        this.displayMessages(chatData);
      } else {
        const errorData = await response.json();
        console.error(
          "Error fetching chat data:",
          errorData.detail || response.statusText
        );
      }
    } catch (error) {
      console.error("Error:", error);
    }
  }

  async fetchUsersWithConversations() {
    try {
      const response = await fetch(
        `http://localhost:8000/chat/users/conversations/`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      if (response.ok) {
        const users = await response.json();
        console.log("Users with conversations:", users);
        this.displayUsers(users);
      } else {
        console.error(
          "Error fetching users with conversations:",
          response.statusText
        );
      }
    } catch (error) {
      console.error("Error:", error);
    }
  }

  displayUsers(users) {
    const userContainer = this.querySelector(".first_section_wrapper_chat");
    userContainer.innerHTML = `<div class="first_profile_wrapper_chat">
                        <div class="pdp_warpper">
                            <img src="http://localhost:8000${this.user.profile_pic}" class="pfp_logo">
                            <div class="txt_one">Chats</div>

                        </div>
                        <div class="icon_wrapper_">
                            <i class="fa-solid fa-circle-ellipsis fa-2xl" style="color: #ffffff;"></i>
                        </div>
                    </div>`;

    users.forEach((user) => {
      const userElementHTML = `
                <div class="chat_bulles_wrapper user" id="${user.id}" name="${user.username}">
                    <div class="chat_bulle_wrapper">
                        <div class="chat_pdp_wrapper" style="position: relative;">
                            <user-avatar image="http://localhost:8000${user.profile_pic}" state="online" width="70" height="70"></user-avatar>
                        </div>
                        <div class="data_chat_bulle_wrapper">
                            <div class="name_bulle_chat">${user.username}</div>
                        </div>
                    </div>
                </div>
            `;

      userContainer.innerHTML += userElementHTML;
    });

    this.addUserClickListeners();
  }

  addUserClickListeners() {
    const userElements = this.querySelectorAll(".chat_bulles_wrapper");

    userElements.forEach((userElement) => {
      userElement.addEventListener("click", () => {
        console.log("clicked");
        const receiverId = userElement.id;
        const senderId = this.user.id;
        this.receiverId = receiverId;
        this.fetchChatData(senderId, receiverId);
        this.querySelector(".logo_chat_user").src =
          userElement.querySelector(".avatar_icon").src;
        this.querySelector(".name_user_con").innerHTML =
          userElement.getAttribute("name");
        this.querySelector(".pdp_img_a").src =
          userElement.querySelector(".avatar_icon").src;
        this.querySelector(".name_container_third_wrapper_").innerHTML =
          userElement.getAttribute("name");
        this.querySelector(".find_conv").style.display = "none";
        this.querySelector(".second_section_wrapper_chat").style.display =
          "block";
        this.querySelector(".third_section_wrapper_chat").style.display =
          "block";
      });
    });
  }

  displayMessages(messages) {
    this.chatContainer = this.querySelector(".slots_messages_container__");
    this.chatContainer.innerHTML = "";

    messages.forEach((message) => {
      let messageHTML = "";
      if (message.sender != this.user.id) {
        messageHTML = `
                    <div class="slot_message_container___">
                        <div class="message_container__ second_msg_user">
                            <div class="message_user_container__">
                                <div class="message_user_content__">
                                    ${message.message}
                                </div>
                            </div>
                        </div>
                    </div>
                `;
      } else {
        messageHTML = `
                    <div class="slot_message_container___">
                        <div class="message_container__ first_msg_user">
                            <div class="message_user_container__">
                                <div class="message_user_content__">
                                    ${message.message}
                                </div>
                            </div>
                        </div>
                    </div>
                `;
      }

      this.chatContainer.innerHTML += messageHTML;
    });
    this.chatContainer.scrollTop = this.chatContainer.scrollHeight; // this for showing the very last messages of the conversation
  }

  displayMessage(message) {
    if (
      message.sender === this.receiverId ||
      message.receiver === this.receiverId
    ) {
      this.displayMessages([message]);
    }
  }

  async sendMessage() {
    console.log("sending message to ", this.receiverId);
    if (!this.receiverId) {
      console.error("No receiver selected");
      this.clearChatArea();
      return;
    }

    const messageContent = document.querySelector(".message-input").value;
    const messageData = {
      sender: this.user.id,
      receiver: this.receiverId,
      message: messageContent,
      timestamp: new Date().toISOString(),
    };

    this.websocket.send(JSON.stringify(messageData));

    try {
      const response = await fetch("http://localhost:8000/chat/messages/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(messageData),
      });

      if (response.ok) {
        const data = await response.json();
        this.websocket.send(JSON.stringify(data));
        console.log("Message saved:", data);
        document.querySelector(".message-input").value = "";
        this.displayMessage(data);
      } else {
        console.error("Error saving message:", response.statusText);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  }

  clearChatArea() {
    this.querySelector(".second_section_wrapper_chat").innerHTML = "";
    this.querySelector(".second_section_wrapper_chat").style.display = "none";
  }

  setupEventListeners() {
    const sendButton = this.querySelector(".send-button");
    document
      .querySelector(".message-input")
      .addEventListener("keypress", function (event) {
        if (event.key === "Enter") {
          event.preventDefault();
          sendButton.click();
        }
      });
    console.log("recer ", this.receiverId);
    sendButton.addEventListener("click", () => {
      this.sendMessage();
      const data = {
        type: "message",
        receiver: this.receiverId,
        message: document.querySelector(".message-input").value,
      };
      Http.notification_socket.send(JSON.stringify(data));
    });
  }

  render() {
    this.innerHTML = /*html*/ `
            <div class="chat_wrapper_">
                <div class="first_section_wrapper_chat">
                    
                </div>
                <div class="find_conv">
                <i class="fa-duotone fa-solid fa-comments"></i>
                        <h1>select a conversation to start chatting</h1>
                        <p>or find a frind and chat</p>
                        <button class="find_friends">find friends</button>
                </div>
                <div class="second_section_wrapper_chat">
                    <div class="wrapper_first_con_second_section">
                            <div class="first_wrapper_info_user_chat_wrapper">
                                <div class="first_side_wrapper_con_chat__">
                                    <img src="../assets/pdp.png" alt="logo_user" class="logo_chat_user">
                                    <div class="infos_con_user_wrapper">
                                        <h3 class="name_user_con" id="username">
                                        </h3>
                                        <p class="status_user_con">
                                            Online
                                        </p>
                                    </div>
                                </div>
                                <div class="second_side_wrapper_con_chat__">
                                    <button class='play_invite'>
                                    <i class="fa-solid fa-gamepad-modern fa-2xl"></i>
                                    </button>
                                </div>
                            </div>
                    </div>
                    <div class="chat_container_conv__">
                            <div class="conv_data_container_chat__">
                                <div class="slots_messages_container__">

                                </div>
                            </div>
                            <div style="display: flex; justify-content: center; width: 100%;">
                                <div class="input_conv_container__chat">
                                    <textarea name="" id="" class="send_msg_input message-input" rows="1" placeholder="Message"></textarea>
                                    <button class="send-button">Send</button>
                                </div>
                            </div>
                    </div>
                </div>
                <div class="third_section_wrapper_chat">
                    <div class="infos_container_third_sec_chat">
                        <div class="img_pdp_third_container_wrapper">
                            <img src="assets/pdp.png" alt="profile picture" class="pdp_img_a">
                        </div>
                        <div class="details_container_third_wrapper">
                            <h2 class="name_container_third_wrapper_ white">
                                Othmane
                            </h2>
                            <div class="status_third_wrapper_ gray">
                                Online
                            </div>
                        </div>
                    </div>
                    <div class="shared_files_wrapper__third_sec_">
                        <div class="tile_dropdown_wrapper__third">
                            <div class="title_con___ white">
                                Shared Files
                            </div>
                            <div class="dropdown_con___">
                                <img src="assets/drop_icon_arrow.png" alt="grp33" class="drop_down_icon">
                            </div>
                        </div>
                    </div>
                    <div class="shared_files_wrapper__third_sec_">
                        <div class="tile_dropdown_wrapper__third">
                            <div class="title_con___ white">
                                Shared Files
                            </div>
                            <div class="dropdown_con___">
                                <img src="assets/drop_icon_arrow.png" alt="grp33" class="drop_down_icon">
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

    this.chatContainer = this.querySelector(".slots_messages_container__"); // Set chat container reference
    this.userContainer = this.querySelector(".first_section_wrapper_chat"); // Set chat container reference
    const textArea = this.querySelector(".send_msg_input");
    textArea.addEventListener("input", function () {
      this.style.height = "auto";
      this.style.height = this.scrollHeight + "px";
    });
    const playInvite = this.querySelector(".play_invite");
    playInvite.addEventListener("click", () => {
      alert("This feature is not available yet");
    });
    this.querySelector(".second_section_wrapper_chat").style.display = "none";
  }
}

customElements.define("chat-page", Chat);
