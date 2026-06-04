class LoanPayment < ApplicationRecord
  belongs_to :loan
  belongs_to :linked_transaction, class_name: "Transaction", foreign_key: "transaction_id", optional: true

  validates :amount,  presence: true, numericality: { greater_than: 0 }
  validates :paid_on, presence: true
  validates :installment_number, numericality: { only_integer: true, greater_than: 0 }, allow_nil: true
  validates :notes, length: { maximum: 120 }, allow_blank: true

  scope :recent, -> { order(paid_on: :desc, created_at: :desc) }
end
