user = User.find_or_create_by!(email: "demo@lavix.app") do |u|
  u.password = "lavix123"
  u.password_confirmation = "lavix123"
end

categories_data = [
  { name: "Alimentação",      color: "#FF6B00" },
  { name: "Transporte",       color: "#F9A826" },
  { name: "Moradia",          color: "#E94560" },
  { name: "Lazer",            color: "#A78BFA" },
  { name: "Saúde",            color: "#34D399" },
  { name: "Educação",         color: "#22D3EE" },
  { name: "Salário",          color: "#10B981" },
  { name: "Outras receitas",  color: "#60A5FA" }
]

categories = categories_data.map do |attrs|
  user.categories.find_or_create_by!(name: attrs[:name]) { |c| c.color = attrs[:color] }
end

income_categories  = categories.select { |c| %w[Salário Outras\ receitas].include?(c.name) }
expense_categories = categories - income_categories

6.times do |month_offset|
  ref_date = Date.current.beginning_of_month - month_offset.months

  user.transactions.find_or_create_by!(
    category: income_categories.first,
    date: ref_date + 4.days,
    kind: "income",
    amount: 7500
  ) { |t| t.description = "Salário mensal" }

  if month_offset.even?
    user.transactions.find_or_create_by!(
      category: income_categories.last,
      date: ref_date + 15.days,
      kind: "income",
      amount: rand(300..900)
    ) { |t| t.description = "Freelance" }
  end

  rand(8..14).times do
    cat = expense_categories.sample
    day = rand(1..28)
    user.transactions.create!(
      category: cat,
      date: ref_date + day.days,
      kind: "expense",
      amount: rand(15..600),
      description: ["iFood", "Supermercado", "Uber", "Academia", "Netflix", "Livro", "Farmácia", "Conta de luz"].sample
    )
  end
end

puts "Seed concluído: #{User.count} usuário(s), #{Category.count} categoria(s), #{Transaction.count} lançamento(s)."
puts "Login demo: demo@lavix.app / lavix123"
