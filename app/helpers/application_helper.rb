module ApplicationHelper
  def brl(amount)
    number_to_currency(amount, unit: "R$", separator: ",", delimiter: ".", format: "%u %n")
  end

  def category_dot(category, size: 10)
    content_tag(:span, "", class: "dot",
                style: "background-color: #{category.color}; width:#{size}px; height:#{size}px;")
  end
end
