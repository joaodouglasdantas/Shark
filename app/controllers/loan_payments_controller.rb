class LoanPaymentsController < ApplicationController
  before_action :set_loan

  def create
    @payment = @loan.loan_payments.new(payment_params)
    if @payment.save
      create_linked_transaction!
      @loan.sync_status!
      redirect_to @loan, notice: "Pagamento registrado e lançado como despesa."
    else
      @payments    = @loan.loan_payments.recent
      @new_payment = @payment
      render "loans/show", status: :unprocessable_entity
    end
  end

  def destroy
    @payment = @loan.loan_payments.find(params[:id])
    @payment.linked_transaction&.destroy
    @payment.destroy
    @loan.sync_status!
    redirect_to @loan, notice: "Pagamento e despesa vinculada removidos.", status: :see_other
  end

  private

  def set_loan
    @loan = current_user.loans.find(params[:loan_id])
  end

  def payment_params
    params.require(:loan_payment).permit(:amount, :paid_on, :installment_number, :notes)
  end

  def create_linked_transaction!
    category = find_or_create_loans_category

    description = if @payment.installment_number.present?
      "Parcela #{@payment.installment_number} — #{@loan.name}"
    else
      "Empréstimo — #{@loan.name}"
    end

    transaction = current_user.transactions.create!(
      category:    category,
      amount:      @payment.amount,
      kind:        "expense",
      date:        @payment.paid_on,
      description: description
    )

    @payment.update_column(:transaction_id, transaction.id)
  end

  def find_or_create_loans_category
    current_user.categories.find_or_create_by(name: "Empréstimos") do |c|
      c.color = "#6366F1"
    end
  end
end
