class PlanoController < ApplicationController
  BAR_THRESHOLD      = 6
  EVOLUTION_MAX_CATS = 8

  def index
    @has_data = current_user.transactions.expenses.exists?
    return unless @has_data

    @this_month   = Date.current.beginning_of_month..Date.current.end_of_month
    @last_3_months_range = 3.months.ago.beginning_of_month..Date.current.end_of_month
    @last_6_months_range = 6.months.ago.beginning_of_month..Date.current.end_of_month

    this_month_txn     = current_user.transactions.in_range(@this_month)
    @this_month_income  = this_month_txn.income.sum(:amount)
    @this_month_expense = this_month_txn.expenses.sum(:amount)
    @this_month_balance = @this_month_income - @this_month_expense

    @most_expensive_transaction = current_user.transactions
                                              .expenses
                                              .in_range(@this_month)
                                              .joins(:category)
                                              .includes(:category)
                                              .order(amount: :desc)
                                              .first

    @expenses_by_category_all = current_user.transactions
                                            .expenses
                                            .joins(:category)
                                            .group("categories.name", "categories.color")
                                            .sum(:amount)
                                            .map { |(name, color), total| { name: name, color: color, total: total } }
                                            .sort_by { |c| -c[:total] }

    first_date = current_user.transactions.expenses.minimum(:date)
    if first_date
      evolution_range = first_date.beginning_of_month..Date.current.end_of_month

      cat_info = current_user.transactions.expenses
                             .joins(:category)
                             .group("categories.name", "categories.color")
                             .count
                             .keys
                             .map { |(name, color)| { name: name, color: color } }

      all_evolution = cat_info.map do |cat|
        data = current_user.transactions.expenses
                           .joins(:category)
                           .where(categories: { name: cat[:name] })
                           .in_range(evolution_range)
                           .group_by_month(:date, format: "%b/%y")
                           .sum(:amount)
        { name: cat[:name], color: cat[:color], data: data }
      end.sort_by { |c| -c[:data].values.sum }

      @evolution_cat_total = all_evolution.size
      @evolution_by_cat    = all_evolution.first(EVOLUTION_MAX_CATS)
    else
      @evolution_by_cat    = []
      @evolution_cat_total = 0
    end

    @expenses_by_category_month = current_user.transactions
                                              .expenses
                                              .in_range(@this_month)
                                              .joins(:category)
                                              .group("categories.name", "categories.color")
                                              .sum(:amount)
                                              .map { |(name, color), total| { name: name, color: color, total: total } }
                                              .sort_by { |c| -c[:total] }

    @category_colors_map = current_user.categories.pluck(:name, :color).to_h

    category_data = {}

    (1..3).each do |offset|
      month_start = (Date.current.beginning_of_month - offset.months)
      month_range = month_start..month_start.end_of_month

      current_user.transactions
                  .expenses
                  .in_range(month_range)
                  .joins(:category)
                  .group("categories.name", "categories.color")
                  .sum(:amount)
                  .each do |(name, color), amount|
        category_data[name] ||= { color: color, months: [] }
        category_data[name][:color] = color
        category_data[name][:months] << amount
      end
    end

    @forecast_months_available = (1..3).count do |offset|
      month_start = (Date.current.beginning_of_month - offset.months)
      month_range = month_start..month_start.end_of_month
      current_user.transactions.expenses.in_range(month_range).exists?
    end
    @forecast_months_available = [@forecast_months_available, 1].max

    @forecast_next_month = category_data.map do |name, data|
      avg = data[:months].sum / data[:months].length.to_f
      {
        name:    name,
        color:   data[:color],
        average: avg.round(2),
        months:  data[:months].length
      }
    end.sort_by { |c| -c[:average] }

    @forecast_total = @forecast_next_month.sum { |c| c[:average] }

    last_month_start  = 1.month.ago.beginning_of_month
    last_month_range  = last_month_start..last_month_start.end_of_month
    prev_month_start  = 2.months.ago.beginning_of_month
    prev_month_range  = prev_month_start..prev_month_start.end_of_month

    last_month_by_cat = current_user.transactions.expenses.in_range(last_month_range)
                                    .joins(:category)
                                    .group("categories.name")
                                    .sum(:amount)

    prev_month_by_cat = current_user.transactions.expenses.in_range(prev_month_range)
                                    .joins(:category)
                                    .group("categories.name")
                                    .sum(:amount)

    all_cat_names = (last_month_by_cat.keys + prev_month_by_cat.keys).uniq
    @trends = all_cat_names.map do |name|
      last  = last_month_by_cat[name] || 0
      prev  = prev_month_by_cat[name] || 0
      delta = prev > 0 ? ((last - prev) / prev.to_f * 100).round(1) : nil

      { name: name, last_month: last, prev_month: prev, delta: delta }
    end.sort_by { |t| -(t[:delta] || 0) }

    @health_score = calculate_health_score

    saving_data = (1..6).filter_map do |offset|
      month_start = (Date.current.beginning_of_month - offset.months)
      month_range = month_start..month_start.end_of_month
      txn = current_user.transactions.in_range(month_range)
      inc = txn.income.sum(:amount)
      exp = txn.expenses.sum(:amount)
      next if inc == 0 && exp == 0
      inc > 0 ? ((inc - exp) / inc.to_f * 100).round(1) : nil
    end.compact

    @saving_rate_months = saving_data.length
    @avg_saving_rate    = saving_data.any? ? (saving_data.sum / saving_data.length.to_f).round(1) : 0.0

    @insights = generate_insights
  end

  private

  def calculate_health_score
    score = 50

    months_data = (1..3).map do |offset|
      month_start = (Date.current.beginning_of_month - offset.months)
      month_range = month_start..month_start.end_of_month
      txn = current_user.transactions.in_range(month_range)
      { income: txn.income.sum(:amount), expense: txn.expenses.sum(:amount) }
    end

    positive_months = months_data.count { |m| m[:income] > m[:expense] }
    score += positive_months * 10  

    categories_used = current_user.transactions.expenses
                                  .in_range(3.months.ago..Date.current)
                                  .distinct.count(:category_id)
    score += [categories_used * 2, 10].min 

    if @trends.present?
      high_growth = @trends.count { |t| t[:delta] && t[:delta] > 20 }
      score -= high_growth * 5  
    end

    [[score, 100].min, 0].max
  end

  def generate_insights
    insights = []

    if @most_expensive_transaction
      label = @most_expensive_transaction.description.present? \
                ? "\"#{@most_expensive_transaction.description}\"" \
                : "um lançamento sem descrição"
      insights << {
        type:  :info,
        icon:  "💸",
        title: "Maior compra do mês",
        body:  "#{label} foi sua compra mais cara: #{number_to_currency_brl(@most_expensive_transaction.amount)} em #{@most_expensive_transaction.category.name}."
      }
    end

    if @forecast_total > @this_month_expense && @this_month_expense > 0
      diff = @forecast_total - @this_month_expense
      insights << {
        type:  :warning,
        icon:  "⚠️",
        title: "Gastos em alta",
        body:  "A previsão para o próximo mês (#{number_to_currency_brl(@forecast_total)}) supera os gastos deste mês em #{number_to_currency_brl(diff)}. Fique atento!"
      }
    end

    growing = @trends.find { |t| t[:delta] && t[:delta] > 15 }
    if growing
      insights << {
        type:  :warning,
        icon:  "📈",
        title: "Categoria em crescimento",
        body:  "\"#{growing[:name]}\" cresceu #{growing[:delta]}% em relação ao mês anterior. Considere revisar esses gastos."
      }
    end

    dropping = @trends.reverse.find { |t| t[:delta] && t[:delta] < -10 }
    if dropping
      insights << {
        type:  :success,
        icon:  "✅",
        title: "Boa redução de gastos",
        body:  "\"#{dropping[:name]}\" caiu #{dropping[:delta].abs}% em relação ao mês anterior. Continue assim!"
      }
    end

    if @this_month_balance > 0
      insights << {
        type:  :success,
        icon:  "💰",
        title: "Saldo positivo este mês",
        body:  "Você está no azul em #{number_to_currency_brl(@this_month_balance)} este mês. Ótimo trabalho!"
      }
    elsif @this_month_balance < 0
      insights << {
        type:  :danger,
        icon:  "🔴",
        title: "Saldo negativo este mês",
        body:  "Você gastou #{number_to_currency_brl(@this_month_balance.abs)} a mais do que recebeu este mês."
      }
    end

    periodo = @saving_rate_months == 1 ? "último mês" : "últimos #{@saving_rate_months} meses"

    if @avg_saving_rate < 10
      insights << {
        type:  :tip,
        icon:  "💡",
        title: "Dica: aumente sua taxa de economia",
        body:  "Sua taxa média de economia nos #{periodo} é #{@avg_saving_rate.round(1)}%. O ideal é economizar pelo menos 20% da renda. Tente reduzir os gastos nas categorias de maior impacto."
      }
    elsif @avg_saving_rate >= 20
      insights << {
        type:  :success,
        icon:  "🏆",
        title: "Excelente taxa de economia!",
        body:  "Você está economizando em média #{@avg_saving_rate.round(1)}% da sua renda nos #{periodo} — acima da meta recomendada de 20%. Continue!"
      }
    end

    insights
  end

  def number_to_currency_brl(value)
    ActionController::Base.helpers.number_to_currency(
      value,
      unit: "R$ ", separator: ",", delimiter: ".", precision: 2
    )
  end
end