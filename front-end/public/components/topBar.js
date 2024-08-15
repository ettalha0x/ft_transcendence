import Link from "./link.js";

export default class TopBar extends HTMLElement {
  constructor() {
    super();
    this.welcome = false;
  }

  connectedCallback() {
    this.initURLChangeDetection();
    this.checkAndRender();
  }

  checkAndRender() {
    const path = window.location.pathname;
    if (path === "/dashboard")
      this.welcome = true;
    else
      this.welcome = false;
    this.render();
  }

  initURLChangeDetection() {
    this.selected = window.location.pathname;
    // Listen for popstate, hashchange, and custom locationchange events
    window.addEventListener("locationchange", this.checkAndRender.bind(this));
  }

  render() {
    this.innerHTML = /*HTML*/ `
        <div class="chat_notification_bar_wrapper">
        ${this.welcome ? "<h1 id='welcoming'>Welcom back,</h1>" : ""}
        <div>
                <div class="search_input_wrapper">
                    <input type="text" name="search" id="search_chat" class="search_chat"
                        placeholder="Search Everything">
                </div>
                <div class="notification_wrapper">
                    <i class="fa-thin fa-bell fa-xl notification_icon" style="color: white;"></i>
                </div>
            </div>
            </div>
        `;
  }
}

customElements.define("top-bar", TopBar);
