class Category < ApplicationRecord
  belongs_to :user
  has_many :transactions, dependent: :destroy

  HEX_COLOR_REGEX = /\A#\h{6}\z/

  validates :name,  presence: true, length: { maximum: 60 },
                    uniqueness: { scope: :user_id, case_sensitive: false }
  validates :color, presence: true, format: { with: HEX_COLOR_REGEX,
                                              message: "deve estar no formato hexadecimal (#RRGGBB)" }

  before_validation :normalize_color

  scope :alphabetical, -> { order(Arel.sql("LOWER(name) ASC")) }

  def total_spent_in(range)
    transactions.expenses.in_range(range).sum(:amount)
  end

  private

  def normalize_color
    self.color = color.to_s.downcase.presence
  end
end
