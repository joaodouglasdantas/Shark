import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["picker", "text"]

  connect() {
    const initial = this.textTarget.value.trim()
    if (initial && /^#[0-9A-Fa-f]{6}$/.test(initial)) {
      this.pickerTarget.value = initial
    } else if (initial && /^[0-9A-Fa-f]{6}$/.test(initial)) {
      const normalized = `#${initial}`
      this.pickerTarget.value = normalized
      this.textTarget.value = normalized
    }
  }

  pickerChanged() {
    this.textTarget.value = this.pickerTarget.value
  }

  textChanged() {
    const raw = this.textTarget.value.trim()
    const hex = raw.startsWith("#") ? raw : `#${raw}`

    if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
      this.pickerTarget.value = hex
    }
  }
}
