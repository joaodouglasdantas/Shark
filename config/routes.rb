Rails.application.routes.draw do
  devise_for :users

  authenticated :user do
    root "dashboard#index", as: :authenticated_root
  end
  root "home#index"

  get "dashboard", to: "dashboard#index", as: :dashboard

  resources :categories
  resources :transactions
  resources :loans do
    resources :loan_payments, only: %i[create destroy]
  end

  get "up" => "rails/health#show", as: :rails_health_check

  get "plano", to: "plano#index", as: :plano
end
