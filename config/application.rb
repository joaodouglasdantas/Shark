require_relative "boot"

require "rails/all"

Bundler.require(*Rails.groups)

module Lavix
  class Application < Rails::Application
    config.load_defaults 7.1

    config.time_zone = "Brasilia"
    config.i18n.default_locale = :"pt-BR"
    config.i18n.available_locales = [:"pt-BR", :en]
    config.i18n.load_path += Dir[Rails.root.join("config/locales/**/*.{rb,yml}")]

    config.active_record.default_timezone = :utc
    config.generators.system_tests = nil

    config.autoload_lib(ignore: %w(assets tasks))
  end
end
