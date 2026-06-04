class Transaction < ApplicationRecord
  self.inheritance_column = :_sti_disabled

  KINDS = %w[income expense].freeze

  belongs_to :user
  belongs_to :category

  validates :amount,      presence: true, numericality: { greater_than: 0 }
  validates :kind,        presence: true, inclusion: { in: KINDS }
  validates :date,        presence: true
  validates :description, length: { maximum: 120 }, allow_blank: true

  validate :category_must_belong_to_user

  scope :income,   -> { where(kind: "income")  }
  scope :expenses, -> { where(kind: "expense") }
  scope :in_range, ->(range) { where(date: range) }
  scope :recent,   -> { order(date: :desc, created_at: :desc) }

  def income?
    kind == "income"
  end

  def expense?
    kind == "expense"
  end

  def signed_amount
    income? ? amount : -amount
  end

  private

  def category_must_belong_to_user
    return if category.blank? || user.blank?
    return if category.user_id == user_id

    errors.add(:category, "deve pertencer ao usuário atual")
  end
end
