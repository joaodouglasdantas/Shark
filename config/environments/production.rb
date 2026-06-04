require "active_support/core_ext/integer/time"

Rails.application.configure do
  config.cache_classes = true
  config.eager_load = true
  config.consider_all_requests_local = false
  config.action_controller.perform_caching = true

  config.public_file_server.enabled = true

  config.assets.compile = false

  config.active_storage.service = :local

  config.force_ssl = false

  config.log_tags = [:request_id]
  config.logger = ActiveSupport::Logger.new(STDOUT).tap { |l| l.formatter = ::Logger::Formatter.new }
  config.log_level = ENV.fetch("RAILS_LOG_LEVEL", "info")

  config.action_mailer.perform_caching = false
  config.i18n.fallbacks = true
  config.active_support.report_deprecations = false
  config.log_formatter = ::Logger::Formatter.new

  config.active_record.dump_schema_after_migration = false
end
