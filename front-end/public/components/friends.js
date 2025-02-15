import Http from "../http/http.js";

export default class Friends extends HTMLElement {
    constructor() {
        super();
        Http.website_stats.addObserver({ update: this.update.bind(this), event: "friends" });
        Http.website_stats.addObserver({ update: this.update.bind(this), event: "remove_friend" });
        Http.website_stats.addObserver({ update: this.update.bind(this), event: "status_update" });
    }

    update() {
        this.render();
        this.getFriends();
    }

    getFriends() {
        const friends_wrapper = document.querySelector(".friend_online_wrapper")

        const online_friend = document.querySelector(".online_friend")
        Http.getData("GET", "api/friends")
            .then(response => {
                this.friends_data = response
                console.log(this.friends_data)
                return (response)
            })
            .then(data => {
                for (let i = 0; i < data.length; i++) {
                    let fr;
                    console.log(data[i])
                    if (data[i].user1.id === Http.user.id)
                        fr = `<friend-data id="${data[i].user2.id}" state=${data[i].user2.online} profile_pic="${data[i].user2.profile_pic}"  full_name="${data[i].user2.full_name}" friendship_id="${ data[i].id}" style="width:100%"></friend-data>`
                    else
                        fr = `<friend-data id="${data[i].user1.id}" state=${data[i].user1.online} profile_pic="${data[i].user1.profile_pic}"  full_name="${data[i].user1.full_name}" friendship_id="${ data[i].id}" style="width:100%"></friend-data>`
                        friends_wrapper.innerHTML += fr
                }
                if (data.length === 0) {
                    online_friend.style.overflow = "hidden";
                    friends_wrapper.innerHTML =
                        `
                        <img src="/public/assets/lonely-96.png" alt="empty" style="width: 96px;height: 96px;" lazy="loading">
      <h1>you don't have any friends yet</h1>
      `
                    friends_wrapper.classList.add("center_toggle")
                }
            })
    }


    connectedCallback() {
        this.render();
        this.getFriends();
    }

    render() {
        this.innerHTML = /*HTML*/ `
            <div class="online_friend" style="display: flex;flex-direction: column;padding: 15px 0;">
            <h1>Friends</h1>
            <div class="friend_online_wrapper" style="width: 100%;">
            </div>
        </div>
        `;
    }

}

customElements.define("c-friends", Friends);
