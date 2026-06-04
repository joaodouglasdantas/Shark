import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["message"]

  connect() {
    setTimeout(() => {
      this.element.classList.add("opacity-0", "transition", "duration-500")
      setTimeout(() => this.element.remove(), 600)
    }, 4500)
  }
}
