class DashboardController < ApplicationController
  PIE_THRESHOLD = 6

  def index
    @current_month = Date.current.beginning_of_month..Date.current.end_of_month
    transactions   = current_user.transactions.in_range(@current_month)

    @total_income  = transactions.income.sum(:amount)
    @total_expense = transactions.expenses.sum(:amount)
    @balance       = @total_income - @total_expense

    @expenses_by_category = current_user.transactions
                                        .expenses
                                        .in_range(@current_month)
                                        .joins(:category)
                                        .group("categories.name")
                                        .sum(:amount)
                                        .sort_by { |_, v| -v }
                                        .to_h

    @category_colors = current_user.categories
                                   .where(name: @expenses_by_category.keys)
                                   .pluck(:name, :color)
                                   .to_h

    range_12m = 11.months.ago.beginning_of_month..Date.current.end_of_month

    @income_series  = current_user.transactions.income
                                   .in_range(range_12m)
                                   .group_by_month(:date, format: "%b/%y")
                                   .sum(:amount)

    @expense_series = current_user.transactions.expenses
                                   .in_range(range_12m)
                                   .group_by_month(:date, format: "%b/%y")
                                   .sum(:amount)

    @comparison = (0..5).map do |offset|
      month_start = (Date.current.beginning_of_month - offset.months)
      month_range = month_start..month_start.end_of_month
      month_txn   = current_user.transactions.in_range(month_range)

      income  = month_txn.income.sum(:amount)
      expense = month_txn.expenses.sum(:amount)

      {
        label:   I18n.l(month_start, format: "%B/%Y").capitalize,
        income:  income,
        expense: expense,
        balance: income - expense
      }
    end.reverse

    @recent_transactions = current_user.transactions.includes(:category).recent.limit(5)
    @has_data = current_user.transactions.exists?
  end
end
