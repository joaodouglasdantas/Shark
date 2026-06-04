class Loan < ApplicationRecord
  KINDS    = %w[borrowed lent].freeze
  STATUSES = %w[active paid overdue].freeze

  belongs_to :user
  has_many   :loan_payments, dependent: :destroy

  validates :name,         presence: true, length: { maximum: 100 }
  validates :kind,         presence: true, inclusion: { in: KINDS }
  validates :status,       presence: true, inclusion: { in: STATUSES }
  validates :total_amount, presence: true, numericality: { greater_than: 0 }
  validates :start_date,   presence: true
  validates :interest_rate,      numericality: { greater_than_or_equal_to: 0 }, allow_nil: true
  validates :installments_count, numericality: { only_integer: true, greater_than: 0 }, allow_nil: true

  scope :active,   -> { where(status: "active") }
  scope :paid,     -> { where(status: "paid") }
  scope :overdue,  -> { where(status: "overdue") }
  scope :borrowed, -> { where(kind: "borrowed") }
  scope :lent,     -> { where(kind: "lent") }
  scope :recent,   -> { order(start_date: :desc, created_at: :desc) }

  def borrowed?
    kind == "borrowed"
  end

  def lent?
    kind == "lent"
  end

  def active?
    status == "active"
  end

  def paid?
    status == "paid"
  end

  def overdue?
    status == "overdue"
  end

  def amount_paid
    loan_payments.sum(:amount)
  end

  def amount_remaining
    [total_amount - amount_paid, 0].max
  end

  def progress_percentage
    return 100 if total_amount.zero?

    [(amount_paid / total_amount * 100).round, 100].min
  end

  def payments_count
    loan_payments.count
  end

  def sync_status!
    return if paid?

    if amount_remaining <= 0
      update_column(:status, "paid")
    elsif due_date.present? && due_date < Date.current && amount_remaining > 0
      update_column(:status, "overdue")
    end
  end
end
