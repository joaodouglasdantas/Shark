import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["menu", "iconOpen", "iconClose"]

  toggle() {
    const hidden = this.menuTarget.classList.contains("hidden")
    this.menuTarget.classList.toggle("hidden", !hidden)
    this.iconOpenTarget.classList.toggle("hidden", hidden)
    this.iconCloseTarget.classList.toggle("hidden", !hidden)
  }

  close() {
    this.menuTarget.classList.add("hidden")
    this.iconOpenTarget.classList.remove("hidden")
    this.iconCloseTarget.classList.add("hidden")
  }
}
