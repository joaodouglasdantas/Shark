class User < ApplicationRecord
  devise :database_authenticatable, :registerable,
         :rememberable, :validatable

  has_many :categories,   dependent: :destroy
  has_many :transactions, dependent: :destroy
  has_many :loans,        dependent: :destroy
end
