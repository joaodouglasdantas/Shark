class LoansController < ApplicationController
  before_action :set_loan, only: %i[show edit update destroy]

  def index
    scope = current_user.loans.recent
    scope = scope.where(kind:   params[:kind])   if Loan::KINDS.include?(params[:kind])
    scope = scope.where(status: params[:status]) if Loan::STATUSES.include?(params[:status])

    @loans = scope

    @total_borrowed  = current_user.loans.borrowed.sum(:total_amount)
    @total_lent      = current_user.loans.lent.sum(:total_amount)
    @active_count    = current_user.loans.active.count
    @overdue_count   = current_user.loans.overdue.count
  end

  def show
    @payments = @loan.loan_payments.recent
    @new_payment = LoanPayment.new(paid_on: Date.current)
  end

  def new
    @loan = current_user.loans.new(start_date: Date.current, kind: "borrowed", status: "active")
  end

  def edit; end

  def create
    @loan = current_user.loans.new(loan_params)
    if @loan.save
      redirect_to @loan, notice: "Empréstimo cadastrado com sucesso."
    else
      render :new, status: :unprocessable_entity
    end
  end

  def update
    if @loan.update(loan_params)
      redirect_to @loan, notice: "Empréstimo atualizado."
    else
      render :edit, status: :unprocessable_entity
    end
  end

  def destroy
    @loan.destroy
    redirect_to loans_path, notice: "Empréstimo removido.", status: :see_other
  end

  private

  def set_loan
    @loan = current_user.loans.find(params[:id])
  end

  def loan_params
    params.require(:loan).permit(
      :name, :kind, :total_amount, :interest_rate,
      :installments_count, :start_date, :due_date, :status, :notes
    )
  end
end
