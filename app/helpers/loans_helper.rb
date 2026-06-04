module LoansHelper
  def loan_kind_badge(loan)
    if loan.borrowed?
      content_tag(:span, "💸 Tomado", class: "badge-expense")
    else
      content_tag(:span, "🤝 Concedido", class: "badge-income")
    end
  end

  def loan_status_badge(loan)
    case loan.status
    when "paid"
      content_tag(:span, "✓ Pago",
        class: "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-300")
    when "overdue"
      content_tag(:span, "⚠ Em atraso",
        class: "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/15 text-red-300")
    else
      content_tag(:span, "● Ativo",
        class: "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-neon-500/15 text-neon-300")
    end
  end
end
