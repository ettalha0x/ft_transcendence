import Link from "./link.js";
import Http from "../http/http.js";

export default class SideBar extends HTMLElement {
  constructor() {
    super();
    this.active = false;
    this.boundCheckAndRender = this.checkAndRender.bind(this);
  }

  connectedCallback() {
    this.checkAndRender();
  }

  findSelected() {
    const links = this.querySelectorAll("a");
    for (let i = 0; i < links.length; i++) {
      const link = links[i];
      if (window.location.pathname === link.getAttribute("href")){
        link.classList.add("active");
      }
      else if ( Link.startWith(window.location.pathname, link.getAttribute("href")) && link.getAttribute("href") !== "/dashboard") {
        link.classList.add("active");
      } else {
        link.classList.remove("active");
      }
    }
  }

  handellogout() {
    Http.logout().then(() =>{
      Link.navigateTo("/");
    }
    );
  }

  // Check the current URL and render if it matches certain criteria
  checkAndRender() {
    const path = window.location.pathname;
    if (path === "/" || Link.startWith(path, "/game") || Link.startWith(path, "/auth")) {
      return;
    }
    this.render();
    this.findSelected();
    const logoutBtn = this.querySelector(".logout_logo_wrapper");
    logoutBtn.addEventListener("click", this.handellogout);
    this.initURLChangeDetection();
  }

  // Initialize URL change detection
  initURLChangeDetection() {
    window.removeEventListener("locationchange", this.boundCheckAndRender);
    window.addEventListener("locationchange", this.boundCheckAndRender);
  }

  attributeChangedCallback(name, oldValue, newValue) {
    console.log(name, oldValue, newValue);
  }

  disconnectedCallback() {
    window.removeEventListener('locationchange', this.checkAndRender);

  }

  render() {
    this.innerHTML = /*HTML*/ `
<div class="sidebar_wrapper">
    <div class="logo_wrapper">
      <img src="/public/assets/gamelogo.png" alt="game logo" class="icon_side_bar" loading="lazy">
    </div>
    <div class="dash_logos_wrapper">
      <a is="co-link" href="/dashboard" class="active">
        <i class="fa-thin fa-objects-column fa-2xl icon_side_bar"></i>
      </a>
      <a is="co-link" href="/dashboard/game">
        <i class="fa-light fa-gamepad-modern fa-2xl icon_side_bar"></i>
      </a>
      <a is="co-link" href="/dashboard/tournament">
        <i class="fa-sharp fa-light fa-code-fork fa-2xl icon_side_bar"></i>
      </a>
      <a is="co-link" href="/dashboard/chat">
        <i class="fa-light fa-message-dots fa-2xl icon_side_bar chat_icon"></i>
      </a>
      <a is="co-link" href="/dashboard/profile">
        <i class="fa-thin fa-user fa-2xl icon_side_bar"></i>
      </a>
      <a is="co-link" href="/dashboard/settings">
        <i class="fa-light fa-gear fa-2xl icon_side_bar"></i>
      </a>
    </div>
    <div class="logout_logo_wrapper">
      <i class="fa-light fa-left-from-bracket fa-2xl icon_side_bar"></i>
    </div>
</div>
`;
  }
}
customElements.define("side-bar", SideBar);
